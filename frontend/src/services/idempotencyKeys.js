export const loadIdempotencyKeys = (storageKey) => {
  try {
    const entries = JSON.parse(
      sessionStorage.getItem(storageKey) || "[]"
    );

    return new Map(
      Array.isArray(entries)
        ? entries.filter(
            ([fingerprint, key]) =>
              typeof fingerprint === "string" &&
              typeof key === "string"
          )
        : []
    );
  } catch {
    return new Map();
  }
};

export const persistIdempotencyKeys = (storageKey, keys) => {
  try {
    if (keys.size === 0) {
      sessionStorage.removeItem(storageKey);
      return;
    }

    sessionStorage.setItem(
      storageKey,
      JSON.stringify([...keys.entries()])
    );
  } catch {
    // The in-memory map still protects retries until this page is closed.
  }
};

export const getRequestFingerprint = async (payload) => {
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
};