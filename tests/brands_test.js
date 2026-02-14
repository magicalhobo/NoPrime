/**
 * Browser-based brand URL validator using Playwright.
 *
 * Uses real Chromium to validate URLs.
 *
 * Usage:
 *   node tests/brands_test.js                 # test all brands
 *   node tests/brands_test.js nike adidas     # test specific brands
 *   node tests/brands_test.js --headed        # show the browser window
 *   node tests/brands_test.js --homepage-only
 *   node tests/brands_test.js --template-only
 *   node tests/brands_test.js --screenshot    # save screenshots of failures
 *
 * Requires: npx playwright install chromium
 *
 * Exit code:
 *   0 = all passed, 1 = failures found
 */

const fs = require("fs");
const path = require("path");

const { chromium } = require("playwright-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
chromium.use(StealthPlugin());

// Suppress unhandled promise rejections from the stealth plugin.
// When we force-close a BrowserContext via the hard timeout, the stealth
// plugin's CDP hooks may fire on the now-dead session, producing an
// "Target page, context or browser has been closed" rejection.  This is
// harmless — the context is intentionally destroyed — but would otherwise
// crash the process.
process.on("unhandledRejection", (err) => {
  if (/target.*(closed|destroyed)|context/i.test(String(err))) return;
  console.error("Unhandled rejection:", err);
  process.exit(2);
});

const CONCURRENCY      = 3;       // browser tabs in parallel
const TIMEOUT_MS       = 12_000;  // 12 s per navigation
const HARD_TIMEOUT_MS  = 18_000;  // 18 s absolute wall-clock max per URL
const DELAY_BETWEEN_MS = 500;     // polite delay between batches
const TEST_QUERY       = "running shoes";
const BRANDS_FILE      = path.resolve(__dirname, "../extension/src/brands.js");
const SCREENSHOT_DIR   = path.resolve(__dirname, "screenshots");

function parseBrandsFile(filePath) {
  const source = fs.readFileSync(filePath, "utf-8");
  const brands = {};
  const entryRe = /"([^"]+)":\s*\{\s*url:\s*"([^"]+)"(?:,\s*searchTemplate:\s*"([^"]+)")?\s*\}/g;

  let match;
  while ((match = entryRe.exec(source)) !== null) {
    const [, name, url, searchTemplate] = match;
    brands[name] = { url, ...(searchTemplate ? { searchTemplate } : {}) };
  }

  if (Object.keys(brands).length === 0) {
    console.error("❌ Failed to parse any brands from", filePath);
    process.exit(2);
  }

  return brands;
}

/**
 * Check a single URL using its own isolated BrowserContext.
 *
 * Each URL gets a fresh context.  When the hard-timeout fires we call
 * context.close(), which tears down the underlying CDP connection and
 * forces any stuck Playwright calls (goto, evaluate, even page.close)
 * to throw immediately.  This is the only reliable way to abort a hung
 * Playwright operation — page.close() alone hangs when CDP is stuck.
 */
async function checkUrl(browser, url, { saveScreenshot = false, brand = "", type = "" } = {}) {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    locale: "en-US",
    viewport: { width: 1280, height: 720 },
  });

  let hardTimer;

  // Promise that fires after HARD_TIMEOUT_MS and DESTROYS the context.
  const hardTimeoutPromise = new Promise((resolve) => {
    hardTimer = setTimeout(() => {
      context.close().catch(() => {});
      resolve({ ok: false, status: null, soft404: false, error: "HARD_TIMEOUT" });
    }, HARD_TIMEOUT_MS);
  });

  // The actual navigation + check logic.
  const checkPromise = (async () => {
    const page = await context.newPage();
    try {
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: TIMEOUT_MS,
      });

      const status = response?.status() ?? null;
      let ok = status !== null && status >= 200 && status < 400;

      // Lightweight soft-404 detection: just check page title, no body eval
      let soft404 = false;
      if (ok) {
        try {
          const title = await page.title();
          soft404 =
            /page not found|404|not found/i.test(title) &&
            !/search|results|shop/i.test(title);
        } catch {
          /* context may have been killed by hard timeout */
        }
      }

      if (saveScreenshot && (!ok || soft404)) {
        try {
          fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
          const filename = `${brand}-${type}-${status}.png`.replace(/[^a-z0-9.-]/gi, "_");
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename) });
        } catch { /* ignore */ }
      }

      return { ok: ok && !soft404, status, soft404, error: null };
    } catch (err) {
      // Context destroyed by hard timeout → "Target closed" / "has been closed"
      if (/target closed|has been closed|context/i.test(err.message)) {
        return { ok: false, status: null, soft404: false, error: "HARD_TIMEOUT" };
      }

      const errorType = err.message?.includes("Timeout")
        ? "TIMEOUT"
        : err.message?.includes("net::ERR_NAME_NOT_RESOLVED")
          ? "DNS_FAILED"
          : err.message?.includes("net::ERR_CONNECTION_REFUSED")
            ? "CONN_REFUSED"
            : err.message?.includes("net::")
              ? err.message.match(/net::\S+/)?.[0] || err.message
              : err.message?.slice(0, 80) || "UNKNOWN";

      return { ok: false, status: null, soft404: false, error: errorType };
    }
    // NOTE: no finally { page.close() } — we close the entire context below,
    // which is guaranteed not to hang.
  })();

  // Race: whichever finishes first wins.
  const result = await Promise.race([checkPromise, hardTimeoutPromise]);

  // Clean up: cancel the timer, destroy the context (idempotent).
  clearTimeout(hardTimer);
  try { await context.close(); } catch {}

  return result;
}

function structuralChecks(brands) {
  const issues = [];
  for (const [name, entry] of Object.entries(brands)) {
    if (!entry.url.startsWith("https://")) {
      issues.push({ brand: name, issue: `Homepage is not HTTPS: ${entry.url}` });
    }
    if (entry.searchTemplate) {
      if (!entry.searchTemplate.includes("{query}")) {
        issues.push({ brand: name, issue: `Search template missing {query}: ${entry.searchTemplate}` });
      }
      try {
        const homeHost = new URL(entry.url).hostname.replace(/^www\./, "");
        const searchHost = new URL(entry.searchTemplate.replace("{query}", "test")).hostname.replace(/^www\./, "");
        if (homeHost !== searchHost) {
          issues.push({ brand: name, issue: `Domain mismatch: homepage=${homeHost}, search=${searchHost}` });
        }
      } catch (e) {
        issues.push({ brand: name, issue: `Invalid URL: ${e.message}` });
      }
    }
    if (name !== name.toLowerCase()) {
      issues.push({ brand: name, issue: `Brand key is not lowercase` });
    }
  }
  return issues;
}

async function main() {
  const args = process.argv.slice(2);
  const homepageOnly   = args.includes("--homepage-only");
  const templateOnly   = args.includes("--template-only");
  const headed         = args.includes("--headed");
  const saveScreenshot = args.includes("--screenshot");
  const filterBrands   = args.filter((a) => !a.startsWith("--"));

  console.log("🌐 NoPrime Brand URL Validator (Browser Mode)\n");
  console.log("   Engine: Playwright + Chromium (real browser, bypasses WAFs)\n");

  // Parse
  const brands = parseBrandsFile(BRANDS_FILE);
  const brandCount = Object.keys(brands).length;
  console.log(`   Parsed ${brandCount} brands from brands.js\n`);

  // Structural checks
  console.log("-- Structural Checks --\n");
  const structural = structuralChecks(brands);
  if (structural.length === 0) {
    console.log("   ✅ All structural checks passed\n");
  } else {
    for (const s of structural) {
      console.log(`   ⚠️  ${s.brand}: ${s.issue}`);
    }
    console.log();
  }

  // Build task list
  let entries = Object.entries(brands);
  if (filterBrands.length > 0) {
    entries = entries.filter(([name]) =>
      filterBrands.some((f) => name.includes(f.toLowerCase()))
    );
    console.log(`   Filtered to ${entries.length} brand(s): ${entries.map(([n]) => n).join(", ")}\n`);
  }

  const tasks = [];
  for (const [name, entry] of entries) {
    if (!templateOnly) {
      tasks.push({ brand: name, type: "homepage", url: entry.url });
    }
    if (!homepageOnly && entry.searchTemplate) {
      const testUrl = entry.searchTemplate.replace("{query}", encodeURIComponent(TEST_QUERY));
      tasks.push({ brand: name, type: "search", url: testUrl });
    }
  }

  console.log("-- URL Reachability (Browser) --\n");
  console.log(`   Running ${tasks.length} checks (concurrency=${CONCURRENCY}, hard-timeout=${HARD_TIMEOUT_MS / 1000}s)...\n`);

  // Launch a single browser; each checkUrl creates its own context.
  const browser = await chromium.launch({
    headless: !headed,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
    ],
  });

  // Process tasks in batches
  const results = [];
  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    const batch = tasks.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((task) =>
        checkUrl(browser, task.url, {
          saveScreenshot,
          brand: task.brand,
          type: task.type,
        }).then((result) => ({ ...task, ...result }))
      )
    );

    results.push(...batchResults);

    // Progress indicator
    const done = Math.min(i + CONCURRENCY, tasks.length);
    const pct = Math.round((done / tasks.length) * 100);
    process.stdout.write(`   Progress: ${done}/${tasks.length} (${pct}%)${done < tasks.length ? "\r" : "\n"}`);

    if (i + CONCURRENCY < tasks.length) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_MS));
    }
  }

  try { await browser.close(); } catch { /* already closed */ }
  console.log();

  // Classify results
  const passed = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  // Print failures
  if (failed.length > 0) {
    console.log("-- ❌ FAILURES --\n");
    for (const f of failed) {
      const reason = f.soft404
        ? `HTTP ${f.status} (soft 404 — page says "not found")`
        : f.error || `HTTP ${f.status}`;
      const icon = f.type === "homepage" ? "🏠" : "🔍";
      console.log(`   ${icon} ${f.brand} (${f.type}): ${reason}`);
      console.log(`      ${f.url}\n`);
    }
  }

  // Summary
  console.log("-- Summary --\n");
  console.log(`   Total checks:  ${results.length}`);
  console.log(`   ✅ Passed:     ${passed.length}`);
  console.log(`   ❌ Failed:     ${failed.length}`);
  console.log(`   🔧 Structural: ${structural.length}`);
  if (saveScreenshot && failed.length > 0) {
    console.log(`   📸 Screenshots: ${SCREENSHOT_DIR}`);
  }
  console.log();

  if (failed.length > 0 || structural.length > 0) {
    console.log("   Some checks failed. Review the URLs above and update brands.js.\n");
    process.exit(1);
  } else {
    console.log("   All checks passed! 🎉\n");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(2);
});
