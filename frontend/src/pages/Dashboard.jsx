import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [transactionLoading, setTransactionLoading] = useState(true);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionLimit, setTransactionLimit] = useState(10);

  const [transactionPagination, setTransactionPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalLoading, setWithdrawalLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          walletResponse,
          summaryResponse,
          transactionsResponse,
          withdrawalsResponse,
        ] = await Promise.all([
          api.get("/wallet"),
          api.get("/wallet/summary"),
          api.get(
            `/wallet/transactions?page=${transactionPage}&limit=${transactionLimit}`
          ),
          api.get("/withdrawals"),
        ]);

        const walletData = walletResponse.data.data;
        const summaryData = summaryResponse.data.data;
        const transactionData = transactionsResponse.data.data;
        const withdrawalData = withdrawalsResponse.data.data;

        setWallet(walletData);
        setSummary(summaryData);

        setTransactions(transactionData.transactions || []);

        setTransactionPagination(
          transactionData.pagination || {
            page: transactionPage,
            limit: transactionLimit,
            total: 0,
            totalPages: 0,
          }
        );

        setWithdrawals(
          Array.isArray(withdrawalData)
            ? withdrawalData
            : withdrawalData.withdrawals || []
        );
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            "Unable to load wallet data."
        );
      } finally {
        setLoading(false);
        setTransactionLoading(false);
        setWithdrawalLoading(false);
      }
    };

    fetchWalletData();
  }, [transactionPage, transactionLimit]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-sm font-medium text-neutral-500">
          Loading wallet...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const ves = summary?.ves ?? wallet?.ves ?? 0;
  const sves = summary?.sves ?? wallet?.sves ?? 0;
  const gems = summary?.gems ?? wallet?.gems ?? 0;
  const tokens = summary?.tokens ?? wallet?.tokens ?? 0;
  const spins = summary?.spins ?? wallet?.spins ?? 0;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">

    <DashboardNavbar />

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* WELCOME */}
        <section className="mb-8">
          <p className="text-sm font-medium text-neutral-500">
            Welcome back
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {user?.name || "User"}
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Keep earning rewards and stay active on VELOop.
          </p>
        </section>


        {/* BALANCE */}
        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">

          <div className="relative overflow-hidden rounded-3xl bg-neutral-950 p-7 text-white shadow-sm">

            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-yellow-400/15 blur-3xl" />

            <div className="relative">

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-400">
                  Available VEs
                </p>

                <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                  VE
                </span>
              </div>

              <div className="mt-4 flex items-end gap-3">
                <span className="text-5xl font-bold tracking-tight">
                  {ves}
                </span>

                <span className="mb-1 text-sm font-semibold text-yellow-400">
                  VEs
                </span>
              </div>

              <p className="mt-3 text-sm text-neutral-400">
                Your current available reward balance
              </p>

              <button
                onClick={() => navigate("/withdraw")}
                className="mt-7 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
              >
                Withdraw Rewards
              </button>

            </div>

          </div>


          <div className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm">

            <p className="text-sm font-medium text-neutral-500">
              Available Balance
            </p>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight">
                ₹
              </span>

              <span className="text-4xl font-bold tracking-tight">
                {Number(summary?.balance ?? 0).toLocaleString("en-IN")}
              </span>
            </div>

            <p className="mt-3 text-sm text-neutral-500">
              Estimated current balance
            </p>

            <button
              onClick={() => navigate("/withdraw")}
              className="mt-6 text-sm font-semibold text-neutral-950 underline decoration-yellow-400 decoration-2 underline-offset-4"
            >
              Open My Wallet →
            </button>

          </div>

        </section>


        {/* WALLET */}
        <section className="mt-8">

          <div className="mb-4">
            <h2 className="text-xl font-bold">
              My Wallet
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Your VELOop reward resources.
            </p>
          </div>


          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">

            {[
              ["SVEs", sves],
              ["Gems", gems],
              ["Tokens", tokens],
              ["Spins", spins],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-medium text-neutral-500">
                  {label}
                </p>

                <p className="mt-3 text-2xl font-bold">
                  {value}
                </p>
              </div>
            ))}

            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
              <p className="text-xs font-medium text-yellow-700">
                VEs
              </p>

              <p className="mt-3 text-2xl font-bold text-neutral-950">
                {ves}
              </p>
            </div>

          </div>

        </section>


        {/* REFERRAL BANNER */}
        <section className="mt-8">

          <div className="flex flex-col gap-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-6 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400 font-bold text-black">
                ↗
              </div>

              <div>
                <h3 className="font-bold">
                  Refer Your Friends & Earn Money
                </h3>

                <p className="mt-1 text-sm text-neutral-600">
                  Invite your friends and earn rewards through successful referrals.
                </p>
              </div>

            </div>

            <button
              className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
            >
              Start Referring →
            </button>

          </div>

        </section>


        {/* FEATURES */}
        <section className="mt-10">

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Features
            </h2>
          </div>


          <div className="grid gap-4 md:grid-cols-2">

            {/* STREAK */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">

              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-lg">
                  ✓
                </div>

                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                  Daily Check-in
                </span>

              </div>

              <h3 className="mt-5 text-xl font-bold">
                Streak Rewards
              </h3>

              <p className="mt-2 text-sm text-neutral-500">
                Stay active every day and continue your reward streak.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">

                <div className="rounded-xl bg-neutral-50 p-4">
                  <p className="text-xs text-neutral-500">
                    Today's Reward
                  </p>

                  <p className="mt-2 font-bold">
                    5 VEs
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-50 p-4">
                  <p className="text-xs text-neutral-500">
                    Final Reward
                  </p>

                  <p className="mt-2 font-bold">
                    Mystery Box
                  </p>
                </div>

              </div>

              <button className="mt-5 w-full rounded-xl border border-neutral-200 py-3 text-sm font-semibold hover:bg-neutral-50">
                Complete Streak & Earn
              </button>

            </div>


            {/* SPIN */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">

              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-lg">
                  ⟳
                </div>

                <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
                  Spin & Win
                </span>

              </div>

              <h3 className="mt-5 text-xl font-bold">
                Spin The Wheel
              </h3>

              <p className="mt-2 text-sm text-neutral-500">
                Use available spins and discover your rewards.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">

                <div className="rounded-xl bg-neutral-50 p-3 text-center">
                  <p className="text-xs text-neutral-500">
                    Spins
                  </p>
                  <p className="mt-1 font-bold">
                    {spins}
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-50 p-3 text-center">
                  <p className="text-xs text-neutral-500">
                    Rewards
                  </p>
                  <p className="mt-1 font-bold">
                    VEs
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-50 p-3 text-center">
                  <p className="text-xs text-neutral-500">
                    Bonus
                  </p>
                  <p className="mt-1 font-bold">
                    Gift
                  </p>
                </div>

              </div>

              <button className="mt-5 w-full rounded-xl border border-neutral-200 py-3 text-sm font-semibold hover:bg-neutral-50">
                Spin & Earn Rewards
              </button>

            </div>

          </div>

        </section>


        {/* DAILY BONUS */}
        <section className="mt-10">

          <div className="rounded-3xl border border-yellow-200 bg-white p-7 shadow-sm">

            <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">

              <div>

                <span className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-600">
                  Daily Bonus
                </span>

                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  Claim your daily bonus
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
                  Stay active every day to keep your streak alive and unlock
                  more rewards and bonus features.
                </p>

                <div className="mt-6 flex flex-wrap gap-3 text-xs text-neutral-500">
                  <span className="rounded-full bg-neutral-100 px-3 py-2">
                    Trusted bonus
                  </span>

                  <span className="rounded-full bg-neutral-100 px-3 py-2">
                    Instant claim
                  </span>

                  <span className="rounded-full bg-neutral-100 px-3 py-2">
                    Daily bonuses
                  </span>
                </div>

              </div>


              <div className="rounded-2xl bg-neutral-50 p-6">

                <p className="text-xs font-medium text-neutral-500">
                  TODAY'S ACCESS
                </p>

                <p className="mt-2 text-lg font-bold">
                  Tap to collect your daily bonus
                </p>

                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Claim daily to continue your active streak.
                </p>

                <button className="mt-5 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white">
                  Claim daily bonus →
                </button>

              </div>

            </div>

          </div>

        </section>


        {/* TAP & EARN */}
        <section className="mt-10">

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Tap & Earn
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <div className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">
                👆
              </div>

              <h3 className="mt-5 text-xl font-bold">
                Tap & Earn
              </h3>

              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Tap continuously and earn VEs & rewards.
              </p>

              <button className="mt-6 text-sm font-semibold">
                Start Earning →
              </button>

            </div>


            <div className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">
                ◉
              </div>

              <h3 className="mt-5 text-xl font-bold">
                Reward Center
              </h3>

              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Exchange your Tap Token into available rewards.
              </p>

              <button className="mt-6 text-sm font-semibold">
                Swap Now →
              </button>

            </div>

          </div>

        </section>


        {/* MINE & EARN */}
        <section className="mt-10">

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Mine & Earn
            </h2>
          </div>

          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-950 p-8 text-white">

            <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-center">

              <div className="flex min-h-44 items-center justify-center rounded-2xl bg-neutral-900">

                <div className="grid grid-cols-4 gap-2 opacity-80">
                  {Array.from({ length: 16 }).map((_, index) => (
                    <div
                      key={index}
                      className={`h-7 w-7 rounded-lg ${
                        index % 3 === 0
                          ? "bg-yellow-400"
                          : "bg-neutral-700"
                      }`}
                    />
                  ))}
                </div>

              </div>


              <div>

                <span className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">
                  New Earning Method
                </span>

                <h2 className="mt-3 text-3xl font-bold">
                  Start VEs Mining
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-400">
                  Generate VEs rewards while staying active on VELOop Rewards.
                </p>

                <button className="mt-6 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black">
                  Start Mining
                </button>

              </div>

            </div>

          </div>

        </section>


        {/* STAKE & EARN */}
        <section className="mt-10">

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Stake & Earn
            </h2>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">

            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">

              <div className="flex min-h-56 items-center justify-center">

                <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-2 border-yellow-200">

                  <div className="absolute inset-5 rounded-full border border-yellow-300" />

                  <div className="absolute inset-10 flex items-center justify-center rounded-2xl bg-neutral-950 text-xl text-yellow-400">
                    V
                  </div>

                </div>

              </div>


              <div>

                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  Secured Staking
                </span>

                <h3 className="mt-5 text-2xl font-bold">
                  Stake VEs
                </h3>

                <p className="mt-3 text-sm leading-6 text-neutral-500">
                  Securely stake your VEs and participate in the VELOop staking
                  system.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4">

                  <div className="rounded-xl bg-neutral-50 p-4">
                    <p className="text-xs text-neutral-500">
                      Stake
                    </p>
                    <p className="mt-2 font-bold">
                      8,000 VEs
                    </p>
                  </div>

                  <div className="rounded-xl bg-neutral-50 p-4">
                    <p className="text-xs text-neutral-500">
                      Returns
                    </p>
                    <p className="mt-2 font-bold">
                      10,000 VEs
                    </p>
                  </div>

                </div>

                <button className="mt-5 w-full rounded-xl border border-neutral-200 py-3 text-sm font-semibold hover:bg-neutral-50">
                  Start Staking
                </button>

              </div>

            </div>

          </div>

        </section>


        {/* BONUS VEs / TASKS */}
        <section className="mt-10">

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Bonus VEs
            </h2>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm">

            <div className="grid gap-7 lg:grid-cols-[1.5fr_1fr]">

              <div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">
                    Live Bonus
                  </span>

                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">
                    Secure
                  </span>

                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">
                    Instant
                  </span>

                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">
                    Verified
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-bold">
                  Watch ads and unlock{" "}
                  <span className="text-yellow-500">
                    Bonus VEs
                  </span>
                </h3>

                <p className="mt-3 text-sm leading-6 text-neutral-500">
                  Complete available activities and check your current bonus
                  availability.
                </p>

                <div className="mt-6 flex items-center gap-4">

                  <div>
                    <p className="text-xs text-neutral-500">
                      Reward status
                    </p>

                    <p className="mt-1 font-semibold">
                      Ready to claim
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500">
                      Bonus availability
                    </p>

                    <p className="mt-1 font-semibold">
                      Available
                    </p>
                  </div>

                </div>

              </div>


              <div className="rounded-2xl bg-neutral-50 p-6">

                <p className="text-xs font-medium text-neutral-500">
                  ESTIMATED TIME
                </p>

                <p className="mt-2 text-xl font-bold">
                  Available
                </p>

                <button className="mt-5 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white">
                  Claim Now →
                </button>

              </div>

            </div>

          </div>


          <div className="mt-4 grid gap-4 md:grid-cols-2">

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
                #
              </div>

              <h3 className="mt-5 text-lg font-bold">
                Captcha Tasks
              </h3>

              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Solve simple captchas and earn Gems rewards.
              </p>

              <button
                type="button"
                onClick={() => navigate("/captcha")}
                className="mt-5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                Start Task →
              </button>

            </div>


            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50">
                ⇄
              </div>

              <h3 className="mt-5 text-lg font-bold">
                Exchange Center
              </h3>

              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Convert Gems into VEs to redeem available rewards.
              </p>

              <button className="mt-5 text-sm font-semibold">
                Open Center →
              </button>

            </div>

          </div>

        </section>


        {/* WATCH ADS */}
        <section className="mt-10">

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Watch Ads & Earn
            </h2>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">

            <div className="grid gap-7 lg:grid-cols-[auto_1fr_auto] lg:items-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                ▶
              </div>

              <div>

                <h3 className="text-2xl font-bold">
                  Watch Ads & Earn Rewards
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Watch available sponsored content and earn VE rewards.
                </p>

              </div>

              <button className="rounded-xl border border-neutral-200 px-6 py-3 text-sm font-semibold hover:bg-neutral-50">
                Watch Ad →
              </button>

            </div>

          </div>

        </section>


        {/* LEADERBOARD */}
        <section className="mt-10">

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Leaderboard
            </h2>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">

            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">

              <div className="flex min-h-44 items-center justify-center rounded-2xl bg-yellow-50">

                <div className="text-center">

                  <div className="text-6xl">
                    🏆
                  </div>

                  <p className="mt-3 text-sm font-bold">
                    Weekly VE Leaderboard
                  </p>

                </div>

              </div>


              <div>

                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                  Weekly VEs Leaderboard
                </span>

                <h3 className="mt-5 text-2xl font-bold">
                  Earn the most VEs this week
                </h3>

                <p className="mt-3 text-sm leading-6 text-neutral-500">
                  This board ranks users by VEs earned during the current
                  leaderboard period.
                </p>

                <button className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white">
                  View Leaderboard →
                </button>

              </div>

            </div>

          </div>

        </section>


        {/* REFER */}
        <section className="mt-10">

          <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">

            <span className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-600">
              Refer & Earn
            </span>

            <h2 className="mt-3 text-3xl font-bold">
              Invite your friends
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
              Invite your friends to VELOop and participate in the referral
              rewards program.
            </p>

            <button className="mt-6 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white">
              Start Referring
            </button>

          </div>

        </section>


        {/* GIVEAWAY */}
        <section className="mt-10">

          <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8">

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              <div>

                <span className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-700">
                  Giveaway Code
                </span>

                <h2 className="mt-3 text-2xl font-bold">
                  Exclusive Giveaway Rewards
                </h2>

                <p className="mt-2 text-sm text-neutral-600">
                  Enter special giveaway codes and unlock available VE rewards.
                </p>

              </div>

              <button className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white">
                Enter Giveaway
              </button>

            </div>

          </div>

        </section>


        {/* UPCOMING FEATURES */}
        <section className="mt-10">

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Upcoming Features
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">

            {[
              "Team Battles",
              "Lucky Draw",
              "Milestone Rewards",
              "Collect Cards",
              "Surprise Rewards",
            ].map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-neutral-200 bg-white p-5 text-center shadow-sm"
              >
                <p className="text-sm font-semibold">
                  {feature}
                </p>

                <span className="mt-2 block text-xs text-neutral-400">
                  Coming soon
                </span>
              </div>
            ))}

          </div>

        </section>


        {/* TRANSACTIONS */}
        <section className="mt-12">

          <div className="mb-5 flex items-end justify-between">

            <div>
              <h2 className="text-xl font-bold">
                Transaction History
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Your recent wallet activity.
              </p>
            </div>

          </div>


          {transactionLoading ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
              No transactions yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[700px] text-left">

                  <thead className="border-b border-neutral-200 bg-neutral-50">
                    <tr>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Type
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Currency
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Amount
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Balance
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-100">

                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.transactionId}
                        className="transition hover:bg-neutral-50"
                      >

                        <td className="px-5 py-4 text-sm font-medium">
                          {transaction.type}
                        </td>

                        <td className="px-5 py-4 text-sm text-neutral-600">
                          {transaction.currency}
                        </td>

                        <td
                          className={`px-5 py-4 text-sm font-semibold ${
                            transaction.direction === "CREDIT"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.direction === "CREDIT" ? "+" : "-"}
                          {transaction.amount}
                        </td>

                        <td className="px-5 py-4 text-sm text-neutral-600">
                          {transaction.balanceAfter}
                        </td>

                        <td className="px-5 py-4">

                          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                            {transaction.status}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-sm text-neutral-500">
                          {new Date(
                            transaction.createdAt
                          ).toLocaleString()}
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>


              {/* Pagination */}
              <div className="flex flex-col gap-4 border-t border-neutral-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-xs text-neutral-500">
                  Showing page {transactionPagination.page} of{" "}
                  {transactionPagination.totalPages || 1}
                </p>

                <div className="flex items-center gap-2">

                  <button
                    onClick={() =>
                      setTransactionPage((page) =>
                        Math.max(page - 1, 1)
                      )
                    }
                    disabled={transactionPage === 1}
                    className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-2 text-xs text-neutral-500">
                    {transactionPage} /{" "}
                    {transactionPagination.totalPages || 1}
                  </span>

                  <button
                    onClick={() =>
                      setTransactionPage((page) =>
                        Math.min(
                          page + 1,
                          transactionPagination.totalPages
                        )
                      )
                    }
                    disabled={
                      transactionPage >=
                      transactionPagination.totalPages
                    }
                    className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>

                  <select
                    value={transactionLimit}
                    onChange={(e) => {
                      setTransactionLimit(Number(e.target.value));
                      setTransactionPage(1);
                    }}
                    className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs"
                  >
                    <option value={10}>10 rows</option>
                    <option value={20}>20 rows</option>
                    <option value={50}>50 rows</option>
                  </select>

                </div>

              </div>

            </div>
          )}

        </section>


        {/* WITHDRAWALS */}
        <section className="mt-10">

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Withdrawal History
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Your recent withdrawal requests.
            </p>
          </div>


          {withdrawalLoading ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
              Loading withdrawals...
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
              No withdrawal requests yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[700px] text-left">

                  <thead className="border-b border-neutral-200 bg-neutral-50">

                    <tr>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Withdrawal ID
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Method
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Required
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Payout
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Date
                      </th>

                    </tr>

                  </thead>


                  <tbody className="divide-y divide-neutral-100">

                    {withdrawals.map((withdrawal) => (

                      <tr
                        key={withdrawal.withdrawalId}
                        className="transition hover:bg-neutral-50"
                      >

                        <td className="px-5 py-4 text-sm font-medium">
                          {withdrawal.withdrawalId}
                        </td>

                        <td className="px-5 py-4 text-sm text-neutral-600">
                          {withdrawal.method}
                        </td>

                        <td className="px-5 py-4 text-sm text-neutral-600">
                          {withdrawal.currencyAmount}{" "}
                          {withdrawal.currency}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold">
                          {withdrawal.payoutAmount}{" "}
                          {withdrawal.payoutCurrency}
                        </td>

                        <td className="px-5 py-4">

                          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                            {withdrawal.status === "APPROVED"
                              ? "Approved for payout (payment not tracked)"
                              : withdrawal.status}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-sm text-neutral-500">
                          {new Date(
                            withdrawal.requestedAt ||
                              withdrawal.createdAt
                          ).toLocaleString()}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>
          )}

        </section>


        {/* SUPPORT */}
        <section className="mt-12">

          <div className="rounded-3xl bg-neutral-950 p-8 text-white">

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              <div>

                <span className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">
                  Need a hand?
                </span>

                <h2 className="mt-3 text-2xl font-bold">
                  We're here to help.
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">
                  Contact support if you need help with your account, rewards
                  or wallet.
                </p>

              </div>

              <button className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-black">
                Contact Support →
              </button>

            </div>

          </div>

        </section>

      </main>


      {/* FOOTER */}
      <footer className="mt-16 border-t border-neutral-200 bg-white">

        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

          <div className="flex flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">

            <div>
              <p className="font-bold">
                VELOop
              </p>

              <p className="mt-1 text-xs text-neutral-400">
                © {new Date().getFullYear()} VELOop Rewards · All rights reserved
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-5 text-xs text-neutral-500 sm:justify-end">
              <span>Rewards Policies</span>
              <span>Terms</span>
              <span>Privacy</span>
              <span>Support</span>
            </div>

          </div>

        </div>

      </footer>

    </div>
  );
};

export default Dashboard;