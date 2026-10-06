import { useEffect, useState } from "react";

export default function MockRewardedAdModal({ isOpen, onComplete, onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleClose = () => {
    setSecondsLeft(3);
    onClose();
  };

  const handleComplete = () => {
    setSecondsLeft(3);
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6 text-center shadow-2xl">
        {/* Ad Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-300">
          <span>📢 Sponsored Rewarded Ad</span>
        </div>

        <div className="mt-4 sm:mt-6 rounded-xl border border-slate-800 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 p-4 sm:p-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-3xl">
            ⚡
          </div>
          <h3 className="mt-4 text-lg font-bold text-white">
            VELoop Partner Network
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Thank you for supporting VELoop. Complete this brief promotional view to claim your reward.
          </p>

          {/* Progress Bar */}
          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
              style={{ width: `${((3 - secondsLeft) / 3) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {secondsLeft > 0
              ? `Ad ending in ${secondsLeft}s...`
              : "Ad completed! You may now claim."}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleComplete}
            disabled={secondsLeft > 0}
            className={`w-full rounded-xl py-3 text-sm font-bold transition shadow-lg ${
              secondsLeft === 0
                ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20 cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
            }`}
          >
            {secondsLeft > 0 ? `Please wait (${secondsLeft}s)` : "Confirm & Claim →"}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="text-xs text-slate-400 hover:text-slate-200 transition py-1"
          >
            Cancel / Close
          </button>
        </div>
      </div>
    </div>
  );
}
