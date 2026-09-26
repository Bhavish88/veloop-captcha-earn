export const USER_ROLES = Object.freeze([
  "USER",
  "ADMIN"
]);

export const CURRENCY_FIELD_MAP = Object.freeze({
  VE: "ves",
  SVE: "sves",
  GEM: "gems",
  TOKEN: "tokens",
  SPIN: "spins"
});

export const ACCOUNT_STATUS = Object.freeze([
  "ACTIVE",
  "SUSPENDED",
  "BLOCKED",
  "CLOSED"
]);

export const CREDIT_TRANSACTION_TYPES = Object.freeze([
  "REWARD",
  "BONUS",
  "REFERRAL",
  "DAILY_REWARD",
  "AD_REWARD",
  "GAME_REWARD",
  "ADMIN_CREDIT",
  "EXCHANGE_CREDIT",
  "WITHDRAWAL_REVERSAL"
]);

export const DEBIT_TRANSACTION_TYPES = Object.freeze([
  "WITHDRAWAL",
  "EXCHANGE_DEBIT",
  "ADMIN_DEBIT",
  "CORRECTION"
]);

export const CURRENCIES = Object.freeze([
  "VE",
  "SVE",
  "GEM",
  "TOKEN",
  "SPIN"
]);

export const MAX_WALLET_BALANCE = Number.MAX_SAFE_INTEGER;

export const TRANSACTION_DIRECTIONS = Object.freeze([
  "CREDIT",
  "DEBIT"
]);

export const TRANSACTION_TYPES = Object.freeze([
  "REWARD",
  "BONUS",
  "REFERRAL",
  "DAILY_REWARD",
  "AD_REWARD",
  "GAME_REWARD",
  "ADMIN_CREDIT",
  "EXCHANGE_CREDIT",

  "WITHDRAWAL",
  "EXCHANGE_DEBIT",
  "ADMIN_DEBIT",
  "CORRECTION",
  "WITHDRAWAL_REVERSAL"
]);

export const TRANSACTION_STATUS = Object.freeze([
  "COMPLETED",
  "REVERSED"
]);

export const WITHDRAWAL_STATUS = Object.freeze([
  "PENDING",
  "PROCESSING",
  "APPROVED",
  "REJECTED",
  "CANCELLED"
]);

export const PAYOUT_METHODS = Object.freeze([
  "UPI",
  "PAYPAL",
  "AMAZON",
  "GOOGLE_PLAY"
]);

export const PAYOUT_TYPES = Object.freeze([
  "UPI",
  "PAYPAL",
  "GIFT_CARD",
  "BANK"
]);

export const AUDIT_ACTIONS = Object.freeze([
    "WITHDRAWAL_CREATED",
  "WITHDRAWAL_PROCESSING",
    "WITHDRAWAL_APPROVED",
    "WITHDRAWAL_REJECTED",
    "WITHDRAWAL_CANCELLED",
    "WALLET_CREDIT",
    "WALLET_DEBIT",
    "BALANCE_CORRECTION",
    "PAYOUT_CONFIGURATION_CHANGED"
]);