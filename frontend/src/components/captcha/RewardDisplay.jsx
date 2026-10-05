export default function RewardDisplay({ amount, result }) {
  const isCorrect = result === "CORRECT";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-300 shadow-sm backdrop-blur">
      <span className="text-base" role="img" aria-label="Gem">
        💎
      </span>
      <span>+{amount} GEM</span>
      <span
        className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          isCorrect
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
        }`}
      >
        {isCorrect ? "Max Reward" : "Partial Reward"}
      </span>
    </div>
  );
}
