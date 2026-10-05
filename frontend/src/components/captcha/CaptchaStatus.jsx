import RewardDisplay from "./RewardDisplay";

export default function CaptchaStatus({ status, reward, errorMsg, onRetry }) {
  if (status === "VERIFYING" || status === "OPTION_SELECTED") {
    return (
      <div className="flex items-center justify-center gap-3 rounded-xl border border-blue-500/30 bg-blue-950/30 px-5 py-4 text-blue-300 shadow-sm animate-pulse">
        <svg
          className="h-5 w-5 animate-spin text-blue-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        <span className="text-sm font-semibold tracking-wide">
          Verifying solution with server...
        </span>
      </div>
    );
  }

  if (status === "SUCCESS") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-5 text-center shadow-[0_0_20px_rgba(16,185,129,0.15)]">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h4 className="text-base font-bold text-emerald-300">
          Captcha Solved Correctly!
        </h4>
        <p className="mt-1 text-xs text-emerald-400/80">
          Reward has been verified and added to your wallet.
        </p>
        <div className="mt-3">
          <RewardDisplay amount={reward || "1.00"} result="CORRECT" />
        </div>
      </div>
    );
  }

  if (status === "INCORRECT") {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-5 text-center shadow-[0_0_20px_rgba(244,63,94,0.15)]">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h4 className="text-base font-bold text-rose-300">
          Answer Was Incorrect
        </h4>
        <p className="mt-1 text-xs text-rose-400/80">
          Don't worry! You still receive a participation reward.
        </p>
        <div className="mt-3">
          <RewardDisplay amount={reward || "0.50"} result="WRONG" />
        </div>
      </div>
    );
  }

  if (status === "EXPIRED") {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-5 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
          ⏱️
        </div>
        <h4 className="text-base font-bold text-amber-300">
          Challenge Expired
        </h4>
        <p className="mt-1 text-xs text-amber-400/80">
          The 120-second solve window has ended.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-lg bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30"
          >
            Load Fresh CAPTCHA
          </button>
        )}
      </div>
    );
  }

  if (status === "ERROR") {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-center">
        <p className="text-sm font-medium text-rose-300">
          {errorMsg || "An error occurred during verification."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return null;
}
