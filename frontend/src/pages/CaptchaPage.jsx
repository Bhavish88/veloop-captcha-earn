import { useEffect, useState, useRef, useCallback } from "react";
import DashboardNavbar from "../components/DashboardNavbar";
import CaptchaCard from "../components/captcha/CaptchaCard";
import MockRewardedAdModal from "../components/captcha/MockRewardedAdModal";
import {
  getCurrentCaptcha,
  verifyCaptcha,
  claimCaptcha,
  dismissCaptcha,
  getWalletSummary,
} from "../services/captchaService";

export default function CaptchaPage() {
  const [challenge, setChallenge] = useState(null);
  const [status, setStatus] = useState("LOADING");
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);
  const [reward, setReward] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [walletGems, setWalletGems] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  const isSubmittingRef = useRef(false);
  const countdownIntervalRef = useRef(null);

  const refreshWallet = useCallback(async () => {
    try {
      const summary = await getWalletSummary();
      setWalletGems(summary.gems);
    } catch {
      // Wallet summary fallback
    }
  }, []);

  const loadChallenge = useCallback(async () => {
    setStatus("LOADING");
    setErrorMsg("");
    setSelectedOption(null);
    setResult(null);
    setReward(null);
    isSubmittingRef.current = false;

    try {
      const data = await getCurrentCaptcha();
      setChallenge(data);
      setTimeRemaining(data.timeRemainingSeconds || 120);
      setStatus("CHALLENGE");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error?.message || "Failed to load CAPTCHA challenge."
      );
      setStatus("ERROR");
    }
  }, []);

  // Asynchronous initial setup on mount
  useEffect(() => {
    let ignore = false;

    const setup = async () => {
      try {
        const [summary, captchaData] = await Promise.all([
          getWalletSummary().catch(() => null),
          getCurrentCaptcha(),
        ]);
        if (!ignore) {
          if (summary) setWalletGems(summary.gems);
          setChallenge(captchaData);
          setTimeRemaining(captchaData.timeRemainingSeconds || 120);
          setStatus("CHALLENGE");
        }
      } catch (err) {
        if (!ignore) {
          setErrorMsg(
            err.response?.data?.error?.message || "Failed to load CAPTCHA challenge."
          );
          setStatus("ERROR");
        }
      }
    };

    setup();

    return () => {
      ignore = true;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (status !== "CHALLENGE" || !challenge?.expiresAt) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      return;
    }

    const targetTime = new Date(challenge.expiresAt).getTime();

    countdownIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((targetTime - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        setStatus("EXPIRED");
      }
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [status, challenge?.expiresAt]);

  const handleSelectOption = async (option) => {
    if (status !== "CHALLENGE" || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setSelectedOption(option);
    setStatus("OPTION_SELECTED");

    // 0.5s visual verification animation
    const animationDelay = new Promise((resolve) => setTimeout(resolve, 500));

    setStatus("VERIFYING");

    try {
      const [backendResult] = await Promise.all([
        verifyCaptcha(challenge.challengeId, option),
        animationDelay,
      ]);

      setResult(backendResult.result);
      setReward(backendResult.reward);
      setChallenge((prev) => ({
        ...prev,
        status: backendResult.status,
      }));

      if (backendResult.result === "CORRECT") {
        setStatus("SUCCESS");
      } else {
        setStatus("INCORRECT");
      }

      refreshWallet();
    } catch (err) {
      const code = err.response?.data?.error?.code;
      const message = err.response?.data?.error?.message;

      if (code === "CHALLENGE_EXPIRED") {
        setStatus("EXPIRED");
      } else {
        setErrorMsg(message || "Verification request failed.");
        setStatus("ERROR");
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleClaimClick = () => {
    setIsAdModalOpen(true);
  };

  const handleAdComplete = async () => {
    setIsAdModalOpen(false);
    setIsProcessing(true);

    try {
      const res = await claimCaptcha(challenge.challengeId);
      setChallenge((prev) => ({
        ...prev,
        status: res.status,
      }));
      await loadChallenge();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error?.message || "Failed to finalize claim."
      );
      setStatus("ERROR");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async () => {
    setIsProcessing(true);
    try {
      const res = await dismissCaptcha(challenge.challengeId);
      setChallenge((prev) => ({
        ...prev,
        status: res.status,
      }));
      await loadChallenge();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error?.message || "Failed to dismiss challenge."
      );
      setStatus("ERROR");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col">
      <DashboardNavbar />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        {/* Page Hero Header */}
        <div className="mb-8 text-center max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400">
            <span>✨ Micro-Task Rewards</span>
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-white">
            CAPTCHA Earn
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Verify alphanumeric visual codes to earn instant Gems. Correct answers yield <strong className="text-amber-400">+1.00 GEM</strong>, and wrong attempts yield <strong className="text-amber-400/80">+0.50 GEM</strong>.
          </p>
        </div>

        {/* Loading Skeleton */}
        {status === "LOADING" && (
          <div className="mx-auto w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center animate-pulse">
            <div className="mx-auto h-8 w-48 rounded-lg bg-slate-800" />
            <div className="mx-auto mt-6 h-20 w-64 rounded-2xl bg-slate-800/80" />
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-16 rounded-xl bg-slate-800" />
              <div className="h-16 rounded-xl bg-slate-800" />
              <div className="h-16 rounded-xl bg-slate-800" />
              <div className="h-16 rounded-xl bg-slate-800" />
            </div>
          </div>
        )}

        {/* Interactive CAPTCHA Card */}
        {status !== "LOADING" && (
          <CaptchaCard
            challenge={challenge}
            status={status}
            selectedOption={selectedOption}
            result={result}
            reward={reward}
            errorMsg={errorMsg}
            walletGems={walletGems}
            timeRemaining={timeRemaining}
            isProcessing={isProcessing}
            onSelectOption={handleSelectOption}
            onClaim={handleClaimClick}
            onDismiss={handleDismiss}
            onNext={loadChallenge}
            onRetry={loadChallenge}
          />
        )}
      </main>

      {/* Mock Rewarded Ad Modal */}
      <MockRewardedAdModal
        isOpen={isAdModalOpen}
        onComplete={handleAdComplete}
        onClose={() => setIsAdModalOpen(false)}
      />
    </div>
  );
}
