import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import DashboardNavbar from "../components/DashboardNavbar";
import {
  getRequestFingerprint,
  loadIdempotencyKeys,
  persistIdempotencyKeys,
} from "../services/idempotencyKeys";

const idempotencyStorageKey = "pendingWithdrawalIdempotencyKeys";

const Withdraw = () => {
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [payoutDetails, setPayoutDetails] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [activity, setActivity] = useState(null);
  const [loadRetry, setLoadRetry] = useState(0);
  const idempotencyKeys = useRef(
    loadIdempotencyKeys(idempotencyStorageKey)
  );

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get("/wallet"),
      api.get("/withdrawals/payout-options"),
    ])
      .then(([walletResponse, optionsResponse]) => {
        if (!active) return;
        setWallet(walletResponse.data.data.wallet);
        setOptions(optionsResponse.data.data || []);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err.response?.data?.error?.message ||
            "Unable to load withdrawal information."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadRetry]);

  const retryLoad = () => {
    setLoading(true);
    setError("");
    setLoadRetry((value) => value + 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedOption) {
      setError("Please select a payout option.");
      return;
    }

    if (!payoutDetails.trim()) {
      setError("Please enter your payout details.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      setRefreshError("");

      const requestPayload = {
        optionId: selectedOption.optionId,
        payoutDetails: {
          [selectedOption.method === "UPI" ? "upiId" : "email"]:
            payoutDetails.trim(),
        },
      };
      const requestFingerprint =
        await getRequestFingerprint(requestPayload);
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
        "/withdrawals",
        requestPayload,
        {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        }
      );

      const withdrawal = response.data.data.withdrawal;
      const updatedWallet = response.data.data.wallet;
      const transaction = response.data.data.transaction;
      if (
        !withdrawal?.withdrawalId ||
        !transaction?.transactionId ||
        !Number.isSafeInteger(updatedWallet?.ves)
      ) {
        throw new Error("Withdrawal response was incomplete.");
      }

      setWallet(updatedWallet);
      setActivity({ withdrawal, transaction });
      setSuccess(
        `Withdrawal ${withdrawal.withdrawalId} created successfully.`
      );

      idempotencyKeys.current.delete(requestFingerprint);
      persistIdempotencyKeys(
        idempotencyStorageKey,
        idempotencyKeys.current
      );
      setPayoutDetails("");
      setSelectedOption(null);

      const refreshResults = await Promise.allSettled([
        api.get("/wallet"),
        api.get("/wallet/transactions", { params: { page: 1, limit: 10 } }),
        api.get("/withdrawals", { params: { page: 1, limit: 5 } }),
      ]);

      const [walletResult, transactionResult, withdrawalResult] = refreshResults;
      if (walletResult.status === "fulfilled") {
        setWallet(walletResult.value.data.data.wallet);
      }
      if (transactionResult.status === "fulfilled") {
        const transactions = transactionResult.value.data.data.transactions || [];
        setActivity((current) => ({
          ...current,
          transaction: transactions[0] || current?.transaction,
        }));
      }
      if (withdrawalResult.status === "fulfilled") {
        const withdrawals = withdrawalResult.value.data.data.withdrawals || [];
        setActivity((current) => ({
          ...current,
          withdrawal: withdrawals[0] || current?.withdrawal,
        }));
      }
      if (refreshResults.some((result) => result.status === "rejected")) {
        setRefreshError(
          "The withdrawal was created, but some wallet activity could not be refreshed."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          "Unable to create withdrawal."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-yellow-400" />

          <p className="mt-4 text-sm font-medium text-neutral-500">
            Loading withdrawal options...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">

<DashboardNavbar />


      {/* MAIN */}
      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8">

        {/* PAGE HEADER */}
        <section className="mb-8">

          <button
            onClick={() => navigate("/wallet")}
            className="mb-5 text-sm font-medium text-neutral-500 transition hover:text-black"
          >
            ← Back to Wallet
          </button>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-600">
            VELOop Wallet
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Withdraw Rewards
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
            Convert your VE rewards into an available payout.
          </p>

        </section>


        {/* BALANCE */}
        {wallet && (
          <section className="mb-8 overflow-hidden rounded-3xl bg-neutral-950 text-white shadow-sm">

            <div className="relative p-7">

              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-yellow-400/15 blur-3xl" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-sm font-medium text-neutral-400">
                    Available VE
                  </p>

                  <div className="mt-2 flex items-baseline gap-2">

                    <span className="text-4xl font-bold tracking-tight text-yellow-400">
                      {Number(wallet.ves || 0).toLocaleString()}
                    </span>

                    <span className="text-sm font-medium text-neutral-400">
                      VE Rewards
                    </span>

                  </div>

                  <p className="mt-2 text-xs text-neutral-500">
                    Available balance for eligible withdrawals.
                  </p>

                </div>


                <button
                  onClick={() => navigate("/wallet")}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  View Wallet
                </button>

              </div>

            </div>

          </section>
        )}


        {/* ALERTS */}
        {error && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">

            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
              !
            </div>

            <p className="pt-1 text-sm font-medium text-red-700">
              {error}
            </p>
            {options.length === 0 && (
              <button
                type="button"
                onClick={retryLoad}
                className="ml-auto text-sm font-semibold text-red-800 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Retry
              </button>
            )}

          </div>
        )}


        {success && (
          <div role="status" aria-live="polite" className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">

            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
              ✓
            </div>

            <div>
              <p className="text-sm font-semibold text-green-700">
                Withdrawal created
              </p>

              <p className="mt-1 text-sm text-green-600">
                {success}
              </p>
            </div>

          </div>
        )}

        {refreshError && (
          <p role="status" className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm text-yellow-900">
            {refreshError}
          </p>
        )}

        {activity && (
          <section aria-label="Latest withdrawal activity" className="mb-8 rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="font-semibold">Latest activity</h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-neutral-500">Withdrawal status</dt>
                <dd className="mt-1 font-semibold">{activity.withdrawal.status}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Ledger transaction</dt>
                <dd className="mt-1 break-all font-mono text-xs">{activity.transaction.transactionId}</dd>
              </div>
            </dl>
          </section>
        )}


        {/* PAYOUT OPTIONS */}
        <section>

          <div className="mb-5">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-600">
              Step 1
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Select Payout
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              Choose one of the payout options configured by VELOop.
            </p>

          </div>


          {options.length === 0 ? (

            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">

              <p className="font-semibold">
                No payout options available
              </p>

              <p className="mt-2 text-sm text-neutral-500">
                There are currently no withdrawal options configured.
              </p>

            </div>

          ) : (

            <div className="grid gap-4 sm:grid-cols-2">

              {options.map((option) => {

                const selected =
                  selectedOption?.optionId === option.optionId;

                return (
                  <button
                    type="button"
                    key={option.optionId}
                    onClick={() => {
                      setSelectedOption(option);
                      setPayoutDetails("");
                      setError("");
                      setSuccess("");
                    }}
                    className={`relative rounded-2xl border bg-white p-6 text-left shadow-sm transition ${
                      selected
                        ? "border-yellow-400 ring-4 ring-yellow-100"
                        : "border-neutral-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
                    }`}
                    aria-pressed={selected}
                  >

                    {/* Selected */}
                    {selected && (
                      <div className="absolute right-5 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black">
                        ✓
                      </div>
                    )}


                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 font-bold text-yellow-700">
                      ₹
                    </div>


                    <div className="mt-5 flex items-center gap-2">

                      <h3 className="text-lg font-bold">
                        {option.name}
                      </h3>

                      {selected && (
                        <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-yellow-700">
                          Selected
                        </span>
                      )}

                    </div>


                    <div className="mt-4">

                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                        You'll receive
                      </p>

                      <p className="mt-1 text-2xl font-bold">
                        {option.payoutAmount}{" "}
                        {option.payoutCurrency}
                      </p>

                    </div>


                    <div className="mt-5 rounded-xl bg-neutral-50 p-4">

                      <p className="text-xs text-neutral-500">
                        Required balance
                      </p>

                      <p className="mt-1 text-sm font-bold">
                        {Number(
                          option.requiredAmount
                        ).toLocaleString()}{" "}
                        {option.currency}
                      </p>

                    </div>


                    <div className="mt-5 flex items-center justify-between">

                      <span className="text-xs text-neutral-400">
                        {option.method}
                      </span>

                      <span className="text-sm font-semibold">
                        {selected ? "Selected" : "Select →"}
                      </span>

                    </div>

                  </button>
                );
              })}

            </div>

          )}

        </section>


        {/* PAYOUT FORM */}
        {selectedOption && (
          <section className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

            <div className="flex flex-col gap-6 border-b border-neutral-200 pb-6 sm:flex-row sm:items-start sm:justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-600">
                  Step 2
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Enter your details
                </h2>

                <p className="mt-2 text-sm text-neutral-500">
                  Make sure your payout details are correct before submitting.
                </p>

              </div>


              <div className="rounded-2xl bg-yellow-50 px-5 py-4">

                <p className="text-xs font-medium text-yellow-700">
                  You'll receive
                </p>

                <p className="mt-1 text-xl font-bold text-neutral-950">
                  {selectedOption.payoutAmount}{" "}
                  {selectedOption.payoutCurrency}
                </p>

              </div>

            </div>


            {/* REQUIREMENT */}
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-neutral-50 px-5 py-4">

              <div>

                <p className="text-xs text-neutral-500">
                  Withdrawal cost
                </p>

                <p className="mt-1 text-sm font-bold">
                  {Number(
                    selectedOption.requiredAmount
                  ).toLocaleString()}{" "}
                  {selectedOption.currency}
                </p>

              </div>

              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-neutral-500">
                {selectedOption.method}
              </span>

            </div>


            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="mt-7"
            >

              <label
                htmlFor="payoutDetails"
                className="mb-2 block text-sm font-semibold"
              >
                {selectedOption.method === "UPI"
                  ? "UPI ID"
                  : "Email address"}
              </label>


              <input
                id="payoutDetails"
                type={selectedOption.method === "UPI" ? "text" : "email"}
                value={payoutDetails}
                onChange={(event) =>
                  setPayoutDetails(event.target.value)
                }
                placeholder={
                  selectedOption.method === "UPI"
                    ? "example@upi"
                    : "you@example.com"
                }
                minLength={selectedOption.method === "UPI" ? 3 : 5}
                maxLength={selectedOption.method === "UPI" ? 100 : 254}
                autoComplete={selectedOption.method === "UPI" ? "off" : "email"}
                aria-describedby="payout-details-hint"
                required
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
              />


              <p id="payout-details-hint" className="mt-2 text-xs leading-5 text-neutral-400">
                Make sure your payout details are correct. Incorrect details
                may result in rejection.
              </p>


              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Processing..."
                  : `Request ${selectedOption.payoutAmount} ${selectedOption.payoutCurrency}`}
              </button>

            </form>

          </section>
        )}


      </main>


      {/* FOOTER */}
      <footer className="mt-16 border-t border-neutral-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left lg:px-8">

          <div>

            <p className="font-bold">
              VELOop
            </p>

            <p className="mt-1 text-xs text-neutral-400">
              © {new Date().getFullYear()} VELOop Rewards · All rights reserved
            </p>

          </div>


          <div className="flex flex-wrap justify-center gap-5 text-xs text-neutral-500 sm:justify-end">

            <button
              onClick={() => navigate("/dashboard")}
              className="hover:text-black"
            >
              Dashboard
            </button>

            <button
              onClick={() => navigate("/wallet")}
              className="hover:text-black"
            >
              Wallet
            </button>

            <span>Terms</span>
            <span>Privacy</span>
            <span>Support</span>

          </div>

        </div>

      </footer>

    </div>
  );
};

export default Withdraw;