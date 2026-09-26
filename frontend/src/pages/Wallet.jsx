import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import DashboardNavbar from "../components/DashboardNavbar";

const transactionLimit = 10;
const currencies = [
  ["VE", "ves"],
  ["SVE", "sves"],
  ["GEM", "gems"],
  ["TOKEN", "tokens"],
  ["SPIN", "spins"],
];

const formatAmount = (value) => Number(value ?? 0).toLocaleString();

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState("");
  const [walletRetry, setWalletRetry] = useState(0);

  const [transactions, setTransactions] = useState([]);
  const [transactionPage, setTransactionPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState("");
  const [transactionsRetry, setTransactionsRetry] = useState(0);

  useEffect(() => {
    let active = true;

    api
      .get("/wallet")
      .then((response) => {
        if (!active) return;
        setWallet(response.data.data.wallet);
        setWalletError("");
      })
      .catch((error) => {
        if (!active) return;
        setWalletError(
          error.response?.data?.error?.message ||
            "Unable to load wallet balances."
        );
      })
      .finally(() => {
        if (active) setWalletLoading(false);
      });

    return () => {
      active = false;
    };
  }, [walletRetry]);

  useEffect(() => {
    let active = true;

    api
      .get("/wallet/transactions", {
        params: { page: transactionPage, limit: transactionLimit },
      })
      .then((response) => {
        if (!active) return;
        const result = response.data.data;
        setTransactions(result.transactions || []);
        setTotalPages(result.pagination?.totalPages || 0);
        setTransactionsError("");
      })
      .catch((error) => {
        if (!active) return;
        setTransactionsError(
          error.response?.data?.error?.message ||
            "Unable to load transactions."
        );
      })
      .finally(() => {
        if (active) setTransactionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [transactionPage, transactionsRetry]);

  const retryWallet = () => {
    setWalletLoading(true);
    setWalletRetry((value) => value + 1);
  };

  const retryTransactions = () => {
    setTransactionsLoading(true);
    setTransactionsRetry((value) => value + 1);
  };

  const changeTransactionPage = (page) => {
    setTransactionsLoading(true);
    setTransactionPage(page);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <DashboardNavbar />
      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <section className="mb-8">
          <Link
            to="/dashboard"
            className="mb-5 inline-block text-sm font-medium text-neutral-500 underline-offset-4 hover:text-black hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
          <p className="mt-2 text-sm text-neutral-500">
            View your wallet balances and recorded activity.
          </p>
        </section>

        <section aria-labelledby="wallet-balances-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="wallet-balances-heading" className="text-xl font-bold">
                Current balances
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Currency balances returned by the wallet service.
              </p>
            </div>
            <Link
              to="/withdraw"
              className="rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            >
              Withdraw VE
            </Link>
          </div>

          {walletLoading ? (
            <p className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500" role="status">
              Loading wallet balances...
            </p>
          ) : walletError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6" role="alert">
              <p className="text-sm text-red-700">{walletError}</p>
              <button
                type="button"
                onClick={retryWallet}
                className="mt-3 text-sm font-semibold text-red-800 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {currencies.map(([currency, field]) => (
                <article
                  key={currency}
                  className={`rounded-2xl border p-5 ${currency === "VE" ? "border-yellow-200 bg-yellow-50" : "border-neutral-200 bg-white"}`}
                >
                  <h3 className="text-xs font-medium text-neutral-500">{currency}</h3>
                  <p className="mt-3 break-words text-2xl font-bold">
                    {formatAmount(wallet?.[field])}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10" aria-labelledby="wallet-transactions-heading">
          <div className="mb-4">
            <h2 id="wallet-transactions-heading" className="text-xl font-bold">
              Transaction history
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Wallet ledger entries, newest first.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {transactionsLoading ? (
              <p className="p-8 text-center text-sm text-neutral-500" role="status">
                Loading transactions...
              </p>
            ) : transactionsError ? (
              <div className="p-6" role="alert">
                <p className="text-sm text-red-700">{transactionsError}</p>
                <button
                  type="button"
                  onClick={retryTransactions}
                  className="mt-3 text-sm font-semibold text-neutral-900 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Retry
                </button>
              </div>
            ) : transactions.length === 0 ? (
              <p className="p-8 text-center text-sm text-neutral-500">
                No transactions yet.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left">
                    <thead className="border-b border-neutral-200 bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase text-neutral-500">Type</th>
                        <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase text-neutral-500">Amount</th>
                        <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase text-neutral-500">Balance after</th>
                        <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase text-neutral-500">Status</th>
                        <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase text-neutral-500">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {transactions.map((transaction) => (
                        <tr key={transaction.transactionId}>
                          <td className="px-5 py-4 text-sm font-medium">{transaction.type}</td>
                          <td className={`px-5 py-4 text-sm font-semibold ${transaction.direction === "CREDIT" ? "text-green-700" : "text-red-700"}`}>
                            {transaction.direction === "CREDIT" ? "+" : "-"}
                            {formatAmount(transaction.amount)} {transaction.currency}
                          </td>
                          <td className="px-5 py-4 text-sm text-neutral-600">
                            {formatAmount(transaction.balanceAfter)} {transaction.currency}
                          </td>
                          <td className="px-5 py-4 text-sm">{transaction.status}</td>
                          <td className="px-5 py-4 text-sm text-neutral-500">{formatDate(transaction.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4">
                  <span className="text-xs text-neutral-500">
                    Page {transactionPage} of {Math.max(totalPages, 1)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => changeTransactionPage(transactionPage - 1)}
                      disabled={transactionPage <= 1 || transactionsLoading}
                      className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => changeTransactionPage(transactionPage + 1)}
                      disabled={transactionsLoading || transactionPage >= totalPages}
                      className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Wallet;
