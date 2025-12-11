// secureRequest.js
// Handles JWT-secured API requests with optional Background Sync fallback

export const secureRequest = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  // Merge headers safely
  const headers = {
    ...(options.headers || {}),
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };

  const finalOptions = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, finalOptions);

    // API returned a valid response
    if (response.ok) return response;

    // If unauthorized, let calling function handle logout
    if (response.status === 401 || response.status === 403) {
      return response;
    }

    // For all other failures → try Background Sync
    await queueForBackgroundSync(url, finalOptions);
    return response;

  } catch (error) {
    console.error("Network error → saving request for background sync:", error);

    // Save for retry Sync if offline
    await queueForBackgroundSync(url, finalOptions);
    throw error;
  }
};

// ─────────────────────────────────────────
// Background Sync Helper
// ─────────────────────────────────────────
const queueForBackgroundSync = async (url, options) => {
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        action: "OUTBOX_ADD",
        payload: {
          url,
          method: options.method || "GET",
          headers: options.headers,
          body: options.body ? JSON.parse(options.body) : null,
        },
      });
    }
  } catch (err) {
    console.error("Failed to queue for background sync:", err);
  }
};
