import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import AdminNavbar from "../../components/admin/AdminNavbar";
import {
  getRequestFingerprint,
  loadIdempotencyKeys,
  persistIdempotencyKeys,
} from "../../services/idempotencyKeys";

const CURRENCIES = [
  "VE",
  "SVE",
  "GEM",
  "TOKEN",
  "SPIN",
];
const idempotencyStorageKey = "pendingAdminWalletIdempotencyKeys";

export default function AdminWallet() {
  const idempotencyKeys = useRef(
    loadIdempotencyKeys(idempotencyStorageKey)
  );
  const [form, setForm] = useState({
    userId: "",
    currency: "VE",
    amount: "",
    description: "",
  });

  const [operation, setOperation] = useState("credit");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleOperationChange = (nextOperation) => {
    setOperation(nextOperation);
    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.userId.trim()) {
      setError("User ID is required.");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError(
        `Amount must be a positive safe integer up to ${Number.MAX_SAFE_INTEGER}.`
      );
      return;
    }

    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    const payload = {
      userId: form.userId.trim(),
      currency: form.currency,
      amount,
      description: form.description.trim(),
    };

    try {
      setLoading(true);

      const requestFingerprint = await getRequestFingerprint({
        operation,
        ...payload,
      });
      let idempotencyKey =
        idempotencyKeys.current.get(requestFingerprint);

      if (!idempotencyKey) {
        idempotencyKey = crypto.randomUUID();
        idempotencyKeys.current.set(requestFingerprint, idempotencyKey);
        persistIdempotencyKeys(
          idempotencyStorageKey,
          idempotencyKeys.current
        );
      }

      const response = await api.post(
        `/admin/wallet/${operation}`,
        payload,
        {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        }
      );

      const transaction = response.data?.data?.transaction;
      if (!transaction?.transactionId) {
        throw new Error("Wallet operation response was incomplete.");
      }

      idempotencyKeys.current.delete(requestFingerprint);
      persistIdempotencyKeys(
        idempotencyStorageKey,
        idempotencyKeys.current
      );

      setMessage(
        `Wallet ${operation} completed successfully.`
      );

      setForm((current) => ({
        ...current,
        userId: "",
        amount: "",
        description: "",
      }));
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          `Unable to ${operation} wallet.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <AdminNavbar />

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        {/* PAGE HEADER */}
        <section className="mb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-600">
                Admin / Wallet
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Wallet Operations
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                Perform authorized wallet credits and debits.
              </p>
            </div>

            <Link
              to="/admin"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:text-neutral-950"
            >
              <span aria-hidden="true">←</span>
              Dashboard
            </Link>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
          {/* OPERATION FORM */}
          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 px-6 py-5">
              <h2 className="text-base font-bold">
                Wallet Adjustment
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Select an operation and provide the required
                wallet details.
              </p>
            </div>

            <div className="p-6">
              {/* OPERATION TOGGLE */}
              <div className="mb-7 rounded-xl bg-neutral-100 p-1">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleOperationChange("credit")
                    }
                    className={[
                      "rounded-lg px-4 py-2.5 text-sm font-semibold transition",
                      operation === "credit"
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-900",
                    ].join(" ")}
                  >
                    Credit Wallet
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleOperationChange("debit")
                    }
                    className={[
                      "rounded-lg px-4 py-2.5 text-sm font-semibold transition",
                      operation === "debit"
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-900",
                    ].join(" ")}
                  >
                    Debit Wallet
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  {/* USER ID */}
                  <div>
                    <label
                      htmlFor="userId"
                      className="mb-2 block text-sm font-semibold text-neutral-800"
                    >
                      User ID
                    </label>

                    <input
                      id="userId"
                      name="userId"
                      type="text"
                      value={form.userId}
                      onChange={handleChange}
                      placeholder="Enter user ID"
                      required
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-100"
                    />

                    <p className="mt-1.5 text-xs text-neutral-400">
                      Enter the exact user identifier associated
                      with the wallet.
                    </p>
                  </div>

                  {/* CURRENCY */}
                  <div>
                    <label
                      htmlFor="currency"
                      className="mb-2 block text-sm font-semibold text-neutral-800"
                    >
                      Currency
                    </label>

                    <select
                      id="currency"
                      name="currency"
                      value={form.currency}
                      onChange={handleChange}
                      className="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-950 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-100"
                    >
                      {CURRENCIES.map((currency) => (
                        <option
                          key={currency}
                          value={currency}
                        >
                          {currency}
                        </option>
                      ))}
                    </select>

                    <p className="mt-1.5 text-xs text-neutral-400">
                      Select the wallet currency to adjust.
                    </p>
                  </div>

                  {/* AMOUNT */}
                  <div>
                    <label
                      htmlFor="amount"
                      className="mb-2 block text-sm font-semibold text-neutral-800"
                    >
                      Amount
                    </label>

                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      min="1"
                      max={Number.MAX_SAFE_INTEGER}
                      step="1"
                      value={form.amount}
                      onChange={handleChange}
                      placeholder="Enter amount"
                      required
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-100"
                    />

                    <p className="mt-1.5 text-xs text-neutral-400">
                      Amount must be a positive whole number.
                    </p>
                  </div>

                  {/* DESCRIPTION */}
                  <div>
                    <label
                      htmlFor="description"
                      className="mb-2 block text-sm font-semibold text-neutral-800"
                    >
                      Description
                    </label>

                    <textarea
                      id="description"
                      name="description"
                      rows="4"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Reason for this wallet operation"
                      required
                      className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-100"
                    />

                    <p className="mt-1.5 text-xs text-neutral-400">
                      This description is submitted with the
                      wallet operation.
                    </p>
                  </div>
                </div>

                {/* ERROR */}
                {error && (
                  <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                      !
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-red-700">
                        Operation failed
                      </p>

                      <p className="mt-0.5 text-sm text-red-600">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {/* SUCCESS */}
                {message && (
                  <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600">
                      ✓
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-green-700">
                        Operation completed
                      </p>

                      <p className="mt-0.5 text-sm text-green-600">
                        {message}
                      </p>
                    </div>
                  </div>
                )}

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={loading}
                  className={[
                    "mt-7 w-full rounded-xl px-5 py-3 text-sm font-bold transition",
                    operation === "credit"
                      ? "bg-neutral-950 text-white hover:bg-neutral-800"
                      : "bg-red-600 text-white hover:bg-red-700",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  ].join(" ")}
                >
                  {loading
                    ? "Processing..."
                    : operation === "credit"
                      ? "Credit Wallet"
                      : "Debit Wallet"}
                </button>
              </form>
            </div>
          </section>

          {/* INFORMATION PANEL */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-950 text-sm font-bold text-yellow-400">
                i
              </div>

              <h2 className="mt-5 text-base font-bold">
                Wallet Operation Rules
              </h2>

              <ul className="mt-5 space-y-4">
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />

                  <p className="text-sm leading-6 text-neutral-500">
                    Only authenticated administrators can
                    perform wallet operations.
                  </p>
                </li>

                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />

                  <p className="text-sm leading-6 text-neutral-500">
                    Every operation creates a wallet ledger
                    transaction.
                  </p>
                </li>

                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />

                  <p className="text-sm leading-6 text-neutral-500">
                    The backend validates the target user,
                    currency and amount.
                  </p>
                </li>

                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />

                  <p className="text-sm leading-6 text-neutral-500">
                    The frontend does not directly modify
                    wallet balances.
                  </p>
                </li>

                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />

                  <p className="text-sm leading-6 text-neutral-500">
                    A description is recorded for auditability.
                  </p>
                </li>
              </ul>
            </section>

            {/* WARNING */}
            <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-sm font-bold text-yellow-700">
                  !
                </div>

                <div>
                  <h2 className="text-sm font-bold text-yellow-900">
                    Administrative action
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-yellow-800">
                    Wallet credits and debits affect real wallet
                    balances. Verify the user ID and amount before
                    submitting.
                  </p>
                </div>
              </div>
            </section>

            {/* CURRENT OPERATION */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
                Current operation
              </p>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {operation === "credit"
                    ? "Credit Wallet"
                    : "Debit Wallet"}
                </span>

                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                    operation === "credit"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700",
                  ].join(" ")}
                >
                  {operation}
                </span>
              </div>

              <div className="mt-4 border-t border-neutral-100 pt-4">
                <p className="text-xs text-neutral-400">
                  Currency
                </p>

                <p className="mt-1 text-lg font-bold">
                  {form.currency}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}