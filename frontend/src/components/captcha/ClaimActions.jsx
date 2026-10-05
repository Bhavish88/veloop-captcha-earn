export default function ClaimActions({
  challengeStatus,
  isProcessing,
  onClaim,
  onDismiss,
  onNext,
}) {
  const isFinalized =
    challengeStatus === "CLAIMED" || challengeStatus === "DISMISSED";

  if (isFinalized) {
    return (
      <div className="pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={isProcessing}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-50"
        >
          {isProcessing ? "Loading next challenge..." : "Next Challenge →"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
      <button
        type="button"
        onClick={onClaim}
        disabled={isProcessing}
        className="w-full sm:flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-500 active:scale-[0.99] disabled:opacity-50"
      >
        {isProcessing ? "Processing Claim..." : "🎁 Claim Reward (Watch Ad)"}
      </button>

      <button
        type="button"
        onClick={onDismiss}
        disabled={isProcessing}
        className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
      >
        No Thanks
      </button>
    </div>
  );
}
