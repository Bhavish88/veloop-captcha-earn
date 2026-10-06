export default function CaptchaOption({
  option,
  index,
  isSelected,
  isDisabled,
  status,
  onSelect,
}) {
  let stateClasses = "border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-700 hover:bg-slate-800/80 hover:text-white";

  if (isSelected) {
    if (status === "VERIFYING" || status === "OPTION_SELECTED") {
      stateClasses = "border-blue-500 bg-blue-950/40 text-blue-200 ring-2 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]";
    } else if (status === "SUCCESS") {
      stateClasses = "border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-2 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
    } else if (status === "INCORRECT") {
      stateClasses = "border-rose-500 bg-rose-950/40 text-rose-200 ring-2 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]";
    }
  } else if (isDisabled) {
    stateClasses = "border-slate-800/60 bg-slate-950/40 text-slate-500 opacity-40 cursor-not-allowed";
  }

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <button
      type="button"
      onClick={() => onSelect(option)}
      disabled={isDisabled}
      className={`group relative flex min-h-[52px] items-center justify-between rounded-xl border p-3.5 sm:p-4 text-left transition-all duration-200 ${stateClasses}`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/80 text-xs font-bold text-slate-400 group-hover:border-slate-600 group-hover:text-slate-300">
          {optionLabels[index] || index + 1}
        </span>
        <span className="font-mono text-base sm:text-lg font-bold tracking-wider sm:tracking-widest">
          {option}
        </span>
      </div>

      {isSelected && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs text-blue-400">
          ✓
        </span>
      )}
    </button>
  );
}
