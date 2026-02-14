/**
 * Amazon product page metadata extractor.
 *
 * Scrapes brand name and product title from the Amazon product
 * page DOM.  Amazon's markup varies by locale and product category
 * so we try multiple selectors for each field.
 */

// Global namespace for cross-file communication
window.NoPrime = window.NoPrime || {};

/**
 * Try a list of CSS selectors and return the first non-empty text match.
 */
function firstText(...selectors) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.textContent.trim();
      if (text) return text;
    }
  }
  return null;
}

/**
 * Extract the brand / manufacturer name.
 *
 * Amazon displays brand info in several different places depending on
 * the product category:
 *   - A "bylineInfo" link (most common)
 *   - A detail table row labelled "Brand"
 *   - The "brand" structured data in JSON-LD
 */
function extractBrand() {
  // 1. Byline link ("Visit the <Brand> Store" or "Brand: <Brand>")
  const byline = document.querySelector("#bylineInfo");
  if (byline) {
    let text = byline.textContent.trim();
    // Strip common prefixes
    text = text
      .replace(/^Visit the\s+/i, "")
      .replace(/\s+Store$/i, "")
      .replace(/^Brand:\s*/i, "");
    if (text) return text;
  }

  // 2. Product details / tech-specs table
  const brand = extractDetailField("Brand", "brand", "Manufacturer");
  if (brand) return brand;

  // 3. JSON-LD structured data
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      const data = JSON.parse(script.textContent);
      const brandObj = data.brand || (data["@graph"] && data["@graph"].find(n => n.brand));
      if (brandObj) {
        const name = typeof brandObj === "string" ? brandObj : (brandObj.brand?.name || brandObj.name);
        if (name) return name;
      }
    }
  } catch { /* ignore parse errors */ }

  return null;
}

/**
 * Extract the product title.
 */
function extractTitle() {
  return firstText("#productTitle", "#title span", 'h1[data-feature-name="title"] span');
}

/**
 * Look up a value from the product-details / technical-specifications table.
 * Amazon renders these in several different table formats.
 */
function extractDetailField(...labels) {
  // Format 1: <table id="productDetails_techSpec_section_1"> or similar
  const tables = document.querySelectorAll(
    "#productDetails_techSpec_section_1, #productDetails_detailBullets_sections1, .prodDetTable"
  );
  for (const table of tables) {
    for (const row of table.querySelectorAll("tr")) {
      const th = row.querySelector("th");
      const td = row.querySelector("td");
      if (th && td) {
        const label = th.textContent.trim().toLowerCase();
        if (labels.some(l => label.includes(l.toLowerCase()))) {
          return td.textContent.trim();
        }
      }
    }
  }

  // Format 2: detail bullets (<ul> with <span class="a-text-bold"> labels)
  const bullets = document.querySelectorAll("#detailBullets_feature_div li, #detailBulletsWrapper_feature_div li");
  for (const li of bullets) {
    const bold = li.querySelector(".a-text-bold");
    if (bold) {
      const label = bold.textContent.trim().toLowerCase().replace(/[:\s]+$/g, "");
      if (labels.some(l => label.includes(l.toLowerCase()))) {
        // The value is the next text node or sibling span
        const full = li.textContent.replace(bold.textContent, "").trim();
        // Remove leading separators
        return full.replace(/^[\s:‏‎]+/, "").trim();
      }
    }
  }

  return null;
}

/**
 * Detect whether the current product is a book.
 *
 * Checks several signals:
 *   - The breadcrumb / category contains "Books"
 *   - An ISBN-13 or ISBN-10 is present in the detail tables
 *   - The page has a #bookDescription or #rpiContainer element
 *   - The URL contains /dp/ with a 10-digit ISBN-10
 */
function detectBook() {
  // 1. Breadcrumb / category node
  const breadcrumb = document.querySelector("#wayfinding-breadcrumbs_container, .a-breadcrumb");
  if (breadcrumb && /\bbooks\b/i.test(breadcrumb.textContent)) return true;

  // 2. Book-specific DOM landmarks
  if (document.querySelector("#bookDescription, #rpiContainer, #bookEditionBadge, #tmmSwatches")) return true;

  // 3. Detail table contains ISBN
  const isbn = extractDetailField("ISBN-13", "ISBN-10", "ISBN");
  if (isbn) return true;

  // 4. Media format switcher mentions Kindle / Paperback / Hardcover
  const formats = document.querySelector("#tmmSwatches, #mediaTab_heading");
  if (formats && /\b(kindle|paperback|hardcover|audiobook|mass market)\b/i.test(formats.textContent)) return true;

  return false;
}

/**
 * Extract the ISBN-13 (preferred) or ISBN-10 from the product details.
 */
function extractISBN() {
  const isbn13 = extractDetailField("ISBN-13");
  if (isbn13) return isbn13.replace(/[^0-9X]/gi, "");

  const isbn10 = extractDetailField("ISBN-10");
  if (isbn10) return isbn10.replace(/[^0-9X]/gi, "");

  // Try to pull a 13-digit ISBN from the page URL or ASIN
  // (Amazon ASINs for books are often the ISBN-10)
  const asinMatch = location.pathname.match(/\/(?:dp|gp\/product)\/([0-9]{10})/);
  if (asinMatch) return asinMatch[1];

  return null;
}

/**
 * Scrape all useful metadata from the current Amazon product page.
 *
 * @returns {{ brand: string|null, title: string|null, url: string, isBook: boolean, isbn: string|null }}
 */
window.NoPrime.extractProductInfo = function extractProductInfo() {
  const isBook = detectBook();
  return {
    brand: extractBrand(),
    title: extractTitle(),
    url:   location.href,
    isBook,
    isbn:  isBook ? extractISBN() : null,
  };
};
