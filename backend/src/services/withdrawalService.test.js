import { jest } from "@jest/globals";

const mockStartSession = jest.fn();
const mockUserFindById = jest.fn();
const mockWithdrawalFindOne = jest.fn();
const mockWithdrawalCreate = jest.fn();
const mockWalletTransactionFindOne = jest.fn();
const mockWalletFindById = jest.fn();
const mockDebitWalletInTransaction = jest.fn();
const mockCreditWalletInTransaction = jest.fn();
const mockGetPayoutOption = jest.fn();
const mockCreateAuditLog = jest.fn();

jest.unstable_mockModule("mongoose", () => ({
  default: {
    startSession: mockStartSession,
    Types: {
      ObjectId: class {
        toString() {
          return "test-object-id";
        }
      }
    }
  }
}));

jest.unstable_mockModule("../models/User.js", () => ({
  default: { findById: mockUserFindById }
}));
jest.unstable_mockModule("../models/Withdrawal.js", () => ({
  default: { findOne: mockWithdrawalFindOne, create: mockWithdrawalCreate }
}));
jest.unstable_mockModule("../models/WalletTransaction.js", () => ({
  default: { findOne: mockWalletTransactionFindOne }
}));
jest.unstable_mockModule("../models/Wallet.js", () => ({
  default: { findById: mockWalletFindById }
}));
jest.unstable_mockModule("./walletService.js", () => ({
  debitWalletInTransaction: mockDebitWalletInTransaction,
  creditWalletInTransaction: mockCreditWalletInTransaction
}));
jest.unstable_mockModule("./payoutOptionService.js", () => ({
  getPayoutOption: mockGetPayoutOption
}));
jest.unstable_mockModule("./auditLogService.js", () => ({
  createAuditLog: mockCreateAuditLog
}));

const { createWithdrawal, getWithdrawal, rejectWithdrawal } =
  await import("./withdrawalService.js");

const userId = "user-1";
const payoutOption = {
  optionId: "UPI_10",
  method: "UPI",
  name: "INR 10 UPI",
  currency: "VE",
  requiredAmount: 2400,
  payoutAmount: 10,
  payoutCurrency: "INR"
};

const makeDocument = (fields) => ({
  ...fields,
  toObject() {
    return { ...fields };
  }
});

const makeQuery = (read) => {
  const query = {
    sessionValue: null,
    session(session) {
      query.sessionValue = session;
      return query;
    },
    lean: jest.fn(async () => {
      const result = await read(query.sessionValue);
      return result?.toObject ? result.toObject() : result;
    }),
    then(resolve, reject) {
      return Promise.resolve(read(query.sessionValue)).then(resolve, reject);
    }
  };
  return query;
};

const makeSession = (withTransaction = async (callback) => callback()) => ({
  withTransaction,
  endSession: jest.fn(async () => {})
});

const mockActiveUser = () => {
  mockUserFindById.mockReturnValue({
    select: jest.fn(() => ({
      lean: jest.fn(async () => ({
        _id: userId,
        accountStatus: "ACTIVE",
        walletId: "wallet-1"
      }))
    }))
  });
};

const request = {
  userId,
  optionId: payoutOption.optionId,
  payoutDetails: { upiId: "demo@upi" },
  idempotencyKey: "withdrawal-key-1"
};

beforeEach(() => {
  jest.clearAllMocks();
  mockActiveUser();
  mockGetPayoutOption.mockResolvedValue(payoutOption);
  mockCreateAuditLog.mockResolvedValue(undefined);
});

describe("withdrawal service edge cases", () => {
  test("rejects insufficient balance without creating a withdrawal", async () => {
    mockWithdrawalFindOne.mockReturnValue(makeQuery(async () => null));
    mockStartSession.mockResolvedValue(makeSession());
    mockDebitWalletInTransaction.mockRejectedValue(
      new Error("Insufficient wallet balance")
    );

    await expect(createWithdrawal(request)).rejects.toThrow(
      "Insufficient wallet balance"
    );

    expect(mockDebitWalletInTransaction).toHaveBeenCalledTimes(1);
    expect(mockWithdrawalCreate).not.toHaveBeenCalled();
    expect(mockCreateAuditLog).not.toHaveBeenCalled();
  });

  test("serializes concurrent requests with the same idempotency key", async () => {
    let storedWithdrawal = null;
    let initialLookups = 0;
    let duplicateFoundInTransaction = false;
    let transactionQueue = Promise.resolve();
    let releaseInitialLookups;
    const initialLookupBarrier = new Promise((resolve) => {
      releaseInitialLookups = resolve;
    });
    const withdrawal = makeDocument({
      withdrawalId: "WD_test_1",
      userId,
      walletId: "wallet-1",
      transactionId: "TXN_test_1",
      status: "PENDING"
    });
    const transaction = makeDocument({ transactionId: "TXN_test_1" });
    const wallet = makeDocument({ _id: "wallet-1", ves: 1000 });

    mockWithdrawalFindOne.mockImplementation((filter) =>
      makeQuery(async (session) => {
        if (filter.userId === userId && filter.idempotencyKey) {
          if (session && storedWithdrawal) {
            duplicateFoundInTransaction = true;
          }
          if (!session) {
            initialLookups += 1;
            if (initialLookups === 2) releaseInitialLookups();
            await initialLookupBarrier;
          }
          return storedWithdrawal;
        }
        return null;
      })
    );
    mockWalletTransactionFindOne.mockReturnValue(
      makeQuery(async () => transaction)
    );
    mockWalletFindById.mockReturnValue(makeQuery(async () => wallet));
    mockStartSession.mockImplementation(async () =>
      makeSession(async (callback) => {
        const previousTransaction = transactionQueue;
        let release;
        transactionQueue = new Promise((resolve) => {
          release = resolve;
        });
        await previousTransaction;
        try {
          return await callback();
        } finally {
          release();
        }
      })
    );
    mockDebitWalletInTransaction.mockResolvedValue({ wallet, transaction });
    mockWithdrawalCreate.mockImplementation(async () => {
      storedWithdrawal = withdrawal;
      return [withdrawal];
    });

    const results = await Promise.all([
      createWithdrawal(request),
      createWithdrawal(request)
    ]);

    expect(mockDebitWalletInTransaction).toHaveBeenCalledTimes(1);
    expect(mockWithdrawalCreate).toHaveBeenCalledTimes(1);
    expect(duplicateFoundInTransaction).toBe(true);
    expect(results.map((result) => result.withdrawal.withdrawalId)).toEqual([
      "WD_test_1",
      "WD_test_1"
    ]);
    expect(results.filter((result) => result.idempotent)).toHaveLength(1);
  });

  test("scopes withdrawal lookup to the requesting user", async () => {
    mockWithdrawalFindOne.mockReturnValue(makeQuery(async () => null));

    await expect(getWithdrawal(userId, "WD_other_user")).rejects.toThrow(
      "Withdrawal not found"
    );

    expect(mockWithdrawalFindOne).toHaveBeenCalledWith({
      withdrawalId: "WD_other_user",
      userId
    });
  });

  test("creates a compensating wallet credit when rejecting a withdrawal", async () => {
    const withdrawal = {
      withdrawalId: "WD_test_reject",
      userId,
      currency: "VE",
      currencyAmount: 2400,
      transactionId: "TXN_withdrawal_debit",
      status: "PROCESSING",
      save: jest.fn(async () => {}),
      toObject() {
        return { ...this };
      }
    };
    const reversalWallet = makeDocument({ _id: "wallet-1", ves: 3400 });
    const reversalTransaction = makeDocument({
      transactionId: "TXN_reversal",
      type: "WITHDRAWAL_REVERSAL",
      amount: 2400
    });
    mockWithdrawalFindOne.mockReturnValue({
      session: jest.fn(async () => withdrawal)
    });
    mockStartSession.mockResolvedValue(makeSession());
    mockCreditWalletInTransaction.mockResolvedValue({
      wallet: reversalWallet,
      transaction: reversalTransaction
    });

    const result = await rejectWithdrawal({
      withdrawalId: withdrawal.withdrawalId,
      rejectionReason: "Invalid payout details",
      actorId: "admin-1"
    });

    expect(mockCreditWalletInTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        currency: "VE",
        amount: 2400,
        type: "WITHDRAWAL_REVERSAL",
        referenceId: withdrawal.withdrawalId
      })
    );
    expect(withdrawal.status).toBe("REJECTED");
    expect(withdrawal.save).toHaveBeenCalledTimes(1);
    expect(result.wallet.ves).toBe(3400);
    expect(result.transaction.type).toBe("WITHDRAWAL_REVERSAL");
  });
});