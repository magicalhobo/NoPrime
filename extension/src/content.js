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

/** Create an element with optional className and textContent. */
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

/** Create a <strong> element. */
function strong(text) {
  return el("strong", null, text);
}

/** Create an <a> element styled as a button. */
function linkBtn(className, href, label) {
  const a = el("a", className, label);
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}

/** Create the dismiss (✕) button. */
function dismissBtn() {
  const btn = el("button", "no-prime-btn no-prime-btn-dismiss", "✕");
  btn.title = "Dismiss";
  return btn;
}

async function init() {
  // Respect user preference
  const { enabled } = await chrome.storage.sync.get({ enabled: true });
  if (!enabled) return;

  const { extractProductInfo, lookupBrand, buildRedirectUrl, buildSearchFallbackUrl,
          buildBarnesNobleUrl, buildLocalBookstoreUrl } = window.NoPrime;

  const product = extractProductInfo();
  if (!product.title) return; // Not a real product page

  if (product.isBook) {
    const bnUrl    = buildBarnesNobleUrl(product.isbn, product.title);
    const localUrl = buildLocalBookstoreUrl(product.title);

    chrome.runtime.sendMessage({
      type: "PRODUCT_DETECTED",
      payload: { ...product, redirectUrl: bnUrl, matchType: "book", storeBrand: null },
    });

    injectBookBanner(product, bnUrl, localUrl);
    observeSoftNavigation();
    return;
  }

  const { isSuspectBrand } = window.NoPrime;
  const storeEntry = lookupBrand(product.brand);
  let redirectUrl;
  let matchType; // "brand" | "search-fallback" | "suspect-brand"

  if (storeEntry) {
    redirectUrl = buildRedirectUrl(storeEntry, product.title);
    matchType = "brand";
  } else if (isSuspectBrand(product.brand)) {
    redirectUrl = buildSearchFallbackUrl(product.brand, product.title);
    matchType = "suspect-brand";
  } else {
    redirectUrl = buildSearchFallbackUrl(product.brand, product.title);
    matchType = "search-fallback";
  }

  // Send product info to background for badge and state tracking
  chrome.runtime.sendMessage({
    type: "PRODUCT_DETECTED",
    payload: { ...product, redirectUrl, matchType, storeBrand: storeEntry?.brand || null },
  });

  if (matchType === "suspect-brand") {
    injectSuspectBanner(product, redirectUrl);
  } else {
    injectBanner(product, redirectUrl, matchType, storeEntry);
  }

  // Watch for Amazon's soft navigation (SPA-like page transitions)
  observeSoftNavigation();
}

function injectBanner(product, redirectUrl, matchType, storeEntry) {
  // Remove any existing banner first
  document.getElementById("no-prime-banner")?.remove();

  const banner = document.createElement("div");
  banner.id = "no-prime-banner";
  if (matchType === "search-fallback") banner.classList.add("no-prime-fallback");
  banner.setAttribute("role", "alert");

  const brandLabel = product.brand || "the manufacturer";
  const isAlternate = storeEntry && storeEntry.store;

  // Build message span
  const msg = el("span", "no-prime-msg");
  if (isAlternate) {
    msg.append("This ", strong(brandLabel), " product may be available at ", strong(storeEntry.store), ".");
  } else if (matchType === "brand") {
    msg.append("This product may be available directly from ", strong(brandLabel), ".");
  } else {
    msg.append("We couldn't find the store for ", strong(brandLabel), ", but you can search online.");
  }

  const buttonLabel = isAlternate
    ? "Search " + storeEntry.store
    : matchType === "brand"
      ? "Go to " + brandLabel
      : "Search on DuckDuckGo";

  // Build actions
  const actions = el("div", "no-prime-actions");
  actions.append(
    linkBtn("no-prime-btn no-prime-btn-primary", redirectUrl, buttonLabel),
    dismissBtn(),
  );

  const content = el("div", "no-prime-content");
  content.append(msg, actions);
  banner.append(content);

  // Dismiss handler
  banner.querySelector(".no-prime-btn-dismiss").addEventListener("click", () => {
    banner.remove();
  });

  document.body.prepend(banner);
}

/**
 * Inject a book-specific banner with two action links:
 *   1. Barnes & Noble – deep link by ISBN or title search
 *   2. DuckDuckGo search for local bookstores carrying this title
 */
function injectBookBanner(product, bnUrl, localUrl) {
  document.getElementById("no-prime-banner")?.remove();

  const banner = document.createElement("div");
  banner.id = "no-prime-banner";
  banner.setAttribute("role", "alert");

  const msg = el("span", "no-prime-msg", "This book may be available from other booksellers.");

  const actions = el("div", "no-prime-actions");
  actions.append(
    linkBtn("no-prime-btn no-prime-btn-primary", localUrl, "Find Local Bookstores"),
    linkBtn("no-prime-btn no-prime-btn-secondary", bnUrl, "Barnes & Noble"),
    dismissBtn(),
  );

  const content = el("div", "no-prime-content");
  content.append(msg, actions);
  banner.append(content);

  banner.querySelector(".no-prime-btn-dismiss").addEventListener("click", () => {
    banner.remove();
  });

  document.body.prepend(banner);
}

/**
 * Inject a warning banner for products from brands with gibberish names
 * that are likely cheap Amazon-only sellers.
 */
function injectSuspectBanner(product, redirectUrl) {
  document.getElementById("no-prime-banner")?.remove();

  const banner = document.createElement("div");
  banner.id = "no-prime-banner";
  banner.className = "no-prime-warning";
  banner.setAttribute("role", "alert");

  const brandLabel = product.brand || "This brand";

  const msg = el("span", "no-prime-msg");
  msg.append(
    strong(brandLabel),
    " doesn't appear to be a well-known manufacturer. Consider researching before buying.",
  );

  const actions = el("div", "no-prime-actions");
  actions.append(
    linkBtn("no-prime-btn no-prime-btn-primary", redirectUrl, "Search on DuckDuckGo"),
    dismissBtn(),
  );

  const content = el("div", "no-prime-content");
  content.append(msg, actions);
  banner.append(content);

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
    const { extractProductInfo, lookupBrand, buildRedirectUrl, buildSearchFallbackUrl,
            buildBarnesNobleUrl, buildLocalBookstoreUrl } = window.NoPrime;
    const product = extractProductInfo();
    if (!product.title) {
      sendResponse(null);
      return true;
    }

    let redirectUrl;
    let matchType;
    let storeBrand = null;

    if (product.isBook) {
      redirectUrl = buildBarnesNobleUrl(product.isbn, product.title);
      matchType = "book";
    } else {
      const storeEntry = lookupBrand(product.brand);
      if (storeEntry) {
        redirectUrl = buildRedirectUrl(storeEntry, product.title);
        matchType = "brand";
        storeBrand = storeEntry.brand;
      } else if (window.NoPrime.isSuspectBrand(product.brand)) {
        redirectUrl = buildSearchFallbackUrl(product.brand, product.title);
        matchType = "suspect-brand";
      } else {
        redirectUrl = buildSearchFallbackUrl(product.brand, product.title);
        matchType = "search-fallback";
      }
    }

    const payload = { ...product, redirectUrl, matchType, storeBrand };

    // Also update the background cache while we're at it
    chrome.runtime.sendMessage({ type: "PRODUCT_DETECTED", payload });

    sendResponse(payload);
    return true;
  }

  // Live toggle: remove or re-inject the banner without reloading
  if (msg.type === "ENABLED_CHANGED") {
    if (msg.enabled) {
      window.__noPrimeInjected = false;
      init();
    } else {
      document.getElementById("no-prime-banner")?.remove();
    }
  }
});
