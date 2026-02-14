/**
 * Background service worker (Manifest V3).
 *
 * - Click the toolbar icon to toggle the extension on / off.
 * - Icon grays out when disabled.
 * - Maintains per-tab product state in session storage.
 */

const ICON_ENABLED = {
  16: "/icons/icon16.png",
  48: "/icons/icon48.png",
  128: "/icons/icon128.png",
};

const ICON_DISABLED = {
  16: "/icons/icon16-disabled.png",
  48: "/icons/icon48-disabled.png",
  128: "/icons/icon128-disabled.png",
};

async function applyIconState() {
  const { enabled } = await chrome.storage.sync.get({ enabled: true });
  chrome.action.setIcon({ path: enabled ? ICON_ENABLED : ICON_DISABLED });
  chrome.action.setTitle({ title: enabled ? "NoPrime (click to disable)" : "NoPrime (click to enable)" });
}

applyIconState();

chrome.action.onClicked.addListener(async () => {
  const { enabled } = await chrome.storage.sync.get({ enabled: true });
  const newState = !enabled;
  await chrome.storage.sync.set({ enabled: newState });

  chrome.action.setIcon({ path: newState ? ICON_ENABLED : ICON_DISABLED });
  chrome.action.setTitle({ title: newState ? "NoPrime (click to disable)" : "NoPrime (click to enable)" });

  // Tell all Amazon tabs about the state change
  const patterns = [
    "https://www.amazon.com/*",
    "https://www.amazon.co.uk/*",
    "https://www.amazon.ca/*",
    "https://www.amazon.de/*",
    "https://www.amazon.fr/*",
    "https://www.amazon.it/*",
    "https://www.amazon.es/*",
    "https://www.amazon.co.jp/*",
    "https://www.amazon.com.au/*",
    "https://www.amazon.in/*",
    "https://www.amazon.com.br/*",
    "https://www.amazon.nl/*",
    "https://www.amazon.sg/*",
    "https://www.amazon.com.mx/*",
  ];
  const tabs = await chrome.tabs.query({ url: patterns });
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, { type: "ENABLED_CHANGED", enabled: newState }).catch(() => {});

    if (newState) {
      // Restore badge from cached product data
      const product = await getProduct(tab.id);
      if (product) {
        const badgeColor = product.matchType === "suspect-brand" ? "#dc2626"
          : product.matchType === "search-fallback" ? "#b45309"
          : "#1a6b3c";
        const badgeText = product.matchType === "suspect-brand" ? "⚠"
          : product.matchType === "search-fallback" ? "?"
          : "✓";
        chrome.action.setBadgeBackgroundColor({
          tabId: tab.id,
          color: badgeColor,
        });
        chrome.action.setBadgeText({
          tabId: tab.id,
          text: badgeText,
        });
      }
    } else {
      chrome.action.setBadgeText({ tabId: tab.id, text: "" });
    }
  }
});

function storageKey(tabId) {
  return `tab_${tabId}`;
}

async function setProduct(tabId, payload) {
  await chrome.storage.session.set({ [storageKey(tabId)]: payload });
}

async function getProduct(tabId) {
  const key = storageKey(tabId);
  const result = await chrome.storage.session.get(key);
  return result[key] || null;
}

async function deleteProduct(tabId) {
  await chrome.storage.session.remove(storageKey(tabId));
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "PRODUCT_DETECTED" && sender.tab) {
    const tabId = sender.tab.id;
    const matchType = msg.payload.matchType;

    setProduct(tabId, msg.payload).then(async () => {
      const { enabled } = await chrome.storage.sync.get({ enabled: true });
      if (!enabled) return;
      chrome.action.setBadgeBackgroundColor({
        tabId,
        color: matchType === "suspect-brand" ? "#dc2626"
          : matchType === "search-fallback" ? "#b45309"
          : "#1a6b3c",
      });
      chrome.action.setBadgeText({
        tabId,
        text: matchType === "suspect-brand" ? "⚠"
          : matchType === "search-fallback" ? "?"
          : "✓",
      });
    });
  }

  if (msg.type === "GET_PRODUCT" && msg.tabId != null) {
    getProduct(msg.tabId).then(sendResponse);
    return true;
  }
});

// Clean up when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  deleteProduct(tabId);
});

// Clear state on navigation to non-product pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    const isProductPage = /\/(?:dp|gp\/product)\/[A-Z0-9]{10}/i.test(changeInfo.url);
    if (!isProductPage) {
      deleteProduct(tabId);
      chrome.action.setBadgeText({ tabId, text: "" });
    }
  }
});
