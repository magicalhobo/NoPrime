# NoPrime

A Chrome extension that detects when you're on an Amazon product page and offers to redirect you to the brand's own store, so you can buy direct from the manufacturer.

## How it works

When you visit a product page on Amazon (any locale), the extension:

1. **Extracts product metadata** from the page DOM — brand name, product title, model number, ASIN
2. **Resolves the brand** to a direct-to-consumer store URL using a three-tier strategy
3. **Shows a non-intrusive banner** at the top of the page with a link to the brand's store
4. **Updates the toolbar badge** so you can see at a glance whether a match was found

### Destination selection

| Tier | Method | Quality | Example |
|------|--------|---------|---------|
| 1 | **Exact match** — brand name from the page matches an entry in our curated brand → store database | ⭐⭐⭐ High — links directly to the product search on the brand's site | "Nike" → `nike.com/w?q=...` |
| 2 | **Alias / fuzzy match** — the brand name is a known variation, abbreviation, or sub-brand that maps to a canonical entry | ⭐⭐ Good — same as above after resolving the alias | "Hoka One One" → `hoka.com/...` |
| 3 | **Web-search fallback** — no mapping exists, so we construct a DuckDuckGo search excluding Amazon | ⭐ Decent — the user still needs to click a search result | `"UnknownBrand" Product Title -amazon` |

### Data flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Content Script  │────▶│  Background SW   │◀────│     Popup        │
│  (per tab)       │     │  (service worker)│     │  (toolbar icon)  │
│                  │     │                  │     │                  │
│ • Scrape DOM     │     │ • Store per-tab  │     │ • Query current  │
│ • Resolve brand  │     │   product state  │     │   tab's product  │
│ • Inject banner  │     │ • Update badge   │     │ • Toggle on/off  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

## Project structure

```
NoPrime/
├── extension/              # ← Load this folder in chrome://extensions
│   ├── manifest.json       # Chrome MV3 manifest
│   ├── icons/              # Extension icons (16/48/128 px)
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── src/
│       ├── background.js   # Service worker – per-tab state & badge
│       ├── content.js      # Content script – extraction & banner injection
│       ├── extractor.js    # DOM scraping logic for Amazon product pages
│       ├── brands.js       # Brand → store mapping database + lookup
│       ├── banner.css      # Injected banner styles
│       ├── popup.html      # Toolbar popup UI
│       └── popup.js        # Popup logic
└── README.md
```

## Installation (development)

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (toggle in the top-right)
3. Click **Load unpacked** and select the `NoPrime/extension/` folder
4. Navigate to any Amazon product page — you should see a green banner

## Expanding the brand database

The brand database lives in `extension/src/brands.js`. Each entry maps a lowercase brand name to:

```js
"brand-name": { url: "https://www.brand.com", searchTemplate: "https://www.brand.com/search?q={query}" }
```

## Design decisions

| Decision | Rationale |
|----------|-----------|
| **No auto-redirect** | Silently redirecting would break the user's flow and might feel like malware. A visible banner with a clear CTA is more trustworthy. |
| **No external API calls** | The extension works entirely offline with the bundled brand database. This avoids privacy concerns and API rate limits. |
| **`document_idle` injection** | We wait for the page to settle before scraping, which avoids races with Amazon's lazy-loaded content. |
| **SPA navigation observer** | Amazon uses History API pushState for some page transitions. We watch for URL changes and re-run when a new product page is detected. |

## License

MIT
