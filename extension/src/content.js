/**
 * Content script – runs on Amazon product pages.
 *
 * 1. Extracts product metadata from the page DOM.
 * 2. Resolves the brand to a direct-to-consumer store URL.
 * 3. Injects a non-intrusive banner at the top of the page offering
 *    to redirect the user.
 * 4. Communicates with the background service worker to share state.
 *
 * NOTE: Chrome MV3 content scripts cannot use ES module imports.
 * The brand database (brands.js) and extractor (extractor.js) are loaded
 * as separate content script files in manifest.json and expose their
 * functions on the global `window.NoPrime` namespace.
 */

// Prevent running twice (Amazon does soft-navigation via History API)
if (!window.__noPrimeInjected) {
  window.__noPrimeInjected = true;
  init();
}

function capitalize(s) {
  return s.replace(/(?:^|\s)\S/g, c => c.toUpperCase());
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

async function init() {
  // Respect user preference
  const { enabled } = await chrome.storage.sync.get({ enabled: true });
  if (!enabled) return;

  const { extractProductInfo, lookupBrand, buildRedirectUrl, buildSearchFallbackUrl } = window.NoPrime;

  const product = extractProductInfo();
  if (!product.title) return; // Not a real product page

  const storeEntry = lookupBrand(product.brand);
  let redirectUrl;
  let matchType; // "exact" | "search-fallback"

  if (storeEntry) {
    redirectUrl = buildRedirectUrl(storeEntry, product.title);
    matchType = "exact";
  } else {
    redirectUrl = buildSearchFallbackUrl(product.brand, product.title);
    matchType = "search-fallback";
  }

  // Send product info to background for badge and state tracking
  chrome.runtime.sendMessage({
    type: "PRODUCT_DETECTED",
    payload: { ...product, redirectUrl, matchType, storeBrand: storeEntry?.brand || null },
  });

  injectBanner(product, redirectUrl, matchType, storeEntry);

  // Watch for Amazon's soft navigation (SPA-like page transitions)
  observeSoftNavigation();
}

function injectBanner(product, redirectUrl, matchType, storeEntry) {
  // Remove any existing banner first
  document.getElementById("no-prime-banner")?.remove();

  const banner = document.createElement("div");
  banner.id = "no-prime-banner";
  banner.setAttribute("role", "alert");

  const brandLabel = storeEntry?.brand
    ? capitalize(storeEntry.brand)
    : product.brand || "the manufacturer";

  const message =
    matchType === "exact"
      ? `This product may be available directly from <strong>${brandLabel}</strong>.`
      : `We couldn't find the store for <strong>${brandLabel}</strong>, but you can search online.`;

  banner.innerHTML = `
    <div class="no-prime-content">
      <span class="no-prime-msg">${message}</span>
      <div class="no-prime-actions">
        <a class="no-prime-btn no-prime-btn-primary" href="${escapeHtml(redirectUrl)}" target="_blank" rel="noopener noreferrer">
          ${matchType === "exact" ? "Go to " + escapeHtml(capitalize(brandLabel)) : "Search on DuckDuckGo"}
        </a>
        <button class="no-prime-btn no-prime-btn-dismiss" title="Dismiss">✕</button>
      </div>
    </div>
  `;

  // Dismiss handler
  banner.querySelector(".no-prime-btn-dismiss").addEventListener("click", () => {
    banner.remove();
  });

  document.body.prepend(banner);
}

/**
 * Amazon sometimes does SPA-style navigation (history.pushState) without a
 * full page reload.  We observe title changes to re-run when that happens.
 */
function observeSoftNavigation() {
  let lastPath = location.pathname;

  const observer = new MutationObserver(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      // Only re-run on product pages
      if (/\/(?:dp|gp\/product)\/[A-Z0-9]{10}/i.test(lastPath)) {
        window.__noPrimeInjected = false;
        init();
      }
    }
  });

  observer.observe(document.querySelector("title") || document.head, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "QUERY_PRODUCT") {
    const { extractProductInfo, lookupBrand, buildRedirectUrl, buildSearchFallbackUrl } = window.NoPrime;
    const product = extractProductInfo();
    if (!product.title) {
      sendResponse(null);
      return true;
    }

    const storeEntry = lookupBrand(product.brand);
    let redirectUrl;
    let matchType;

    if (storeEntry) {
      redirectUrl = buildRedirectUrl(storeEntry, product.title);
      matchType = "exact";
    } else {
      redirectUrl = buildSearchFallbackUrl(product.brand, product.title);
      matchType = "search-fallback";
    }

    const payload = { ...product, redirectUrl, matchType, storeBrand: storeEntry?.brand || null };

    // Also update the background cache while we're at it
    chrome.runtime.sendMessage({ type: "PRODUCT_DETECTED", payload });

    sendResponse(payload);
    return true;
  }

  // Live toggle: show / hide the banner without reloading
  if (msg.type === "ENABLED_CHANGED") {
    const banner = document.getElementById("no-prime-banner");
    if (msg.enabled) {
      // Re-run if there's no banner yet
      if (!banner) {
        window.__noPrimeInjected = false;
        init();
      }
    } else {
      // Remove the banner immediately
      banner?.remove();
    }
  }
});
