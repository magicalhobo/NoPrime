/**
 * Brand-to-store mapping.
 *
 * We use a three-tier resolution strategy:
 *
 *   1. **Exact match** – the brand name extracted from the Amazon page is
 *      looked up (case-insensitively) in BRAND_STORE_MAP below. If found we
 *      know the store URL and can build a deep product search link.
 *
 *   2. **Fuzzy / alias match** – BRAND_ALIASES maps common variations,
 *      abbreviations, and sub-brands back to a canonical key in
 *      BRAND_STORE_MAP.
 *
 *   3. **Web-search fallback** – if no mapping exists we construct a DuckDuckGo
 *      search like:
 *        `"<brand>" <product title> -amazon`
 *
 * Each entry can optionally include a `searchTemplate` – a URL template with
 * `{query}` that we fill with the product title to deep-link into the brand's
 * own search results page.
*/

// Global namespace for cross-file communication
window.NoPrime = window.NoPrime || {};

// Add entries alphabetically.
const BRAND_STORE_MAP = {
  // A
  "adidas": { url: "https://www.adidas.com", searchTemplate: "https://www.adidas.com/us/search?q={query}" },
  "allbirds": { url: "https://www.allbirds.com", searchTemplate: "https://www.allbirds.com/search?q={query}" },
  "anker": { url: "https://www.anker.com", searchTemplate: "https://www.anker.com/search?q={query}" },
  "apple": { url: "https://www.apple.com", searchTemplate: "https://www.apple.com/shop/search/{query}" },
  "asics": { url: "https://www.asics.com", searchTemplate: "https://www.asics.com/us/en-us/search?q={query}" },
  "asus": { url: "https://www.asus.com", searchTemplate: "https://www.asus.com/us/searchall/?searchKey={query}" },

  // B
  "bmw": { url: "https://www.bmw.com", searchTemplate: null },
  "beats": { url: "https://www.beatsbydre.com", searchTemplate: null },
  "birkenstock": { url: "https://www.birkenstock.com", searchTemplate: "https://www.birkenstock.com/us/search?q={query}" },
  "black+decker": { url: "https://www.blackanddecker.com", searchTemplate: "https://www.blackanddecker.com/search?query={query}" },
  "bombas": { url: "https://bombas.com", searchTemplate: "https://bombas.com/search?q={query}" },
  "bose": { url: "https://www.bose.com", searchTemplate: "https://www.bose.com/search?q={query}" },
  "brooks": { url: "https://www.brooksrunning.com", searchTemplate: "https://www.brooksrunning.com/en_us/search-result?q={query}" },
  "brother": { url: "https://www.brother-usa.com", searchTemplate: "https://www.brother-usa.com/search#q={query}" },

  // C
  "canon": { url: "https://www.usa.canon.com", searchTemplate: "https://www.usa.canon.com/search?q={query}" },
  "carhartt": { url: "https://www.carhartt.com", searchTemplate: "https://www.carhartt.com/search?q={query}" },
  "casper": { url: "https://casper.com", searchTemplate: "https://casper.com/search/?q={query}" },
  "champion": { url: "https://www.champion.com", searchTemplate: "https://www.champion.com/search?q={query}" },
  "chacos": { url: "https://www.chacos.com", searchTemplate: "https://www.chacos.com/US/en/search?q={query}" },
  "cole haan": { url: "https://www.colehaan.com", searchTemplate: "https://www.colehaan.com/search?q={query}" },
  "columbia": { url: "https://www.columbia.com", searchTemplate: "https://www.columbia.com/search?q={query}" },
  "corsair": { url: "https://www.corsair.com", searchTemplate: "https://www.corsair.com/us/en/search?query={query}" },
  "crocs": { url: "https://www.crocs.com", searchTemplate: "https://www.crocs.com/search?q={query}" },

  // D
  "dell": { url: "https://www.dell.com", searchTemplate: "https://www.dell.com/en-us/search/{query}" },
  "dewalt": { url: "https://www.dewalt.com", searchTemplate: "https://www.dewalt.com/search?query={query}" },
  "dickies": { url: "https://www.dickies.com", searchTemplate: "https://www.dickies.com/search?q={query}" },
  "dkny": { url: "https://www.dkny.com", searchTemplate: "https://www.dkny.com/search?q={query}" },
  "dr. martens": { url: "https://www.drmartens.com", searchTemplate: "https://www.drmartens.com/us/en/search?q={query}" },
  "dyson": { url: "https://www.dyson.com", searchTemplate: "https://www.dyson.com/search?q={query}" },

  // E
  "epson": { url: "https://epson.com", searchTemplate: "https://epson.com/search/?text={query}" },

  // F
  "filson": { url: "https://www.filson.com", searchTemplate: "https://www.filson.com/catalogsearch/result/?q={query}" },
  "fjallraven": { url: "https://www.fjallraven.com", searchTemplate: "https://www.fjallraven.com/us/en-us/search?q={query}" },
  "fujifilm": { url: "https://www.fujifilm.com", searchTemplate: "https://www.fujifilm.com/us/en/search?q={query}" },

  // G
  "gap": { url: "https://www.gap.com", searchTemplate: "https://www.gap.com/browse/search.do?searchText={query}" },
  "garmin": { url: "https://www.garmin.com", searchTemplate: "https://www.garmin.com/en-US/search/?query={query}" },
  "gibson": { url: "https://www.gibson.com", searchTemplate: "https://www.gibson.com/search?q={query}" },
  "gopro": { url: "https://gopro.com", searchTemplate: null },
  "gregory": { url: "https://www.gregorypacks.com", searchTemplate: "https://www.gregorypacks.com/search?q={query}" },

  // H
  "hanes": { url: "https://www.hanes.com", searchTemplate: "https://www.hanes.com/search?q={query}" },
  "hp": { url: "https://www.hp.com", searchTemplate: "https://www.hp.com/us-en/shop/sitesearch?keyword={query}" },
  "hydro flask": { url: "https://www.hydroflask.com", searchTemplate: "https://www.hydroflask.com/catalogsearch/result/?q={query}" },
  "hoka": { url: "https://www.hoka.com", searchTemplate: "https://www.hoka.com/en/us/search?q={query}" },

  // I
  "ikea": { url: "https://www.ikea.com", searchTemplate: "https://www.ikea.com/us/en/search/?q={query}" },
  "instant pot": { url: "https://instantpot.com", searchTemplate: "https://instantpot.com/search?q={query}&type=product" },

  // J
  "jabra": { url: "https://www.jabra.com", searchTemplate: "https://www.jabra.com/search#{query}" },
  "jbl": { url: "https://www.jbl.com", searchTemplate: "https://www.jbl.com/search?q={query}" },

  // K
  "keen": { url: "https://www.keenfootwear.com", searchTemplate: "https://www.keenfootwear.com/search/?q={query}" },
  "kitchenaid": { url: "https://www.kitchenaid.com", searchTemplate: null },

  // L
  "la sportiva": { url: "https://www.lasportiva.com", searchTemplate: "https://www.lasportiva.com/en/catalogsearch/result/?q={query}" },
  "le creuset": { url: "https://www.lecreuset.com", searchTemplate: "https://www.lecreuset.com/search?q={query}" },
  "lego": { url: "https://www.lego.com", searchTemplate: "https://www.lego.com/en-us/search?q={query}" },
  "lenny & larry's": { url: "https://www.lennylarry.com", searchTemplate: "https://www.lennylarry.com/search?q={query}" },
  "lenovo": { url: "https://www.lenovo.com", searchTemplate: "https://www.lenovo.com/us/en/search?fq=&text={query}/" },
  "levi's": { url: "https://www.levi.com", searchTemplate: "https://www.levi.com/US/en_US/search/{query}" },
  "lg": { url: "https://www.lg.com", searchTemplate: "https://www.lg.com/us/search/search-all?search={query}" },
  "lodge": { url: "https://www.lodgecastiron.com", searchTemplate: "https://www.lodgecastiron.com/search?q={query}" },
  "logitech": { url: "https://www.logitech.com", searchTemplate: "https://www.logitech.com/en-us/search?query={query}" },

  // M
  "merrell": { url: "https://www.merrell.com", searchTemplate: "https://www.merrell.com/US/en/search?q={query}" },
  "milwaukee": { url: "https://www.milwaukeetool.com", searchTemplate: "https://www.milwaukeetool.com/Search?query={query}" },

  // N
  "new balance": { url: "https://www.newbalance.com", searchTemplate: "https://www.newbalance.com/search/?q={query}" },
  "nike": { url: "https://www.nike.com", searchTemplate: "https://www.nike.com/w?q={query}" },
  "ninja": { url: "https://www.ninjakitchen.com", searchTemplate: "https://www.ninjakitchen.com/search?q={query}" },
  "nintendo": { url: "https://www.nintendo.com", searchTemplate: "https://www.nintendo.com/us/search/#q={query}" },

  // O
  "osprey": { url: "https://www.osprey.com", searchTemplate: "https://www.osprey.com/catalogsearch/result/?q={query}" },
  "oxo": { url: "https://www.oxo.com", searchTemplate: "https://www.oxo.com/catalogsearch/result/?q={query}" },

  // P
  "patagonia": { url: "https://www.patagonia.com", searchTemplate: "https://www.patagonia.com/search/?q={query}" },
  "philips": { url: "https://www.usa.philips.com", searchTemplate: "https://www.usa.philips.com/c-w/search.html#q={query}" },
  "puma": { url: "https://us.puma.com", searchTemplate: "https://us.puma.com/us/en/search?q={query}" },

  // R
  "razor": { url: "https://www.razer.com", searchTemplate: "https://www.razer.com/search/{query}" },
  "reebok": { url: "https://www.reebok.com", searchTemplate: "https://www.reebok.com/search?q={query}" },
  "rei": { url: "https://www.rei.com", searchTemplate: "https://www.rei.com/search?q={query}" },

  // S
  "samsung": { url: "https://www.samsung.com", searchTemplate: "https://www.samsung.com/us/search/searchMain?searchTerm={query}" },
  "saucony": { url: "https://www.saucony.com", searchTemplate: "https://www.saucony.com/en/search?q={query}" },
  "sennheiser": { url: "https://www.sennheiser.com", searchTemplate: null },
  "shark": { url: "https://www.sharkclean.com", searchTemplate: "https://www.sharkclean.com/search?q={query}" },
  "skullcandy": { url: "https://www.skullcandy.com", searchTemplate: "https://www.skullcandy.com/search?q={query}" },
  "sony": { url: "https://www.sony.com", searchTemplate: "https://www.sony.com/en/search?q={query}" },
  "stanley": { url: "https://www.stanley1913.com", searchTemplate: "https://www.stanley1913.com/search?q={query}" },

  // T
  "the north face": { url: "https://www.thenorthface.com", searchTemplate: "https://www.thenorthface.com/en-us/search?q={query}" },
  "timberland": { url: "https://www.timberland.com", searchTemplate: "https://www.timberland.com/search?q={query}" },

  // U
  "under armour": { url: "https://www.underarmour.com", searchTemplate: "https://www.underarmour.com/en-us/search?q={query}" },
  "ugg": { url: "https://www.ugg.com", searchTemplate: "https://www.ugg.com/search?q={query}" },

  // V
  "vans": { url: "https://www.vans.com", searchTemplate: "https://www.vans.com/search?q={query}" },
  "vitamix": { url: "https://www.vitamix.com", searchTemplate: "https://www.vitamix.com/search?q={query}" },

  // W
  "wrangler": { url: "https://www.wrangler.com", searchTemplate: "https://www.wrangler.com/search?q={query}" },

  // Y
  "yeti": { url: "https://www.yeti.com", searchTemplate: "https://www.yeti.com/search?q={query}" },

  // Z
  "zwilling": { url: "https://www.zwilling.com", searchTemplate: "https://www.zwilling.com/us/search?q={query}" },
};

// Maps alternative names to canonical key in BRAND_STORE_MAP.
const BRAND_ALIASES = {
  "adidas originals": "adidas",
  "adidas performance": "adidas",
  "beats by dr. dre": "beats",
  "beats by dre": "beats",
  "black & decker": "black+decker",
  "black and decker": "black+decker",
  "bose corporation": "bose",
  "canon u.s.a.": "canon",
  "champion usa": "champion",
  "cole haan new york": "cole haan",
  "columbia sportswear": "columbia",
  "dell technologies": "dell",
  "dewalt industrial": "dewalt",
  "dr martens": "dr. martens",
  "doc martens": "dr. martens",
  "fuji film": "fujifilm",
  "hewlett-packard": "hp",
  "hewlett packard": "hp",
  "hoka one one": "hoka",
  "hydro flask": "hydro flask",
  "hydroflask": "hydro flask",
  "instant brands": "instant pot",
  "instantpot": "instant pot",
  "kitchenaid": "kitchenaid",
  "kitchen aid": "kitchenaid",
  "la sportiva usa": "la sportiva",
  "le creuset of america": "le creuset",
  "levi strauss": "levi's",
  "levis": "levi's",
  "levi": "levi's",
  "lodge cast iron": "lodge",
  "lodge manufacturing": "lodge",
  "logitech g": "logitech",
  "milwaukee electric": "milwaukee",
  "milwaukee tool": "milwaukee",
  "newbalance": "new balance",
  "new balance athletics": "new balance",
  "nike inc": "nike",
  "nike inc.": "nike",
  "ninja kitchen": "ninja",
  "ninjakitchen": "ninja",
  "north face": "the north face",
  "tnf": "the north face",
  "osprey packs": "osprey",
  "patagonia inc": "patagonia",
  "philips consumer": "philips",
  "razer inc": "razor",
  "razer inc.": "razor",
  "razer": "razor",
  "reebok international": "reebok",
  "samsung electronics": "samsung",
  "sennheiser electronic": "sennheiser",
  "shark ninja": "shark",
  "sharkninja": "shark",
  "sony electronics": "sony",
  "stanley pmi": "stanley",
  "stanley brand": "stanley",
  "timberland pro": "timberland",
  "under armour inc": "under armour",
  "ua": "under armour",
  "vitamix corporation": "vitamix",
  "yeti coolers": "yeti",
  "yeti holdings": "yeti",
  "zwilling j.a. henckels": "zwilling",
  "henckels": "zwilling",
  "asus computer": "asus",
  "asus tek": "asus",
  "bmw motorsport": "bmw",
  "donna karan": "dkny",
  "donna karan new york": "dkny",
  "gap inc": "gap",
  "old navy": "gap",
  "lg electronics": "lg",
  "lego group": "lego",
  "lego systems": "lego",
  "ugg australia": "ugg",
  "deckers outdoor": "ugg",
};

/**
 * Resolve a brand string to a store entry.
 * Returns { brand, url, searchTemplate? } or null.
 */
window.NoPrime.lookupBrand = function lookupBrand(rawBrand) {
  if (!rawBrand) return null;

  const key = rawBrand.trim().toLowerCase();

  // 1. Direct match
  if (BRAND_STORE_MAP[key]) {
    return { brand: key, ...BRAND_STORE_MAP[key] };
  }

  // 2. Alias match
  const canonical = BRAND_ALIASES[key];
  if (canonical && BRAND_STORE_MAP[canonical]) {
    return { brand: canonical, ...BRAND_STORE_MAP[canonical] };
  }

  // 3. Partial match – check if any brand key appears as a whole word
  //    inside the raw brand string (handles "Nike, Inc." → "nike").
  //    We require word boundaries to avoid false positives like
  //    "amazon basics" matching "asics".
  for (const [mapKey, entry] of Object.entries(BRAND_STORE_MAP)) {
    // Build a regex that matches mapKey as a whole word
    const escaped = mapKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:^|[\\s,.]|\\b)${escaped}(?:[\\s,.]|$|\\b)`, "i");
    if (re.test(key)) {
      return { brand: mapKey, ...entry };
    }
  }

  return null;
};

/**
 * Build a redirect URL for a product.
 *
 * @param {object} storeEntry result of lookupBrand()
 * @param {string} productTitle product name from the Amazon page
 * @returns {string} the best URL we can offer
 */
window.NoPrime.buildRedirectUrl = function buildRedirectUrl(storeEntry, productTitle) {
  if (!storeEntry) return null;

  if (storeEntry.searchTemplate && productTitle) {
    // Build a concise search query: first ~60 chars of the title
    const query = encodeURIComponent(productTitle.slice(0, 80).trim());
    return storeEntry.searchTemplate.replace("{query}", query);
  }

  // Fall back to homepage
  return storeEntry.url;
};

/**
 * Build a web-search fallback URL when we have no brand mapping.
 *
 * @param {string} brand raw brand name
 * @param {string} productTitle product title
 * @returns {string}
 */
window.NoPrime.buildSearchFallbackUrl = function buildSearchFallbackUrl(brand, productTitle) {
  const parts = [];
  if (brand) parts.push(`"${brand}"`);
  if (productTitle) parts.push(productTitle.slice(0, 60));
  parts.push("-amazon");

  const q = encodeURIComponent(parts.join(" "));
  return `https://duckduckgo.com/?q=${q}`;
};

/**
 * Build a Barnes & Noble URL for a book.
 *
 * If we have an ISBN we deep-link directly; otherwise we search by title.
 *
 * @param {string|null} isbn ISBN-13 or ISBN-10
 * @param {string} title  product / book title
 * @returns {string}
 */
window.NoPrime.buildBarnesNobleUrl = function buildBarnesNobleUrl(isbn, title) {
  if (isbn) {
    return `https://www.barnesandnoble.com/w/?ean=${encodeURIComponent(isbn)}`;
  }
  const q = encodeURIComponent((title || "").slice(0, 80).trim());
  return `https://www.barnesandnoble.com/s/${q}`;
};

/**
 * Build a DuckDuckGo search URL to help the user find local bookstores
 * that carry this title.
 *
 * @param {string} title  book title
 * @returns {string}
 */
window.NoPrime.buildLocalBookstoreUrl = function buildLocalBookstoreUrl(title) {
  const q = encodeURIComponent(
    `"${(title || "").slice(0, 60).trim()}" local bookstores`
  );
  return `https://duckduckgo.com/?q=${q}`;
};

/**
 * Detect suspect brand names.
 *
 * Legitimate brands almost never register their name in ALL CAPS on Amazon.
 * Cheap Amazon-only sellers frequently do (e.g. "BSTOEM", "TGKXT", "KOORUI").
 * Known all-caps brands like LEGO, ASICS, and ASUS are in the brand map and
 * will be matched before this function is reached.
 *
 * @param {string} name  brand name as it appears on the Amazon page
 * @returns {boolean}
 */
window.NoPrime.isSuspectBrand = function isSuspectBrand(name) {
  if (!name) return false;

  const alpha = name.replace(/[^a-zA-Z]/g, "");
  if (alpha.length < 4) return false; // too short to judge

  return alpha === alpha.toUpperCase();
};
