import AppError from "../errors/AppError.js";
import {
  CURRENCIES,
  CREDIT_TRANSACTION_TYPES,
  DEBIT_TRANSACTION_TYPES,
  MAX_WALLET_BALANCE
} from "../constants/enums.js";

export const validateAmount = (amount) => {
  if (typeof amount !== "number") {
    throw new AppError(
      "Amount must be a number",
      "INVALID_AMOUNT_TYPE",
      400
    );
  }

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new AppError(
      `Amount must be a positive safe integer no greater than ${MAX_WALLET_BALANCE}`,
      "INVALID_AMOUNT",
      400
    );
  }
};

export const validateCurrency = (currency) => {
  if (!CURRENCIES.includes(currency)) {
    throw new AppError(
      "Invalid wallet currency",
      "INVALID_CURRENCY",
      400
    );
  }
};

export const validateSource = (source) => {
  if (typeof source !== "string" || source.trim().length === 0) {
    throw new AppError(
      "Transaction source is required",
      "INVALID_SOURCE",
      400
    );
  }
};

export const validateCreditTransactionType = (type) => {
  if (!CREDIT_TRANSACTION_TYPES.includes(type)) {
    throw new AppError(
      "Invalid credit transaction type",
      "INVALID_TRANSACTION_TYPE",
      400
    );
  }
};

export const validateDebitTransactionType = (type) => {
  if (!DEBIT_TRANSACTION_TYPES.includes(type)) {
    throw new AppError(
      "Invalid debit transaction type",
      "INVALID_TRANSACTION_TYPE",
      400
    );
  }
};