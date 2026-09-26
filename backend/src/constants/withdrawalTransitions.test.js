import { WITHDRAWAL_TRANSITIONS } from "./withdrawalTransitions.js";

describe("withdrawal status transitions", () => {
  test("requires pending withdrawals to enter processing first", () => {
    expect(WITHDRAWAL_TRANSITIONS.PENDING).toEqual(["PROCESSING"]);
  });

  test("allows all terminal outcomes only from processing", () => {
    expect(WITHDRAWAL_TRANSITIONS.PROCESSING).toEqual([
      "APPROVED",
      "REJECTED",
      "CANCELLED"
    ]);

    for (const status of ["APPROVED", "REJECTED", "CANCELLED"]) {
      expect(WITHDRAWAL_TRANSITIONS[status]).toEqual([]);
    }
  });
});