import CaptchaOptions from "./CaptchaOptions";
import CaptchaStatus from "./CaptchaStatus";
import ClaimActions from "./ClaimActions";

export default function CaptchaCard({
  challenge,
  status,
  selectedOption,
  result,
  reward,
  errorMsg,
  walletGems,
  timeRemaining,
  isProcessing,
  onSelectOption,
  onClaim,
  onDismiss,
  onNext,
  onRetry,
}) {
  const isInteractionDisabled =
    status !== "CHALLENGE" || isProcessing;

  const showActions =
    status === "SUCCESS" || status === "INCORRECT";

  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 via-[#0B0F19] to-black p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {/* Glow highlight */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

      {/* Header bar: Badge, Timer, Wallet Gems */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            VELoop CAPTCHA Challenge
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Live countdown timer */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-300">
            <span className="text-slate-400">⏱️</span>
            <span>{timeRemaining}s</span>
          </div>

          {/* Wallet Gems Badge */}
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
            <span>💎</span>
            <span>{walletGems !== null ? `${walletGems} Gems` : "Loading..."}</span>
          </div>
        </div>
      </div>

      {/* CAPTCHA Question Box */}
      <div className="relative z-10 my-7 text-center">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
          Identify the matching 6-character code
        </p>

        <div className="relative mx-auto mt-4 inline-block overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-8 py-5 shadow-inner">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-[length:12px_12px] opacity-40 pointer-events-none" />

          <span className="relative z-10 select-none font-mono text-3xl sm:text-4xl font-black tracking-[0.25em] text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
            {challenge?.question || "••••••"}
          </span>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Click the matching option below. Submitting is instant.
        </p>
      </div>

      {/* Options Grid */}
      <div className="relative z-10 my-6">
        <CaptchaOptions
          options={challenge?.options || []}
          selectedOption={selectedOption}
          isDisabled={isInteractionDisabled}
          status={status}
          onSelect={onSelectOption}
        />
      </div>

      {/* Status area */}
      <div className="relative z-10 my-4">
        <CaptchaStatus
          status={status}
          result={result}
          reward={reward}
          errorMsg={errorMsg}
          onRetry={onRetry}
        />
      </div>

      {/* Actions (Claim / No Thanks / Next) */}
      {showActions && (
        <div className="relative z-10 mt-6 border-t border-slate-800/60 pt-4">
          <ClaimActions
            challengeStatus={challenge?.status}
            isProcessing={isProcessing}
            onClaim={onClaim}
            onDismiss={onDismiss}
            onNext={onNext}
          />
        </div>
      )}
    </div>
  );
}
