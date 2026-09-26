import AppError from "./AppError.js";

export class InvalidCurrencyError extends AppError {
  constructor() {
    super(
      "Invalid wallet currency",
      "INVALID_CURRENCY",
      400
    );
  }
}

export class InvalidAmountError extends AppError {
  constructor() {
    super(
      "Amount must be a positive safe integer",
      "INVALID_AMOUNT",
      400
    );
  }
}

export class WalletNotFoundError extends AppError {
  constructor() {
    super(
      "Wallet not found",
      "WALLET_NOT_FOUND",
      404
    );
  }
}

export class InsufficientBalanceError extends AppError {
  constructor() {
    super(
      "Insufficient wallet balance",
      "INSUFFICIENT_BALANCE",
      400
    );
  }
}

export class InvalidTransactionTypeError extends AppError {
  constructor() {
    super(
      "Invalid transaction type for this operation",
      "INVALID_TRANSACTION_TYPE",
      400
    );
  }
}

export class WalletBalanceLimitError extends AppError {
  constructor() {
    super(
      "Wallet balance would exceed the maximum supported value",
      "WALLET_BALANCE_LIMIT_EXCEEDED",
      400
    );
  }
}