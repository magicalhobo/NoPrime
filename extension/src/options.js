/**
 * Options page script – persists the user's preferred search engine.
 */

const select = document.getElementById("search-engine");
const savedMsg = document.getElementById("saved-msg");

// Load saved preference
chrome.storage.sync.get({ searchEngine: "duckduckgo" }, ({ searchEngine }) => {
  select.value = searchEngine;
});

// Save on change
select.addEventListener("change", () => {
  chrome.storage.sync.set({ searchEngine: select.value }, () => {
    savedMsg.classList.add("show");
    setTimeout(() => savedMsg.classList.remove("show"), 1500);
  });
});
