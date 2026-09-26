import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import AdminNavbar from "../../components/admin/AdminNavbar";

const CURRENCIES = [
  "VE",
  "SVE",
  "GEM",
  "TOKEN",
  "SPIN",
];

const getStatusStyles = (status) => {
  switch (status?.toUpperCase()) {
    case "RECONCILED":
    case "MATCH":
    case "MATCHED":
      return "bg-green-50 text-green-700 ring-green-200";

    case "MISMATCH":
    case "UNRECONCILED":
      return "bg-red-50 text-red-700 ring-red-200";

    default:
      return "bg-neutral-100 text-neutral-600 ring-neutral-200";
  }
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${getStatusStyles(
      status
    )}`}
  >
    {status || "UNKNOWN"}
  </span>
);

const formatNumber = (value) => {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "-";
  }

  return number.toLocaleString();
};

export default function Reconciliation() {
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setResult(null);

    const trimmedUserId = userId.trim();

    if (!trimmedUserId) {
      setError("User ID is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.get(
        `/admin/reconciliation/${trimmedUserId}`
      );

      setResult(response.data?.data || null);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          "Unable to reconcile wallet."
      );
    } finally {
      setLoading(false);
    }
  };

  const isReconciled = result?.reconciled === true;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <AdminNavbar />

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        {/* PAGE HEADER */}
        <section className="mb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-600">
                Admin / Audit
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Wallet Reconciliation
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                Compare wallet balances against the transaction
                ledger.
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

        {/* SEARCH */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="max-w-3xl">
            <div>
              <h2 className="text-base font-bold">
                Run Reconciliation
              </h2>

              <p className="mt-1 text-sm leading-6 text-neutral-500">
                Enter a user ID to compare the current wallet
                balances with the corresponding ledger balances.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6"
            >
              <label
                htmlFor="reconciliation-user-id"
                className="mb-2 block text-sm font-semibold text-neutral-800"
              >
                User ID
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="reconciliation-user-id"
                  type="text"
                  value={userId}
                  onChange={(event) =>
                    setUserId(event.target.value)
                  }
                  placeholder="Enter user ID"
                  required
                  className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-100"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Reconciling..."
                    : "Run Reconciliation"}
                </button>
              </div>
            </form>

            {/* ERROR */}
            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                  !
                </div>

                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Reconciliation failed
                  </p>

                  <p className="mt-0.5 text-sm text-red-600">
                    {error}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RESULTS */}
        {result && (
          <section className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {/* RESULT HEADER */}
            <div className="border-b border-neutral-200 px-6 py-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
                    Reconciliation Result
                  </p>

                  <h2 className="mt-2 text-xl font-bold">
                    Wallet Audit
                  </h2>

                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 sm:gap-x-8">
                    <p>
                      <span className="text-neutral-400">
                        User ID:
                      </span>{" "}
                      <span className="font-mono font-semibold text-neutral-800">
                        {result.userId}
                      </span>
                    </p>

                    <p>
                      <span className="text-neutral-400">
                        Wallet ID:
                      </span>{" "}
                      <span className="font-mono font-semibold text-neutral-800">
                        {result.walletId}
                      </span>
                    </p>
                  </div>
                </div>

                <div
                  className={[
                    "flex items-center gap-2 rounded-xl px-4 py-3",
                    isReconciled
                      ? "bg-green-50"
                      : "bg-red-50",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "h-2.5 w-2.5 rounded-full",
                      isReconciled
                        ? "bg-green-500"
                        : "bg-red-500",
                    ].join(" ")}
                  />

                  <span
                    className={[
                      "text-xs font-bold uppercase tracking-wide",
                      isReconciled
                        ? "text-green-700"
                        : "text-red-700",
                    ].join(" ")}
                  >
                    {isReconciled
                      ? "RECONCILED"
                      : "MISMATCH"}
                  </span>
                </div>
              </div>
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                      Currency
                    </th>

                    <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                      Wallet Balance
                    </th>

                    <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                      Ledger Credits
                    </th>

                    <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                      Ledger Debits
                    </th>

                    <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                      Ledger Balance
                    </th>

                    <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                      Difference
                    </th>

                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100">
                  {CURRENCIES.map((currency) => {
                    const data =
                      result.currencies?.[currency];

                    if (!data) {
                      return (
                        <tr
                          key={currency}
                          className="hover:bg-neutral-50"
                        >
                          <td className="px-6 py-4">
                            <span className="font-bold">
                              {currency}
                            </span>
                          </td>

                          <td
                            colSpan="6"
                            className="px-6 py-4 text-sm text-neutral-400"
                          >
                            No reconciliation data
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={currency}
                        className="transition hover:bg-neutral-50"
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-800">
                            {currency}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-semibold">
                          {formatNumber(
                            data.walletBalance
                          )}
                        </td>

                        <td className="px-6 py-4 text-right text-sm text-neutral-600">
                          {formatNumber(
                            data.ledgerCredits
                          )}
                        </td>

                        <td className="px-6 py-4 text-right text-sm text-neutral-600">
                          {formatNumber(
                            data.ledgerDebits
                          )}
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-semibold">
                          {formatNumber(
                            data.ledgerBalance
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <span
                            className={[
                              "text-sm font-bold",
                              Number(data.difference) === 0
                                ? "text-neutral-700"
                                : "text-red-600",
                            ].join(" ")}
                          >
                            {formatNumber(data.difference)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge
                            status={data.status}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE / TABLET CARDS */}
            <div className="divide-y divide-neutral-200 lg:hidden">
              {CURRENCIES.map((currency) => {
                const data =
                  result.currencies?.[currency];

                if (!data) {
                  return (
                    <div key={currency} className="p-5">
                      <div className="flex items-center justify-between">
                        <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-bold">
                          {currency}
                        </span>

                        <span className="text-xs text-neutral-400">
                          No reconciliation data
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <article key={currency} className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-bold">
                        {currency}
                      </span>

                      <StatusBadge
                        status={data.status}
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                          Wallet Balance
                        </p>

                        <p className="mt-1 text-sm font-bold">
                          {formatNumber(
                            data.walletBalance
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                          Ledger Balance
                        </p>

                        <p className="mt-1 text-sm font-bold">
                          {formatNumber(
                            data.ledgerBalance
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                          Ledger Credits
                        </p>

                        <p className="mt-1 text-sm text-neutral-600">
                          {formatNumber(
                            data.ledgerCredits
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                          Ledger Debits
                        </p>

                        <p className="mt-1 text-sm text-neutral-600">
                          {formatNumber(
                            data.ledgerDebits
                          )}
                        </p>
                      </div>

                      <div className="col-span-2 border-t border-neutral-100 pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                          Difference
                        </p>

                        <p
                          className={[
                            "mt-1 text-lg font-bold",
                            Number(data.difference) === 0
                              ? "text-neutral-800"
                              : "text-red-600",
                          ].join(" ")}
                        >
                          {formatNumber(data.difference)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* RESULT FOOTER */}
            <div
              className={[
                "border-t px-6 py-4",
                isReconciled
                  ? "border-green-100 bg-green-50/50"
                  : "border-red-100 bg-red-50/50",
              ].join(" ")}
            >
              <p
                className={[
                  "text-xs font-medium",
                  isReconciled
                    ? "text-green-700"
                    : "text-red-700",
                ].join(" ")}
              >
                {isReconciled
                  ? "The wallet and ledger are reconciled according to the returned reconciliation result."
                  : "A mismatch was detected in the returned reconciliation result. Review the currency-level differences above."}
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}