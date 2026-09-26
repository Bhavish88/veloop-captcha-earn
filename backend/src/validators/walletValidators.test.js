import mongoose from "mongoose";
import Wallet from "../models/Wallet.js";
import { MAX_WALLET_BALANCE } from "../constants/enums.js";
import { validateAmount } from "./walletValidators.js";

describe("wallet amount bounds", () => {
  test("accepts the maximum safe integer amount", () => {
    expect(() => validateAmount(MAX_WALLET_BALANCE)).not.toThrow();
  });

  test.each([
    MAX_WALLET_BALANCE + 1,
    1.5,
    0,
    -1
  ])("rejects invalid amount %s", (amount) => {
    expect(() => validateAmount(amount)).toThrow(
      "Amount must be a positive safe integer"
    );
  });

  test("rejects wallet balances above the maximum", async () => {
    const wallet = new Wallet({
      userId: new mongoose.Types.ObjectId(),
      ves: MAX_WALLET_BALANCE + 1
    });

    await expect(wallet.validate()).rejects.toHaveProperty("errors.ves");
  });
});