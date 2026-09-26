import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import AdminNavbar from "../../components/admin/AdminNavbar";

const STATUSES = [
  "ALL",
  "PENDING",
  "PROCESSING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleString();
};

const getStatusStyles = (status) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-50 text-yellow-700 ring-yellow-200";

    case "PROCESSING":
      return "bg-blue-50 text-blue-700 ring-blue-200";

    case "APPROVED":
      return "bg-green-50 text-green-700 ring-green-200";

    case "REJECTED":
      return "bg-red-50 text-red-700 ring-red-200";

    case "CANCELLED":
      return "bg-neutral-100 text-neutral-600 ring-neutral-200";

    default:
      return "bg-neutral-100 text-neutral-600 ring-neutral-200";
  }
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${getStatusStyles(
      status
    )}`}
  >
    {status === "APPROVED" ? "APPROVED FOR PAYOUT" : status}
  </span>
);

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [status, setStatus] = useState("PENDING");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...(status === "ALL" ? {} : { status }),
    };

    api
      .get("/admin/withdrawals", { params })
      .then((response) => {
        if (!active) return;
        const result = response.data?.data;
        setWithdrawals(result?.withdrawals || []);
        setPagination(
          result?.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          }
        );
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err.response?.data?.error?.message ||
            "Unable to load withdrawals."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status, pagination.page, pagination.limit, reload]);

  const changeStatus = async (
    withdrawalId,
    action,
    body = {}
  ) => {
    try {
      setProcessingId(withdrawalId);
      setError("");

      await api.post(
        `/admin/withdrawals/${withdrawalId}/${action}`,
        body
      );

      setLoading(true);
      setReload((value) => value + 1);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          `Unable to ${action} withdrawal.`
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = async (withdrawalId) => {
    const reviewNote = window.prompt(
      "Review note (optional):"
    );

    await changeStatus(
      withdrawalId,
      "approve",
      reviewNote?.trim()
        ? { reviewNote: reviewNote.trim() }
        : {}
    );
  };

  const handleStartProcessing = async (withdrawalId) => {
    await changeStatus(withdrawalId, "process");
  };

  const handleReject = async (withdrawalId) => {
    const rejectionReason = window.prompt(
      "Enter rejection reason:"
    );

    if (!rejectionReason?.trim()) {
      return;
    }

    const reviewNote = window.prompt(
      "Review note (optional):"
    );

    await changeStatus(
      withdrawalId,
      "reject",
      {
        rejectionReason: rejectionReason.trim(),
        ...(reviewNote?.trim()
          ? { reviewNote: reviewNote.trim() }
          : {}),
      }
    );
  };

  const handleCancel = async (withdrawalId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this withdrawal?"
    );

    if (!confirmed) {
      return;
    }

    const reviewNote = window.prompt(
      "Review note (optional):"
    );

    await changeStatus(
      withdrawalId,
      "cancel",
      reviewNote?.trim()
        ? { reviewNote: reviewNote.trim() }
        : {}
    );
  };

  const handleStatusChange = (nextStatus) => {
    setLoading(true);
    setError("");
    setStatus(nextStatus);

    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const totalPages = Math.max(
    pagination.totalPages || 0,
    1
  );

  const retryLoading = () => {
    setLoading(true);
    setError("");
    setReload((value) => value + 1);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <AdminNavbar />

      <main className="mx-auto max-w-[1600px] px-5 py-8 lg:px-8">
        {/* PAGE HEADER */}
        <section className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-600">
                Admin / Operations
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Withdrawal Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                Approved means cleared for payout; this system does not record whether payment was sent.
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

        {/* FILTERS */}
        <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm">
          <div className="flex gap-1 overflow-x-auto">
            {STATUSES.map((item) => {
              const isActive = status === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleStatusChange(item)}
                  aria-pressed={isActive}
                  className={[
                    "shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition",
                    isActive
                      ? "bg-neutral-950 text-white"
                      : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950",
                  ].join(" ")}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
              !
            </div>

            <div>
              <p className="text-sm font-semibold text-red-700">
                Operation failed
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
              <button
                type="button"
                onClick={retryLoading}
                className="mt-3 text-sm font-semibold text-red-800 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* TABLE */}
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-10">
              <div className="flex flex-col items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />

                <p className="mt-4 text-sm font-medium text-neutral-500">
                  Loading withdrawals...
                </p>
              </div>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-xl text-neutral-400">
                —
              </div>

              <h2 className="mt-4 text-base font-bold">
                No withdrawals found
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                There are no withdrawal requests matching the
                selected status.
              </p>
            </div>
          ) : (
            <>
              {/* TABLE HEADER */}
              <div className="flex flex-col gap-2 border-b border-neutral-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold">
                    Withdrawal Requests
                  </h2>

                  <p className="mt-1 text-xs text-neutral-400">
                    {pagination.total || withdrawals.length}{" "}
                    total request
                    {(pagination.total || withdrawals.length) ===
                    1
                      ? ""
                      : "s"}
                  </p>
                </div>

                <div className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600">
                  {status}
                </div>
              </div>

              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1100px] text-left">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                        Withdrawal ID
                      </th>

                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                        User ID
                      </th>

                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                        Method
                      </th>

                      <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                        VE Amount
                      </th>

                      <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                        Payout
                      </th>

                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                        Status
                      </th>

                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                        Requested
                      </th>

                      <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-100">
                    {withdrawals.map((withdrawal) => {
                      const isProcessing =
                        processingId ===
                        withdrawal.withdrawalId;

                      return (
                        <tr
                          key={withdrawal.withdrawalId}
                          className="transition hover:bg-neutral-50"
                        >
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs font-semibold text-neutral-900">
                              {withdrawal.withdrawalId}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-mono text-xs text-neutral-500">
                              {withdrawal.userId}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm font-medium text-neutral-700">
                              {withdrawal.method}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="text-sm font-semibold">
                              {Number(
                                withdrawal.currencyAmount || 0
                              ).toLocaleString()}{" "}
                              {withdrawal.currency}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="text-sm font-semibold">
                              {withdrawal.payoutAmount}{" "}
                              {withdrawal.payoutCurrency}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={withdrawal.status}
                            />
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-xs text-neutral-500">
                              {formatDate(
                                withdrawal.requestedAt ||
                                  withdrawal.createdAt
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {withdrawal.status === "PENDING" && (
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() =>
                                    handleStartProcessing(
                                      withdrawal.withdrawalId
                                    )
                                  }
                                  className="rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing
                                    ? "Starting..."
                                    : "Start Processing"}
                                </button>
                              )}

                              {withdrawal.status ===
                                "PROCESSING" && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() =>
                                      handleApprove(
                                        withdrawal.withdrawalId
                                      )
                                    }
                                    className="rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isProcessing
                                      ? "Processing..."
                                      : "Approve for payout"}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() =>
                                      handleReject(
                                        withdrawal.withdrawalId
                                      )
                                    }
                                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Reject
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() =>
                                      handleCancel(
                                        withdrawal.withdrawalId
                                      )
                                    }
                                    className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}

                              {withdrawal.status !==
                                "PENDING" &&
                                withdrawal.status !==
                                  "PROCESSING" && (
                                  <span className="text-xs text-neutral-400">
                                    No actions
                                  </span>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE / TABLET CARDS */}
              <div className="divide-y divide-neutral-200 lg:hidden">
                {withdrawals.map((withdrawal) => {
                  const isProcessing =
                    processingId ===
                    withdrawal.withdrawalId;

                  return (
                    <article
                      key={withdrawal.withdrawalId}
                      className="p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-bold">
                            {withdrawal.withdrawalId}
                          </p>

                          <p className="mt-1 truncate font-mono text-[11px] text-neutral-400">
                            User: {withdrawal.userId}
                          </p>
                        </div>

                        <StatusBadge
                          status={withdrawal.status}
                        />
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                            Method
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {withdrawal.method}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                            Requested
                          </p>

                          <p className="mt-1 text-xs text-neutral-600">
                            {formatDate(
                              withdrawal.requestedAt ||
                                withdrawal.createdAt
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                            VE Amount
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {Number(
                              withdrawal.currencyAmount || 0
                            ).toLocaleString()}{" "}
                            {withdrawal.currency}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                            Payout
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {withdrawal.payoutAmount}{" "}
                            {withdrawal.payoutCurrency}
                          </p>
                        </div>
                      </div>

                      {withdrawal.status === "PENDING" && (
                        <div className="mt-5 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              handleStartProcessing(
                                withdrawal.withdrawalId
                              )
                            }
                            className="rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isProcessing
                              ? "Starting..."
                              : "Start Processing"}
                          </button>
                        </div>
                      )}

                      {withdrawal.status === "PROCESSING" && (
                        <div className="mt-5 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              handleApprove(withdrawal.withdrawalId)
                            }
                            className="rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isProcessing
                              ? "Processing..."
                              : "Approve for payout"}
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              handleReject(
                                withdrawal.withdrawalId
                              )
                            }
                            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Reject
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              handleCancel(withdrawal.withdrawalId)
                            }
                            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {/* PAGINATION */}
              <div className="flex flex-col gap-3 border-t border-neutral-200 bg-neutral-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-neutral-500">
                  Page{" "}
                  <span className="font-semibold text-neutral-800">
                    {pagination.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-neutral-800">
                    {totalPages}
                  </span>
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={
                      pagination.page <= 1 || loading
                    }
                    onClick={() =>
                      {
                        setLoading(true);
                        setPagination((current) => ({
                          ...current,
                          page: current.page - 1,
                        }));
                      }
                    }
                    className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      pagination.page >=
                        pagination.totalPages ||
                      loading
                    }
                    onClick={() =>
                      {
                        setLoading(true);
                        setPagination((current) => ({
                          ...current,
                          page: current.page + 1,
                        }));
                      }
                    }
                    className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}