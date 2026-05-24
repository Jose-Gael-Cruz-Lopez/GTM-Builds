/** Register minimal PWA service worker (wallet add-to-homescreen). */
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW optional — ignore registration failures
    });
  });
}
