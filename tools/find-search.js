#!/usr/bin/env node
/**
 * Search-URL discovery tool for NoPrime brands.
 *
 * Given a brand homepage, uses Playwright to discover the site's search
 * functionality and infer a searchTemplate URL with a {query} placeholder.
 *
 * Strategies (tried in order):
 *   1. Find <form> with action containing "search" or role="search"
 *   2. Find <input> or <a> with search-related attributes
 *   3. Click a search icon / magnifying-glass button and observe navigation
 *   4. Look at /search, /search?q=, /catalogsearch/result/ paths
 *   5. Check OpenSearch description link in <head>
 *
 * Usage:
 *   node find-search.js                            # all brands missing templates
 *   node find-search.js nike adidas sony           # specific brands
 *   node find-search.js --all                      # all brands (including ones with templates)
 *   node find-search.js --headed                   # show the browser window
 *   node find-search.js --json                     # output JSON for scripting
 *   node find-search.js --apply                    # update generate-brands.js in place
 *   node find-search.js --concurrency 5            # parallel tabs (default: 3)
 *
 * Requires: npx playwright install chromium
 */

const fs = require("fs");
const path = require("path");

const { chromium } = require("playwright-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
chromium.use(StealthPlugin());

process.on("unhandledRejection", (err) => {
  if (/target.*(closed|destroyed)|context/i.test(String(err))) return;
  console.error("Unhandled rejection:", err);
  process.exit(2);
});

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const TIMEOUT_MS       = 15_000;
const HARD_TIMEOUT_MS  = 25_000;
const DELAY_BETWEEN_MS = 800;
const PROBE_QUERY      = "test";
const BRANDS_FILE      = path.resolve(__dirname, "../extension/src/brands.js");
const GENERATOR_FILE   = path.resolve(__dirname, "../generate-brands.js");

// ---------------------------------------------------------------------------
// Parse brands.js to get { name → { url, searchTemplate } }
// ---------------------------------------------------------------------------
function parseBrandsFile(filePath) {
  const source = fs.readFileSync(filePath, "utf-8");
  const brands = {};
  const entryRe = /"([^"]+)":\s*\{\s*url:\s*"([^"]+)"(?:,\s*searchTemplate:\s*(?:"([^"]+)"|null))?\s*\}/g;

  let match;
  while ((match = entryRe.exec(source)) !== null) {
    const [, name, url, searchTemplate] = match;
    brands[name] = { url, searchTemplate: searchTemplate || null };
  }

  return brands;
}

// ---------------------------------------------------------------------------
// Strategy helpers
// ---------------------------------------------------------------------------

/** Normalise a discovered search URL into a template with {query}. */
function toTemplate(url, query) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const templateParts = [];

    // Replace the probe query in various URL components
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "gi");
    const encodedQuery = encodeURIComponent(query);
    const encodedRe = new RegExp(encodedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");

    let str = u.toString();
    str = str.replace(encodedRe, "{query}");
    str = str.replace(re, "{query}");

    if (!str.includes("{query}")) return null;

    // Clean up: remove trailing hash fragments if empty
    str = str.replace(/#$/, "");

    return str;
  } catch {
    return null;
  }
}

/** Check if a URL looks like a search results page. */
function isSearchUrl(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return /[?&/](search|q=|query=|keyword=|searchterm=|text=|freetext=|ntrm=|ntt=|searchkey|searchtxt|searchtext)/i.test(lower)
    || /\/(search|catalogsearch|find|results)\b/i.test(lower);
}

// ---------------------------------------------------------------------------
// Main discovery function – runs inside an isolated BrowserContext
// ---------------------------------------------------------------------------
async function discoverSearch(browser, brandName, homeUrl, { headed = false } = {}) {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    locale: "en-US",
    viewport: { width: 1280, height: 720 },
  });

  let hardTimer;
  const hardTimeoutPromise = new Promise((resolve) => {
    hardTimer = setTimeout(() => {
      context.close().catch(() => {});
      resolve({ template: null, method: "TIMEOUT", error: "Hard timeout" });
    }, HARD_TIMEOUT_MS);
  });

  const discoverPromise = (async () => {
    const page = await context.newPage();

    // Track navigations triggered by search actions
    let lastNavUrl = null;
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        lastNavUrl = frame.url();
      }
    });

    try {
      // ---------- Load homepage ----------
      await page.goto(homeUrl, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
      await page.waitForTimeout(1500); // let JS hydrate

      // ---------- Strategy 1: OpenSearch discovery ----------
      const openSearchUrl = await page.evaluate(() => {
        const link = document.querySelector(
          'link[type="application/opensearchdescription+xml"]'
        );
        return link ? link.getAttribute("href") : null;
      });
      // We note it but don't rely on it alone — continue to other strategies

      // ---------- Strategy 2: Find search forms ----------
      const formResult = await page.evaluate(() => {
        // Look for forms with search-related attributes
        const forms = Array.from(document.querySelectorAll('form'));
        for (const form of forms) {
          const action = (form.getAttribute("action") || "").toLowerCase();
          const role = (form.getAttribute("role") || "").toLowerCase();
          const id = (form.getAttribute("id") || "").toLowerCase();
          const cls = (form.getAttribute("class") || "").toLowerCase();

          const isSearch =
            role === "search" ||
            action.includes("search") ||
            action.includes("catalogsearch") ||
            action.includes("find") ||
            id.includes("search") ||
            cls.includes("search");

          if (isSearch) {
            // Find the text input in this form
            const input = form.querySelector(
              'input[type="search"], input[type="text"], input[name="q"], input[name="query"], input[name="keyword"], input[name="searchTerm"], input[name="text"], input[name="freeText"], input[name="Ntrm"], input[name="Ntt"], input[name="searchKey"]'
            );
            if (input) {
              return {
                action: form.action || form.getAttribute("action"),
                method: (form.method || "GET").toUpperCase(),
                inputName: input.name || input.getAttribute("name") || "q",
              };
            }

            // Even without identifiable input, grab the first text-like input
            const anyInput = form.querySelector('input[type="search"], input[type="text"], input:not([type])');
            if (anyInput) {
              return {
                action: form.action || form.getAttribute("action"),
                method: (form.method || "GET").toUpperCase(),
                inputName: anyInput.name || anyInput.getAttribute("name") || "q",
              };
            }
          }
        }
        return null;
      });

      if (formResult && formResult.action) {
        try {
          const actionUrl = new URL(formResult.action, homeUrl);
          if (formResult.method === "GET") {
            actionUrl.searchParams.set(formResult.inputName, "__QUERY__");
            const tmplUrl = actionUrl.toString().replace("__QUERY__", "{query}");
            return { template: tmplUrl, method: "form-action" };
          } else {
            // POST form – try navigating with a GET anyway (many sites support it)
            actionUrl.searchParams.set(formResult.inputName, PROBE_QUERY);
            await page.goto(actionUrl.toString(), { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
            const finalUrl = page.url();
            const tmpl = toTemplate(finalUrl, PROBE_QUERY);
            if (tmpl) return { template: tmpl, method: "form-post-to-get" };
          }
        } catch { /* try next strategy */ }
      }

      // ---------- Strategy 3: Click search icon / button ----------
      const searchTrigger = await page.evaluate(() => {
        // Common selectors for search triggers
        const selectors = [
          '[aria-label*="search" i]',
          '[aria-label*="Search" i]',
          '[title*="search" i]',
          '[data-testid*="search" i]',
          '[class*="search-icon" i]',
          '[class*="searchIcon" i]',
          '[class*="search-toggle" i]',
          '[class*="search-trigger" i]',
          '[class*="search-btn" i]',
          'button.search',
          'a.search',
          '[id*="search-icon" i]',
          '[id*="searchToggle" i]',
          // SVG magnifying glass (common icon)
          'a[href*="/search"]',
        ];

        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.offsetParent !== null) {
            return sel;
          }
        }
        return null;
      });

      if (searchTrigger) {
        try {
          await page.click(searchTrigger, { timeout: 3000 });
          await page.waitForTimeout(1000);

          // After clicking, look for a search input that appeared
          const inputSel =
            'input[type="search"]:visible, input[name="q"]:visible, input[name="query"]:visible, ' +
            'input[name="keyword"]:visible, input[placeholder*="search" i]:visible, ' +
            'input[aria-label*="search" i]:visible';

          const hasInput = await page.locator(inputSel).first().isVisible().catch(() => false);

          if (hasInput) {
            await page.locator(inputSel).first().fill(PROBE_QUERY);
            await page.keyboard.press("Enter");
            await page.waitForLoadState("domcontentloaded", { timeout: TIMEOUT_MS }).catch(() => {});
            await page.waitForTimeout(1500);

            const finalUrl = page.url();
            if (isSearchUrl(finalUrl)) {
              const tmpl = toTemplate(finalUrl, PROBE_QUERY);
              if (tmpl) return { template: tmpl, method: "click-and-type" };
            }
          } else {
            // Maybe clicking navigated directly to /search
            const navUrl = page.url();
            if (isSearchUrl(navUrl) && navUrl !== homeUrl) {
              // Try appending a query param
              const u = new URL(navUrl);
              u.searchParams.set("q", "__QUERY__");
              return { template: u.toString().replace("__QUERY__", "{query}"), method: "search-link" };
            }
          }
        } catch { /* try next strategy */ }
      }

      // ---------- Strategy 4: Probe common search paths ----------
      const homeOrigin = new URL(homeUrl).origin;
      const probePaths = [
        `/search?q=${PROBE_QUERY}`,
        `/search?query=${PROBE_QUERY}`,
        `/search?keyword=${PROBE_QUERY}`,
        `/search?searchTerm=${PROBE_QUERY}`,
        `/search?text=${PROBE_QUERY}`,
        `/search/${PROBE_QUERY}`,
        `/catalogsearch/result/?q=${PROBE_QUERY}`,
        `/pages/search-results?q=${PROBE_QUERY}`,
      ];

      for (const probePath of probePaths) {
        try {
          const probeUrl = homeOrigin + probePath;
          const resp = await page.goto(probeUrl, { waitUntil: "domcontentloaded", timeout: 8000 });
          const status = resp?.status();

          if (status && status >= 200 && status < 400) {
            // Check it's not a 404 page
            const title = await page.title().catch(() => "");
            const isSoft404 = /page not found|404|not found/i.test(title)
              && !/search|results/i.test(title);

            if (!isSoft404) {
              const finalUrl = page.url();
              const tmpl = toTemplate(finalUrl, PROBE_QUERY);
              if (tmpl) return { template: tmpl, method: "path-probe" };
            }
          }
        } catch {
          continue;
        }
      }

      // ---------- Strategy 5: Scan for search links in page ----------
      // Reload homepage for link scanning (we may have navigated away)
      try {
        await page.goto(homeUrl, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
        await page.waitForTimeout(1000);
      } catch { /* ignore */ }

      const searchLink = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("a[href]"));
        for (const a of links) {
          const href = a.getAttribute("href") || "";
          if (/\/search(\?|$|\/)/i.test(href) && !/blog|help|support|faq/i.test(href)) {
            return href;
          }
        }
        return null;
      });

      if (searchLink) {
        try {
          const searchPageUrl = new URL(searchLink, homeUrl);
          // Navigate there and try typing
          await page.goto(searchPageUrl.toString(), { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
          await page.waitForTimeout(1000);

          // Try the search input
          const inputSel2 =
            'input[type="search"], input[name="q"], input[name="query"], ' +
            'input[name="keyword"], input[placeholder*="search" i]';

          const hasInput2 = await page.locator(inputSel2).first().isVisible().catch(() => false);

          if (hasInput2) {
            await page.locator(inputSel2).first().fill(PROBE_QUERY);
            await page.keyboard.press("Enter");
            await page.waitForLoadState("domcontentloaded", { timeout: TIMEOUT_MS }).catch(() => {});
            await page.waitForTimeout(1500);

            const finalUrl2 = page.url();
            const tmpl2 = toTemplate(finalUrl2, PROBE_QUERY);
            if (tmpl2) return { template: tmpl2, method: "search-page-type" };
          }

          // Otherwise just guess q= param on the search path
          searchPageUrl.searchParams.set("q", "__QUERY__");
          return { template: searchPageUrl.toString().replace("__QUERY__", "{query}"), method: "search-link-guess" };
        } catch { /* fall through */ }
      }

      return { template: null, method: "not-found", error: "No search discovered" };
    } catch (err) {
      if (/target closed|has been closed/i.test(err.message)) {
        return { template: null, method: "TIMEOUT", error: "Context destroyed" };
      }
      return { template: null, method: "error", error: err.message?.slice(0, 120) };
    }
  })();

  const result = await Promise.race([discoverPromise, hardTimeoutPromise]);
  clearTimeout(hardTimer);
  try { await context.close(); } catch {}

  return result;
}

// ---------------------------------------------------------------------------
// Apply discovered templates back to generate-brands.js
// ---------------------------------------------------------------------------
function applyToGenerator(results) {
  let source = fs.readFileSync(GENERATOR_FILE, "utf-8");
  let applied = 0;

  for (const { brand, template } of results) {
    if (!template) continue;

    // Match the brand entry: { n: "brand", u: "...", s: null
    // and replace s: null with s: "template"
    const escapedBrand = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `(\\{\\s*n:\\s*"${escapedBrand}"\\s*,\\s*u:\\s*"[^"]*"\\s*,\\s*s:\\s*)null`,
      "g"
    );

    const escapedTemplate = template.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const newSource = source.replace(re, `$1"${escapedTemplate}"`);

    if (newSource !== source) {
      source = newSource;
      applied++;
    }
  }

  if (applied > 0) {
    fs.writeFileSync(GENERATOR_FILE, source, "utf-8");
  }

  return applied;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const headed      = args.includes("--headed");
  const jsonOutput  = args.includes("--json");
  const applyMode   = args.includes("--apply");
  const all         = args.includes("--all");

  // Parse --concurrency N
  let concurrency = 3;
  const concIdx = args.indexOf("--concurrency");
  if (concIdx !== -1 && args[concIdx + 1]) {
    concurrency = parseInt(args[concIdx + 1], 10) || 3;
  }

  const filterBrands = args.filter((a) => !a.startsWith("--") && !(concIdx !== -1 && args[concIdx + 1] === a));

  if (!jsonOutput) {
    console.log("🔍 NoPrime Search-URL Discovery Tool\n");
  }

  const brands = parseBrandsFile(BRANDS_FILE);
  let entries = Object.entries(brands);

  // Filter
  if (filterBrands.length > 0) {
    entries = entries.filter(([name]) =>
      filterBrands.some((f) => name.includes(f.toLowerCase()))
    );
  } else if (!all) {
    // Default: only brands missing searchTemplate
    entries = entries.filter(([, entry]) => !entry.searchTemplate);
  }

  if (!jsonOutput) {
    console.log(`   ${entries.length} brand(s) to check (concurrency=${concurrency})\n`);
  }

  const browser = await chromium.launch({
    headless: !headed,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  const results = [];

  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async ([name, entry]) => {
        const result = await discoverSearch(browser, name, entry.url, { headed });
        return { brand: name, url: entry.url, ...result };
      })
    );

    results.push(...batchResults);

    if (!jsonOutput) {
      for (const r of batchResults) {
        const icon = r.template ? "✅" : "❌";
        const detail = r.template
          ? `${r.method} → ${r.template}`
          : `${r.method}: ${r.error || "no search found"}`;
        console.log(`   ${icon} ${r.brand}: ${detail}`);
      }

      const done = Math.min(i + concurrency, entries.length);
      const pct = Math.round((done / entries.length) * 100);
      console.log(`   --- ${done}/${entries.length} (${pct}%) ---\n`);
    }

    if (i + concurrency < entries.length) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_MS));
    }
  }

  try { await browser.close(); } catch {}

  // ---------------------------------------------------------------------------
  // Output
  // ---------------------------------------------------------------------------
  const found = results.filter((r) => r.template);
  const notFound = results.filter((r) => !r.template);

  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log("── Summary ──\n");
    console.log(`   Checked:    ${results.length}`);
    console.log(`   ✅ Found:   ${found.length}`);
    console.log(`   ❌ Missing: ${notFound.length}`);

    if (found.length > 0) {
      console.log("\n── Discovered Templates ──\n");
      for (const r of found) {
        console.log(`   "${r.brand}": "${r.template}"  (${r.method})`);
      }
    }

    if (applyMode && found.length > 0) {
      console.log("\n── Applying to generate-brands.js ──\n");
      const applied = applyToGenerator(found);
      console.log(`   Updated ${applied} entries in generate-brands.js`);
      if (applied > 0) {
        console.log("   Run 'node generate-brands.js' to regenerate brands.js\n");
      }
    } else if (found.length > 0 && !applyMode) {
      console.log("\n   💡 Run with --apply to update generate-brands.js automatically\n");
    }
  }

  process.exit(notFound.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(2);
});
