import api from "./api";

/**
 * Service for CAPTCHA Earn operations.
 * CRITICAL SECURITY:
 * Never sends or accepts client-calculated rewards, correctness, or user IDs.
 */

export const getCurrentCaptcha = async () => {
  const response = await api.get("/captcha/current/");
  return response.data.data;
};

export const verifyCaptcha = async (challengeId, selectedOption) => {
  // Strictly submit ONLY challengeId and selectedOption.
  const response = await api.post("/captcha/verify/", {
    challengeId,
    selectedOption,
  });
  return response.data.data;
};

export const claimCaptcha = async (challengeId) => {
  const response = await api.post("/captcha/claim/", {
    challengeId,
  });
  return response.data.data;
};

export const dismissCaptcha = async (challengeId) => {
  const response = await api.post("/captcha/dismiss/", {
    challengeId,
  });
  return response.data.data;
};

export const getWalletSummary = async () => {
  const response = await api.get("/wallet/summary/");
  return response.data.data;
};
