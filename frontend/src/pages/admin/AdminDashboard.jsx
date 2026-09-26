import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import AdminNavbar from "../../components/admin/AdminNavbar";

const STATUS_CARDS = [
  {
    status: "PENDING",
    label: "Pending Withdrawals",
    description: "Awaiting review",
  },
  {
    status: "PROCESSING",
    label: "Processing",
    description: "Currently being processed",
  },
  {
    status: "APPROVED",
    label: "Approved for payout",
    description: "Approval recorded; payment is not tracked",
  },
  {
    status: "REJECTED",
    label: "Rejected",
    description: "Requests rejected",
  },
  {
    status: "CANCELLED",
    label: "Cancelled",
    description: "Requests cancelled",
  },
];

const ACTIONS = [
  {
    title: "Withdrawal Management",
    description:
      "Review pending withdrawals and manage their status.",
    link: "/admin/withdrawals",
    action: "Manage Withdrawals",
  },
  {
    title: "Wallet Operations",
    description:
      "Perform authorized wallet credits and debits.",
    link: "/admin/wallet",
    action: "Open Wallet Operations",
  },
  {
    title: "Reconciliation",
    description:
      "Compare wallet balances against the transaction ledger.",
    link: "/admin/reconciliation",
    action: "Open Reconciliation",
  },
];

const getStatusStyles = (status) => {
  switch (status) {
    case "PENDING":
      return {
        dot: "bg-yellow-400",
        value: "text-yellow-700",
        background: "bg-yellow-50",
      };

    case "PROCESSING":
      return {
        dot: "bg-blue-500",
        value: "text-blue-700",
        background: "bg-blue-50",
      };

    case "APPROVED":
      return {
        dot: "bg-green-500",
        value: "text-green-700",
        background: "bg-green-50",
      };

    case "REJECTED":
      return {
        dot: "bg-red-500",
        value: "text-red-700",
        background: "bg-red-50",
      };

    case "CANCELLED":
      return {
        dot: "bg-neutral-400",
        value: "text-neutral-700",
        background: "bg-neutral-100",
      };

    default:
      return {
        dot: "bg-neutral-400",
        value: "text-neutral-700",
        background: "bg-neutral-100",
      };
  }
};

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    PENDING: 0,
    PROCESSING: 0,
    APPROVED: 0,
    REJECTED: 0,
    CANCELLED: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError("");

        const results = await Promise.all(
          STATUS_CARDS.map(async ({ status }) => {
            const response = await api.get("/admin/withdrawals", {
              params: {
                status,
                page: 1,
                limit: 1,
              },
            });

            return {
              status,
              count:
                response.data?.data?.pagination?.total ?? 0,
            };
          })
        );

        const nextCounts = {
          PENDING: 0,
          PROCESSING: 0,
          APPROVED: 0,
          REJECTED: 0,
          CANCELLED: 0,
        };

        results.forEach(({ status, count }) => {
          nextCounts[status] = count;
        });

        setCounts(nextCounts);
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            "Unable to load admin dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const activeWork =
    counts.PENDING + counts.PROCESSING;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <AdminNavbar />

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        {/* PAGE HEADER */}
        <section className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-600">
            Admin
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Admin Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                Manage withdrawals, wallet operations and
                reconciliation from one place.
              </p>
            </div>

            {!loading && (
              <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-medium text-neutral-500">
                  Active withdrawal work
                </p>

                <p className="mt-1 text-xl font-bold">
                  {activeWork}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
              !
            </div>

            <div>
              <p className="text-sm font-semibold text-red-700">
                Unable to load dashboard
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* WITHDRAWAL STATUS */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Withdrawal Overview
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Current withdrawal request status across the platform.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STATUS_CARDS.map(
              ({ status, label, description }) => {
                const styles = getStatusStyles(status);

                return (
                  <div
                    key={status}
                    className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles.background}`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${styles.dot}`}
                        />
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-[0.14em] ${styles.value}`}
                      >
                        {status}
                      </span>
                    </div>

                    <p className="mt-5 text-sm font-semibold text-neutral-700">
                      {label}
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                      {description}
                    </p>

                    <p className="mt-4 text-3xl font-bold tracking-tight">
                      {loading ? "—" : counts[status]}
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Administrative Operations
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Access the main administrative workflows.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {ACTIONS.map((action) => (
              <div
                key={action.link}
                className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-950 text-sm font-bold text-yellow-400">
                  →
                </div>

                <h3 className="mt-5 text-lg font-bold">
                  {action.title}
                </h3>

                <p className="mt-2 min-h-10 text-sm leading-6 text-neutral-500">
                  {action.description}
                </p>

                <Link
                  to={action.link}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-950 transition group-hover:text-yellow-700"
                >
                  {action.action}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* OPERATIONS NOTE */}
        <section className="mt-10">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-sm font-bold text-yellow-700">
                i
              </div>

              <div>
                <h2 className="text-sm font-bold">
                  Administrative workspace
                </h2>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-500">
                  Use Withdrawal Management for request
                  processing, Wallet Operations for authorized
                  balance adjustments, and Reconciliation to
                  compare wallet balances with the transaction
                  ledger.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}