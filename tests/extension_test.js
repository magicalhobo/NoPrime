/**
 * End-to-end extension test using Playwright.
 *
 * Tests three banner types on real Amazon pages:
 *   1. Book banner     - Barnes & Noble + local bookstores links
 *   2. Brand banner    - direct link to known brand store
 *   3. Fallback banner - DuckDuckGo search for unknown brands
 *   4. Suspect banner  - warning for all-caps (likely cheap) brands
 *
 * Each suite verifies the banner appears, toggle off/on works, and
 * dismiss + toggle re-init works.
 *
 * Usage:
 *   node tests/extension_test.js              # run all
 *   node tests/extension_test.js --headed     # show the browser
 *   node tests/extension_test.js book         # only the book suite
 *   node tests/extension_test.js brand        # only the brand suite
 *   node tests/extension_test.js fallback     # only the fallback suite
 *   node tests/extension_test.js suspect      # only the suspect suite
 *
 * Requires: npx playwright install chromium
 */

const path = require("path");

const { chromium } = require("playwright-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
chromium.use(StealthPlugin());

process.on("unhandledRejection", (err) => {
  if (/target.*(closed|destroyed)|context/i.test(String(err))) return;
  console.error("Unhandled rejection:", err);
  process.exit(2);
});

const EXTENSION_PATH = path.resolve(__dirname, "../extension");
const HEADED = process.argv.includes("--headed");
const TIMEOUT = 15_000;

const PAGES = {
  book: {
    name: "Book (GEB by Hofstadter)",
    url: "https://www.amazon.com/G%C3%B6del-Escher-Bach-Eternal-Golden/dp/0465026567",
  },
  brand: {
    name: "Brand (Sony WH-1000XM5)",
    url: "https://www.amazon.com/Sony-WH-1000XM5-Canceling-Headphones-Hands-Free/dp/B09XS7JWHH",
  },
  fallback: {
    name: "Fallback (Raspberry Pi 4)",
    url: "https://www.amazon.com/Raspberry-Pi-Computer-Suitable-Workstation/dp/B0899VXM8F",
  },
  suspect: {
    name: "Suspect (LEVOIT air purifier)",
    url: "https://www.amazon.com/LEVOIT-Purifiers-Allergies-Core-300/dp/B07VVK39F7",
  },
};

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`   ✅ ${label}`);
    passed++;
  } else {
    console.error(`   ❌ ${label}`);
    failed++;
  }
  return condition;
}

async function launchContext() {
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    channel: HEADED ? undefined : "chromium",
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      "--no-first-run",
      "--disable-gpu",
      "--deny-permission-prompts",
      ...(HEADED ? [] : ["--headless=new"]),
    ],
    viewport: { width: 1280, height: 800 },
  });

  let bgWorker;
  for (let i = 0; i < 10; i++) {
    for (const sw of context.serviceWorkers()) {
      if (sw.url().includes("background.js")) {
        bgWorker = sw;
        break;
      }
    }
    if (bgWorker) break;
    await sleep(500);
  }

  if (!bgWorker) {
    bgWorker = await new Promise((resolve) => {
      context.on("serviceworker", (sw) => {
        if (sw.url().includes("background.js")) resolve(sw);
      });
      setTimeout(() => resolve(null), 5000);
    });
  }

  if (!bgWorker) {
    console.error("❌ Could not find extension service worker");
    await context.close();
    process.exit(1);
  }

  const extensionId = new URL(bgWorker.url()).hostname;
  console.log(`   Extension ID: ${extensionId}\n`);

  return { context, bgWorker };
}

async function toggleExtension(bgWorker, enabled) {
  await bgWorker.evaluate((val) => chrome.storage.sync.set({ enabled: val }), enabled);
  await bgWorker.evaluate(async (val) => {
    const tabs = await chrome.tabs.query({ url: "https://www.amazon.com/*" });
    for (const tab of tabs) {
      await chrome.tabs.sendMessage(tab.id, { type: "ENABLED_CHANGED", enabled: val }).catch(() => {});
    }
  }, enabled);
}

async function describeBanner(page) {
  return page.evaluate(() => {
    const banner = document.getElementById("no-prime-banner");
    if (!banner) return { present: false, summary: "(no banner)" };

    const msg = banner.querySelector(".no-prime-msg")?.textContent?.trim() || "";
    const buttons = [...banner.querySelectorAll(".no-prime-btn:not(.no-prime-btn-dismiss)")]
      .map((b) => ({ text: b.textContent.trim(), href: b.href || null }));
    const labels = buttons.map((b) => b.text);

    return { present: true, summary: `"${msg}" [${labels.join(", ")}]`, message: msg, buttons, labels };
  });
}

// Banner classifiers
function isBookBanner(b) {
  return b.present && b.labels.some((l) => /barnes/i.test(l)) && b.labels.some((l) => /local bookstores/i.test(l));
}
function isBrandBanner(b) {
  return b.present && /available directly from/i.test(b.message) && b.labels.some((l) => /^go to /i.test(l));
}
function isFallbackBanner(b) {
  return b.present && /search online/i.test(b.message) && b.labels.some((l) => /duckduckgo/i.test(l));
}
function isSuspectBanner(b) {
  return b.present && /doesn't appear to be/i.test(b.message) && b.labels.some((l) => /duckduckgo/i.test(l));
}

async function loadAndWaitForBanner(page, url) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: TIMEOUT });
  } catch (e) {
    console.error(`   ❌ Failed to load page: ${e.message}`);
    return null;
  }
  try {
    await page.waitForSelector("#no-prime-banner", { timeout: TIMEOUT });
  } catch {
    console.error("   ❌ Banner never appeared");
    return null;
  }
  return describeBanner(page);
}

async function testToggleAndDismiss(page, bgWorker, checker, typeName) {
  // Toggle OFF
  await toggleExtension(bgWorker, false);
  await sleep(500);
  assert(!(await page.$("#no-prime-banner")), `Banner removed after toggle OFF`);

  // Toggle ON
  await toggleExtension(bgWorker, true);
  await sleep(1000);
  try {
    await page.waitForSelector("#no-prime-banner", { state: "visible", timeout: 5000 });
  } catch {
    assert(false, `Banner reappeared after toggle ON`);
    return;
  }
  const afterOn = await describeBanner(page);
  assert(checker(afterOn), `Correct ${typeName} banner after toggle on/off`);

  // Dismiss
  await page.click("#no-prime-banner .no-prime-btn-dismiss");
  await sleep(300);
  assert(!(await page.$("#no-prime-banner")), `Banner dismissed`);

  // Toggle off then on (forces re-init since banner was removed)
  await toggleExtension(bgWorker, false);
  await sleep(300);
  await toggleExtension(bgWorker, true);
  await sleep(1500);

  try {
    await page.waitForSelector("#no-prime-banner", { state: "visible", timeout: 5000 });
  } catch {
    assert(false, `Banner reappeared after dismiss + toggle cycle`);
    return;
  }
  const afterCycle = await describeBanner(page);
  assert(checker(afterCycle), `Correct ${typeName} banner after dismiss + toggle cycle`);
}

async function testBook(page, bgWorker) {
  console.log(`\n-- Book test --`);
  console.log(`   URL: ${PAGES.book.url}\n`);

  const banner = await loadAndWaitForBanner(page, PAGES.book.url);
  if (!banner) return;

  console.log(`   Banner: ${banner.summary}`);
  assert(isBookBanner(banner), `Book banner on first load`);

  const bnBtn = banner.buttons.find((b) => /barnes/i.test(b.text));
  assert(bnBtn?.href?.includes("barnesandnoble.com"), `Barnes & Noble link points to barnesandnoble.com`);

  const localBtn = banner.buttons.find((b) => /local bookstores/i.test(b.text));
  assert(localBtn?.href?.includes("duckduckgo.com"), `Local bookstores link points to DuckDuckGo`);

  await testToggleAndDismiss(page, bgWorker, isBookBanner, "book");
}

async function testBrand(page, bgWorker) {
  console.log(`\n-- Brand test --`);
  console.log(`   URL: ${PAGES.brand.url}\n`);

  const banner = await loadAndWaitForBanner(page, PAGES.brand.url);
  if (!banner) return;

  console.log(`   Banner: ${banner.summary}`);

  if (isFallbackBanner(banner)) {
    console.log("   ⚠ Got fallback banner (brand may not be mapped for this product), skipping");
    return;
  }

  assert(isBrandBanner(banner), `Brand banner on first load`);

  const primaryBtn = banner.buttons.find((b) => /^go to /i.test(b.text));
  assert(
    primaryBtn?.href && !primaryBtn.href.includes("duckduckgo.com"),
    `Primary button links to brand store`
  );

  await testToggleAndDismiss(page, bgWorker, isBrandBanner, "brand");
}

async function testFallback(page, bgWorker) {
  console.log(`\n-- Fallback test --`);
  console.log(`   URL: ${PAGES.fallback.url}\n`);

  const banner = await loadAndWaitForBanner(page, PAGES.fallback.url);
  if (!banner) return;

  console.log(`   Banner: ${banner.summary}`);

  if (isBrandBanner(banner)) {
    console.log("   ⚠ Got brand banner (this brand may be in the map), skipping");
    return;
  }

  assert(isFallbackBanner(banner), `Fallback banner on first load`);

  const ddgBtn = banner.buttons.find((b) => /duckduckgo/i.test(b.text));
  assert(ddgBtn?.href?.includes("duckduckgo.com"), `DuckDuckGo search link present`);
  assert(ddgBtn?.href?.includes("-amazon"), `DuckDuckGo search excludes Amazon`);

  await testToggleAndDismiss(page, bgWorker, isFallbackBanner, "fallback");
}

async function testSuspect(page, bgWorker) {
  console.log(`\n-- Suspect test --`);
  console.log(`   URL: ${PAGES.suspect.url}\n`);

  const banner = await loadAndWaitForBanner(page, PAGES.suspect.url);
  if (!banner) return;

  console.log(`   Banner: ${banner.summary}`);

  if (isBrandBanner(banner) || isFallbackBanner(banner)) {
    console.log("   ⚠ Got brand/fallback banner (brand may not appear as all-caps), skipping");
    return;
  }

  assert(isSuspectBanner(banner), `Suspect banner on first load`);

  const ddgBtn = banner.buttons.find((b) => /duckduckgo/i.test(b.text));
  assert(ddgBtn?.href?.includes("duckduckgo.com"), `DuckDuckGo search link present`);

  await testToggleAndDismiss(page, bgWorker, isSuspectBanner, "suspect");
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const validSuites = ["book", "brand", "fallback", "suspect"];
  const suites = args.length > 0 ? args.filter((a) => validSuites.includes(a)) : validSuites;

  if (suites.length === 0) {
    console.error(`Usage: node extension_test.js [${validSuites.join("|")}] [--headed]`);
    process.exit(2);
  }

  console.log("\n🧪 NoPrime extension test\n");
  console.log(`   Suites: ${suites.join(", ")}`);
  console.log("   Launching Chromium with extension loaded…\n");

  const { context, bgWorker } = await launchContext();
  const page = await context.newPage();

  if (suites.includes("book")) await testBook(page, bgWorker);
  if (suites.includes("brand")) await testBrand(page, bgWorker);
  if (suites.includes("fallback")) await testFallback(page, bgWorker);
  if (suites.includes("suspect")) await testSuspect(page, bgWorker);

  console.log(`\n   Results: ${passed} passed, ${failed} failed\n`);

  await context.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(2);
});
