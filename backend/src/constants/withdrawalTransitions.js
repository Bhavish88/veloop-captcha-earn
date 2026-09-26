export const WITHDRAWAL_TRANSITIONS = Object.freeze({
  PENDING: Object.freeze([
    "PROCESSING"
  ]),

  PROCESSING: Object.freeze([
    "APPROVED",
    "REJECTED",
    "CANCELLED"
  ]),

  APPROVED: Object.freeze([]),

  REJECTED: Object.freeze([]),

  CANCELLED: Object.freeze([])
});