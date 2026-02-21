/**
 * Brand-to-store mapping.
 *
 * We use a three-tier resolution strategy:
 *
 *   1. **Exact match** – the brand name extracted from the Amazon page is
 *      looked up (case-insensitively) in MANUFACTURER_STORE_MAP below. If found we
 *      know the store URL and can build a deep product search link.
 *
 *   2. **Fuzzy / alias match** – BRAND_ALIASES maps common variations,
 *      abbreviations, and sub-brands back to a canonical key in
 *      MANUFACTURER_STORE_MAP.
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

// Maps brands to their canonical names.
const BRAND_ALIASES = {
};

// Brands with a history of review manipulation or other disreputable practices.
const DISREPUTABLE_BRANDS = [
  "ravpower",
];

// Retailer definitions for brands that don't sell direct-to-consumer.
const RETAILERS = {
  bestBuy: { store: "Best Buy", url: "https://www.bestbuy.com", searchTemplate: "https://www.bestbuy.com/site/searchpage.jsp?st={query}" },
};

// Add entries alphabetically.
const MANUFACTURER_STORE_MAP = {
  "3m": {
    "url": "https://www.3m.com",
    "searchTemplate": "https://www.3m.com/3M/en_US/p/?Ntt={query}"
  },
  "7 for all mankind": {
    "url": "https://www.7forallmankind.com",
    "searchTemplate": "https://www.7forallmankind.com/search?q={query}"
  },
  "8bitdo": {
    "url": "https://www.8bitdo.com",
    "searchTemplate": null
  },
  "ableton": {
    "url": "https://www.ableton.com",
    "searchTemplate": null
  },
  "acer": {
    "url": "https://www.acer.com",
    "searchTemplate": "https://www.acer.com/us-en/search/search-explore?search={query}"
  },
  "acqua di parma": {
    "url": "https://www.acquadiparma.com",
    "searchTemplate": "https://www.acquadiparma.com/search?q={query}"
  },
  "adidas": {
    "url": "https://www.adidas.com",
    "searchTemplate": "https://www.adidas.com/us/search?q={query}"
  },
  "aer": {
    "url": "https://www.aersf.com",
    "searchTemplate": "https://www.aersf.com/search?q={query}"
  },
  "aeropress": {
    "url": "https://aeropress.com",
    "searchTemplate": "https://aeropress.com/search?q={query}"
  },
  "ag jeans": {
    "url": "https://www.agjeans.com",
    "searchTemplate": "https://www.agjeans.com/search?q={query}"
  },
  "akai": {
    "url": "https://www.akaipro.com",
    "searchTemplate": "https://www.akaipro.com/search/?query={query}"
  },
  "akg": {
    "url": "https://www.akg.com",
    "searchTemplate": "https://www.akg.com/search?q={query}"
  },
  "all-clad": {
    "url": "https://www.all-clad.com",
    "searchTemplate": "https://www.all-clad.com/catalogsearch/result/?q={query}"
  },
  "allbirds": {
    "url": "https://www.allbirds.com",
    "searchTemplate": "https://www.allbirds.com/search?q={query}"
  },
  "altra": {
    "url": "https://www.altrarunning.com",
    "searchTemplate": "https://www.altrarunning.com/en-us/search/?q={query}"
  },
  "american eagle": {
    "url": "https://www.ae.com",
    "searchTemplate": "https://www.ae.com/us/en/s/{query}"
  },
  "american girl": {
    "url": "https://www.americangirl.com",
    "searchTemplate": "https://www.americangirl.com/search?q={query}"
  },
  "american standard": {
    "url": "https://www.americanstandard-us.com",
    "searchTemplate": null
  },
  "anova": {
    "url": "https://anovaculinary.com",
    "searchTemplate": "https://anovaculinary.com/search?q={query}"
  },
  "anycubic": {
    "url": "https://www.anycubic.com",
    "searchTemplate": "https://www.anycubic.com/search?q={query}"
  },
  "apple": {
    "url": "https://www.apple.com",
    "searchTemplate": "https://www.apple.com/search/{query}"
  },
  "arc'teryx": {
    "url": "https://arcteryx.com",
    "searchTemplate": "https://arcteryx.com/search?q={query}"
  },
  "ariat": {
    "url": "https://www.ariat.com",
    "searchTemplate": "https://www.ariat.com/search?q={query}"
  },
  "arlo": {
    "url": "https://www.arlo.com",
    "searchTemplate": "https://us.arlo.com/search?q={query}"
  },
  "arturia": {
    "url": "https://www.arturia.com",
    "searchTemplate": "https://www.arturia.com/search?q={query}"
  },
  "asics": {
    "url": "https://www.asics.com",
    "searchTemplate": "https://www.asics.com/us/en-us/search?q={query}"
  },
  "asus": {
    "url": "https://www.asus.com",
    "searchTemplate": "https://www.asus.com/searchresult?searchType=products&searchKey={query}"
  },
  "athleta": {
    "url": "https://athleta.gap.com",
    "searchTemplate": "https://athleta.gap.com/search?q={query}"
  },
  "audio-technica": {
    "url": "https://www.audio-technica.com",
    "searchTemplate": "https://www.audio-technica.com/search?q={query}"
  },
  "august": {
    "url": "https://august.com",
    "searchTemplate": null
  },
  "away": {
    "url": "https://www.awaytravel.com",
    "searchTemplate": "https://www.awaytravel.com/search?q={query}"
  },
  "baby bjorn": {
    "url": "https://www.babybjorn.com",
    "searchTemplate": "https://www.babybjorn.com/search/?q={query}"
  },
  "balmuda": {
    "url": "https://www.balmuda.com",
    "searchTemplate": null
  },
  "bambu lab": {
    "url": "https://bambulab.com",
    "searchTemplate": null
  },
  "banana republic": {
    "url": "https://bananarepublic.gap.com",
    "searchTemplate": "https://bananarepublic.gap.com/search?q={query}"
  },
  "bang & olufsen": {
    "url": "https://www.bang-olufsen.com",
    "searchTemplate": "https://www.bang-olufsen.com/search?q={query}"
  },
  "baratza": {
    "url": "https://www.baratza.com",
    "searchTemplate": "https://www.baratza.com/search?q={query}"
  },
  "barbour": {
    "url": "https://www.barbour.com",
    "searchTemplate": "https://www.barbour.com/search?q={query}"
  },
  "bath & body works": {
    "url": "https://www.bathandbodyworks.com",
    "searchTemplate": "https://www.bathandbodyworks.com/search?q={query}"
  },
  "beats": {
    "url": "https://www.beatsbydre.com",
    "searchTemplate": "https://www.beatsbydre.com/search?q={query}"
  },
  "belkin": {
    "url": "https://www.belkin.com",
    "searchTemplate": "https://www.belkin.com/search?q={query}"
  },
  "benchmade": {
    "url": "https://www.benchmade.com",
    "searchTemplate": "https://www.benchmade.com/search?q={query}"
  },
  "benq": {
    "url": "https://www.benq.com",
    "searchTemplate": "https://www.benq.com/search?q={query}"
  },
  "beyerdynamic": {
    "url": "https://north-america.beyerdynamic.com",
    "searchTemplate": "https://north-america.beyerdynamic.com/search?q={query}"
  },
  "big agnes": {
    "url": "https://www.bigagnes.com",
    "searchTemplate": "https://www.bigagnes.com/search?q={query}"
  },
  "birkenstock": {
    "url": "https://www.birkenstock.com",
    "searchTemplate": "https://www.birkenstock.com/search?q={query}"
  },
  "black diamond": {
    "url": "https://www.blackdiamondequipment.com",
    "searchTemplate": "https://www.blackdiamondequipment.com/search?q={query}"
  },
  "black+decker": {
    "url": "https://www.blackanddecker.com",
    "searchTemplate": "https://www.blackanddecker.com/search?q={query}"
  },
  "blendtec": {
    "url": "https://www.blendtec.com",
    "searchTemplate": "https://www.blendtec.com/search?q={query}"
  },
  "blundstone": {
    "url": "https://www.blundstone.com",
    "searchTemplate": "https://www.blundstone.com/search?q={query}"
  },
  "bmw": {
    "url": "https://www.bmw.com",
    "searchTemplate": null
  },
  "body glove": {
    "url": "https://www.bodyglove.com",
    "searchTemplate": null
  },
  "bombas": {
    "url": "https://bombas.com",
    "searchTemplate": "https://bombas.com/search?q={query}"
  },
  "bosch": {
    "url": "https://www.bosch-home.com",
    "searchTemplate": "https://www.bosch-home.com/us/en/search?term={query}"
  },
  "bose": {
    "url": "https://www.bose.com",
    "searchTemplate": "https://www.bose.com/search?q={query}"
  },
  "bowers & wilkins": {
    "url": "https://www.bowerswilkins.com",
    "searchTemplate": "https://www.bowerswilkins.com/search?q={query}"
  },
  "braun": {
    "url": "https://www.braun.com",
    "searchTemplate": null
  },
  "breville": {
    "url": "https://www.breville.com",
    "searchTemplate": "https://www.breville.com/us/en/search.html?q={query}"
  },
  "briggs & riley": {
    "url": "https://www.briggs-riley.com",
    "searchTemplate": "https://www.briggs-riley.com/search?q={query}"
  },
  "brooks": {
    "url": "https://www.brooksrunning.com",
    "searchTemplate": "https://www.brooksrunning.com/en_us/search-result?q={query}"
  },
  "brother": {
    "url": "https://www.brother-usa.com",
    "searchTemplate": "https://www.brother-usa.com/search#q={query}"
  },
  "burt's bees": {
    "url": "https://www.burtsbees.com",
    "searchTemplate": "https://www.burtsbees.com/search?q={query}"
  },
  "bushnell": {
    "url": "https://www.bushnell.com",
    "searchTemplate": null
  },
  "callaway": {
    "url": "https://www.callawaygolf.com",
    "searchTemplate": "https://www.callawaygolf.com/?searchQuery={query}"
  },
  "calphalon": {
    "url": "https://www.calphalon.com",
    "searchTemplate": "https://www.calphalon.com/search?q={query}"
  },
  "calvin klein": {
    "url": "https://www.calvinklein.us",
    "searchTemplate": "https://www.calvinklein.us/en/search?q={query}"
  },
  "camelbak": {
    "url": "https://www.camelbak.com",
    "searchTemplate": "https://www.camelbak.com/search?q={query}"
  },
  "camp chef": {
    "url": "https://www.campchef.com",
    "searchTemplate": "https://www.campchef.com/search?q={query}"
  },
  "campfire audio": {
    "url": "https://www.campfireaudio.com",
    "searchTemplate": "https://www.campfireaudio.com/search?q={query}"
  },
  "canada goose": {
    "url": "https://www.canadagoose.com",
    "searchTemplate": "https://www.canadagoose.com/us/en/search?q={query}"
  },
  "cannondale": {
    "url": "https://www.cannondale.com",
    "searchTemplate": null
  },
  "canon": {
    "url": "https://www.usa.canon.com",
    "searchTemplate": "https://www.usa.canon.com/search?q={query}"
  },
  "carhartt": {
    "url": "https://www.carhartt.com",
    "searchTemplate": "https://www.carhartt.com/search?q={query}"
  },
  "casio": {
    "url": "https://www.casio.com",
    "searchTemplate": "https://www.casio.com/us/search/?q={query}"
  },
  "cerave": {
    "url": "https://www.cerave.com",
    "searchTemplate": null
  },
  "cetaphil": {
    "url": "https://www.cetaphil.com",
    "searchTemplate": null
  },
  "chacos": {
    "url": "https://www.chacos.com",
    "searchTemplate": "https://www.chacos.com/US/en/search?q={query}"
  },
  "champion": {
    "url": "https://www.champion.com",
    "searchTemplate": "https://www.champion.com/search?q={query}"
  },
  "chemex": {
    "url": "https://www.chemexcoffeemaker.com",
    "searchTemplate": "https://www.chemexcoffeemaker.com/search?q={query}"
  },
  "cherry": {
    "url": "https://www.cherry.de",
    "searchTemplate": null
  },
  "chicco": {
    "url": "https://www.chiccousa.com",
    "searchTemplate": "https://www.chiccousa.com/search?q={query}"
  },
  "citizen": {
    "url": "https://www.citizenwatch.com",
    "searchTemplate": "https://www.citizenwatch.com/search?q={query}"
  },
  "clarks": {
    "url": "https://www.clarksusa.com",
    "searchTemplate": "https://www.clarksusa.com/search?q={query}"
  },
  "clif bar": {
    "url": "https://www.clifbar.com",
    "searchTemplate": null
  },
  "coach": {
    "url": "https://www.coach.com",
    "searchTemplate": "https://www.coach.com/search?q={query}"
  },
  "cobra golf": {
    "url": "https://www.cobragolf.com",
    "searchTemplate": null
  },
  "cole haan": {
    "url": "https://www.colehaan.com",
    "searchTemplate": "https://www.colehaan.com/search?q={query}"
  },
  "coleman": {
    "url": "https://www.coleman.com",
    "searchTemplate": "https://www.coleman.com/search?q={query}"
  },
  "columbia": {
    "url": "https://www.columbia.com",
    "searchTemplate": "https://www.columbia.com/search?q={query}"
  },
  "conair": {
    "url": "https://www.conair.com",
    "searchTemplate": "https://www.conair.com/search?q={query}"
  },
  "contigo": {
    "url": "https://www.gocontigo.com",
    "searchTemplate": null
  },
  "converse": {
    "url": "https://www.converse.com",
    "searchTemplate": "https://www.converse.com/search?q={query}"
  },
  "cooler master": {
    "url": "https://www.coolermaster.com",
    "searchTemplate": null
  },
  "corningware": {
    "url": "https://www.corningware.com",
    "searchTemplate": null
  },
  "corsair": {
    "url": "https://www.corsair.com",
    "searchTemplate": "https://www.corsair.com/search?q={query}"
  },
  "cotopaxi": {
    "url": "https://www.cotopaxi.com",
    "searchTemplate": "https://www.cotopaxi.com/search?q={query}"
  },
  "craftsman": {
    "url": "https://www.craftsman.com",
    "searchTemplate": "https://www.craftsman.com/search?query={query}"
  },
  "creality": {
    "url": "https://www.creality.com",
    "searchTemplate": "https://www.creality.com/search?q={query}"
  },
  "cricut": {
    "url": "https://cricut.com",
    "searchTemplate": "https://cricut.com/search?q={query}"
  },
  "crocs": {
    "url": "https://www.crocs.com",
    "searchTemplate": "https://www.crocs.com/search?q={query}"
  },
  "crucial": {
    "url": "https://www.crucial.com",
    "searchTemplate": "https://www.crucial.com/search?q={query}"
  },
  "cuisinart": {
    "url": "https://www.cuisinart.com",
    "searchTemplate": "https://www.cuisinart.com/search?q={query}"
  },
  "dakine": {
    "url": "https://www.dakine.com",
    "searchTemplate": "https://www.dakine.com/search?q={query}"
  },
  "das keyboard": {
    "url": "https://www.daskeyboard.com",
    "searchTemplate": null
  },
  "dell": {
    "url": "https://www.dell.com",
    "searchTemplate": "https://www.dell.com/en-us/search/{query}"
  },
  "delta": {
    "url": "https://www.deltafaucet.com",
    "searchTemplate": "https://www.deltafaucet.com/search?q={query}"
  },
  "dermalogica": {
    "url": "https://www.dermalogica.com",
    "searchTemplate": "https://www.dermalogica.com/search?q={query}"
  },
  "dewalt": {
    "url": "https://www.dewalt.com",
    "searchTemplate": "https://www.dewalt.com/searchlanding?search={query}"
  },
  "dickies": {
    "url": "https://www.dickies.com",
    "searchTemplate": "https://www.dickies.com/search?q={query}"
  },
  "dior beauty": {
    "url": "https://www.dior.com/en_us/beauty",
    "searchTemplate": null
  },
  "dji": {
    "url": "https://www.dji.com",
    "searchTemplate": "https://www.dji.com/search?q={query}"
  },
  "dkny": {
    "url": "https://www.dkny.com",
    "searchTemplate": "https://www.dkny.com/search?q={query}"
  },
  "dove": {
    "url": "https://www.dove.com",
    "searchTemplate": null
  },
  "dr. bronner's": {
    "url": "https://www.drbronner.com",
    "searchTemplate": null
  },
  "dr. brown's": {
    "url": "https://www.drbrownsbaby.com",
    "searchTemplate": null
  },
  "dr. martens": {
    "url": "https://www.drmartens.com",
    "searchTemplate": "https://www.drmartens.com/us/en/search?q={query}"
  },
  "dr. scholl's": {
    "url": "https://www.drscholls.com",
    "searchTemplate": null
  },
  "dremel": {
    "url": "https://www.dremel.com",
    "searchTemplate": "https://www.dremel.com/us/en/search?q={query}"
  },
  "dyson": {
    "url": "https://www.dyson.com",
    "searchTemplate": "https://www.dyson.com/search?q={query}"
  },
  "ecco": {
    "url": "https://us.ecco.com",
    "searchTemplate": "https://us.ecco.com/search?q={query}"
  },
  "ecobee": {
    "url": "https://www.ecobee.com",
    "searchTemplate": null
  },
  "eddie bauer": {
    "url": "https://www.eddiebauer.com",
    "searchTemplate": "https://www.eddiebauer.com/search?q={query}"
  },
  "electrolux": {
    "url": "https://www.electrolux.com",
    "searchTemplate": null
  },
  "elgato": {
    "url": "https://www.elgato.com",
    "searchTemplate": "https://www.elgato.com/us/en/search?q={query}"
  },
  "epson": {
    "url": "https://epson.com",
    "searchTemplate": "https://epson.com/search/?text={query}"
  },
  "ergobaby": {
    "url": "https://www.ergobaby.com",
    "searchTemplate": "https://www.ergobaby.com/search?q={query}"
  },
  "estee lauder": {
    "url": "https://www.esteelauder.com",
    "searchTemplate": "https://www.esteelauder.com/search?q={query}"
  },
  "faber-castell": {
    "url": "https://www.faber-castell.com",
    "searchTemplate": "https://www.faber-castell.com/search?q={query}"
  },
  "fender": {
    "url": "https://www.fender.com",
    "searchTemplate": "https://www.fender.com/search?q={query}"
  },
  "fitbit": {
    "url": "https://www.fitbit.com",
    "searchTemplate": null
  },
  "fjallraven": {
    "url": "https://www.fjallraven.com",
    "searchTemplate": "https://www.fjallraven.com/us/en-us/search?q={query}"
  },
  "focusrite": {
    "url": "https://focusrite.com",
    "searchTemplate": null
  },
  "food saver": {
    "url": "https://www.foodsaver.com",
    "searchTemplate": null
  },
  "fossil": {
    "url": "https://www.fossil.com",
    "searchTemplate": "https://www.fossil.com/en-us/search?q={query}"
  },
  "fox racing": {
    "url": "https://www.foxracing.com",
    "searchTemplate": "https://www.foxracing.com/search?q={query}"
  },
  "fractal design": {
    "url": "https://www.fractal-design.com",
    "searchTemplate": null
  },
  "framework": {
    "url": "https://frame.work",
    "searchTemplate": null
  },
  "frigidaire": {
    "url": "https://www.frigidaire.com",
    "searchTemplate": "https://www.frigidaire.com/search/{query}"
  },
  "fujifilm": {
    "url": "https://www.fujifilm.com",
    "searchTemplate": "https://www.fujifilm.com/us/en/search?q={query}"
  },
  "funko": {
    "url": "https://www.funko.com",
    "searchTemplate": "https://www.funko.com/search?q={query}"
  },
  "gap": {
    "url": "https://www.gap.com",
    "searchTemplate": "https://www.gap.com/browse/search.do?searchText={query}"
  },
  "garmin": {
    "url": "https://www.garmin.com",
    "searchTemplate": "https://www.garmin.com/en-US/search/?query={query}"
  },
  "gatorade": {
    "url": "https://www.gatorade.com",
    "searchTemplate": null
  },
  "ge appliances": {
    "url": "https://www.geappliances.com",
    "searchTemplate": "https://www.geappliances.com/shop?search_query={query}"
  },
  "gerber": {
    "url": "https://www.gerbergear.com",
    "searchTemplate": "https://www.gerbergear.com/search?q={query}"
  },
  "ghost": {
    "url": "https://www.ghostlifestyle.com",
    "searchTemplate": "https://www.ghostlifestyle.com/search?q={query}"
  },
  "giant": {
    "url": "https://www.giant-bicycles.com",
    "searchTemplate": null
  },
  "gibson": {
    "url": "https://www.gibson.com",
    "searchTemplate": "https://www.gibson.com/search?q={query}"
  },
  "gillette": {
    "url": "https://gillette.com",
    "searchTemplate": null
  },
  "giro": {
    "url": "https://www.giro.com",
    "searchTemplate": "https://www.giro.com/search?q={query}"
  },
  "glorious": {
    "url": "https://www.gloriousgaming.com",
    "searchTemplate": "https://www.gloriousgaming.com/search?q={query}"
  },
  "goal zero": {
    "url": "https://www.goalzero.com",
    "searchTemplate": "https://www.goalzero.com/search?q={query}"
  },
  "google": {
    "url": "https://store.google.com",
    "searchTemplate": "https://store.google.com/search?q={query}"
  },
  "gopro": {
    "url": "https://www.gopro.com",
    "searchTemplate": null
  },
  "goruck": {
    "url": "https://www.goruck.com",
    "searchTemplate": "https://www.goruck.com/search?q={query}"
  },
  "graco": {
    "url": "https://www.gracobaby.com",
    "searchTemplate": "https://www.gracobaby.com/search?q={query}"
  },
  "greenworks": {
    "url": "https://www.greenworkstools.com",
    "searchTemplate": "https://www.greenworkstools.com/search?q={query}"
  },
  "gregory": {
    "url": "https://www.gregory.com",
    "searchTemplate": "https://www.gregory.com/search?q={query}"
  },
  "grohe": {
    "url": "https://www.grohe.us",
    "searchTemplate": null
  },
  "guess": {
    "url": "https://www.guess.com",
    "searchTemplate": "https://www.guess.com/en-us/home?query={query}"
  },
  "h&m": {
    "url": "https://www2.hm.com",
    "searchTemplate": "https://www2.hm.com/en_us/search-results.html?q={query}"
  },
  "haba": {
    "url": "https://www.habausa.com",
    "searchTemplate": "https://www.habausa.com/search?q={query}"
  },
  "hamilton beach": {
    "url": "https://www.hamiltonbeach.com",
    "searchTemplate": "https://www.hamiltonbeach.com/search-results?search={query}"
  },
  "hanes": {
    "url": "https://www.hanes.com",
    "searchTemplate": "https://www.hanes.com/search?q={query}"
  },
  "hansgrohe": {
    "url": "https://www.hansgrohe-usa.com",
    "searchTemplate": null
  },
  "harman kardon": {
    "url": "https://www.harmankardon.com",
    "searchTemplate": null
  },
  "harry's": {
    "url": "https://www.harrys.com",
    "searchTemplate": null
  },
  "hasbro": {
    "url": "https://shop.hasbro.com",
    "searchTemplate": "https://shop.hasbro.com/search?q={query}"
  },
  "hay": {
    "url": "https://www.hay.com",
    "searchTemplate": null
  },
  "head": {
    "url": "https://www.head.com",
    "searchTemplate": "https://www.head.com/search?q={query}"
  },
  "helinox": {
    "url": "https://helinox.com",
    "searchTemplate": "https://helinox.com/search?q={query}"
  },
  "helly hansen": {
    "url": "https://www.hellyhansen.com",
    "searchTemplate": "https://www.hellyhansen.com/en_us/search?q={query}"
  },
  "herman miller": {
    "url": "https://www.hermanmiller.com",
    "searchTemplate": "https://www.hermanmiller.com/search?q={query}"
  },
  "herschel": {
    "url": "https://herschel.com",
    "searchTemplate": "https://herschel.com/search?q={query}"
  },
  "hexclad": {
    "url": "https://hexclad.com",
    "searchTemplate": "https://hexclad.com/search?q={query}"
  },
  "hifiman": {
    "url": "https://www.hifiman.com",
    "searchTemplate": null
  },
  "hilti": {
    "url": "https://www.hilti.com",
    "searchTemplate": "https://www.hilti.com/search?text={query}"
  },
  "hoka": {
    "url": "https://www.hoka.com",
    "searchTemplate": "https://www.hoka.com/en/us/search?q={query}"
  },
  "honeywell": {
    "url": "https://www.honeywellhome.com",
    "searchTemplate": "https://www.honeywellhome.com/search?q={query}"
  },
  "hoover": {
    "url": "https://www.hoover.com",
    "searchTemplate": "https://www.hoover.com/search?q={query}"
  },
  "hp": {
    "url": "https://www.hp.com",
    "searchTemplate": "https://www.hp.com/us-en/shop/sitesearch?keyword={query}"
  },
  "hugo boss": {
    "url": "https://www.hugoboss.com",
    "searchTemplate": "https://www.hugoboss.com/us/search?q={query}"
  },
  "hurley": {
    "url": "https://www.hurley.com",
    "searchTemplate": "https://www.hurley.com/search?q={query}"
  },
  "husqvarna": {
    "url": "https://www.husqvarna.com",
    "searchTemplate": "https://www.husqvarna.com/search?q={query}"
  },
  "hydro flask": {
    "url": "https://www.hydroflask.com",
    "searchTemplate": "https://www.hydroflask.com/search?q={query}"
  },
  "hyperx": {
    "url": "https://hyperx.com",
    "searchTemplate": "https://hyperx.com/search?q={query}"
  },
  "icebreaker": {
    "url": "https://www.icebreaker.com",
    "searchTemplate": "https://www.icebreaker.com/en-us/search?q={query}"
  },
  "igloo": {
    "url": "https://www.igloocoolers.com",
    "searchTemplate": "https://www.igloocoolers.com/search?q={query}"
  },
  "ikea": {
    "url": "https://www.ikea.com",
    "searchTemplate": "https://www.ikea.com/us/en/search/?q={query}"
  },
  "insta360": {
    "url": "https://www.insta360.com",
    "searchTemplate": "https://www.insta360.com/search?q={query}"
  },
  "instant pot": {
    "url": "https://instantpot.com",
    "searchTemplate": "https://instantpot.com/search?q={query}&type=product"
  },
  "irobot": {
    "url": "https://www.irobot.com",
    "searchTemplate": "https://www.irobot.com/en_US/search?q={query}"
  },
  "irwin": {
    "url": "https://www.irwin.com",
    "searchTemplate": "https://www.irwintools.com/searchlanding?search={query}"
  },
  "j.crew": {
    "url": "https://www.jcrew.com",
    "searchTemplate": "https://www.jcrew.com/r/search/?N=0&Nloc=en&Ntrm={query}"
  },
  "jabra": {
    "url": "https://www.jabra.com",
    "searchTemplate": "https://www.jabra.com/search#{query}"
  },
  "jansport": {
    "url": "https://www.jansport.com",
    "searchTemplate": "https://www.jansport.com/search?q={query}"
  },
  "jbl": {
    "url": "https://www.jbl.com",
    "searchTemplate": "https://www.jbl.com/search?q={query}"
  },
  "jetboil": {
    "url": "https://www.jetboil.com",
    "searchTemplate": null
  },
  "justin's": {
    "url": "https://www.justins.com",
    "searchTemplate": null
  },
  "jvc": {
    "url": "https://www.jvc.com",
    "searchTemplate": null
  },
  "k&n": {
    "url": "https://www.knfilters.com",
    "searchTemplate": "https://www.knfilters.com/search?q={query}"
  },
  "kate spade": {
    "url": "https://www.katespade.com",
    "searchTemplate": "https://www.katespade.com/search?q={query}"
  },
  "keen": {
    "url": "https://www.keenfootwear.com",
    "searchTemplate": "https://www.keenfootwear.com/search?q={query}"
  },
  "kef": {
    "url": "https://us.kef.com",
    "searchTemplate": "https://us.kef.com/search?q={query}"
  },
  "kelty": {
    "url": "https://www.kelty.com",
    "searchTemplate": "https://www.kelty.com/search?q={query}"
  },
  "keurig": {
    "url": "https://www.keurig.com",
    "searchTemplate": "https://www.keurig.com/search?q={query}"
  },
  "kitchenaid": {
    "url": "https://www.kitchenaid.com",
    "searchTemplate": null
  },
  "klean kanteen": {
    "url": "https://www.kleankanteen.com",
    "searchTemplate": "https://www.kleankanteen.com/search?q={query}"
  },
  "klein tools": {
    "url": "https://www.kleintools.com",
    "searchTemplate": "https://www.kleintools.com/search?q={query}"
  },
  "klipsch": {
    "url": "https://www.klipsch.com",
    "searchTemplate": "https://www.klipsch.com/search/results?keywords={query}"
  },
  "knipex": {
    "url": "https://www.knipex-tools.com",
    "searchTemplate": null
  },
  "kobo": {
    "url": "https://www.kobo.com",
    "searchTemplate": "https://www.kobo.com/search?query={query}"
  },
  "kohler": {
    "url": "https://www.kohler.com",
    "searchTemplate": "https://www.kohler.com/en/search?q={query}"
  },
  "korg": {
    "url": "https://www.korg.com",
    "searchTemplate": null
  },
  "l.l.bean": {
    "url": "https://www.llbean.com",
    "searchTemplate": "https://www.llbean.com/llb/shop/search?freeText={query}"
  },
  "la sportiva": {
    "url": "https://www.lasportiva.com",
    "searchTemplate": "https://www.lasportiva.com/en/catalogsearch/result/?q={query}"
  },
  "lacoste": {
    "url": "https://www.lacoste.com",
    "searchTemplate": "https://www.lacoste.com/us/search?q={query}"
  },
  "le creuset": {
    "url": "https://www.lecreuset.com",
    "searchTemplate": "https://www.lecreuset.com/search?q={query}"
  },
  "leatherman": {
    "url": "https://www.leatherman.com",
    "searchTemplate": "https://www.leatherman.com/search?q={query}"
  },
  "lee": {
    "url": "https://www.lee.com",
    "searchTemplate": "https://www.lee.com/search?q={query}"
  },
  "lego": {
    "url": "https://www.lego.com",
    "searchTemplate": "https://www.lego.com/en-us/search?q={query}"
  },
  "lenny & larry's": {
    "url": "https://www.lennylarry.com",
    "searchTemplate": "https://www.lennylarry.com/search?q={query}"
  },
  "lenovo": {
    "url": "https://www.lenovo.com",
    "searchTemplate": "https://www.lenovo.com/us/en/search?fq=&text={query}/"
  },
  "levi's": {
    "url": "https://www.levi.com",
    "searchTemplate": "https://www.levi.com/US/en_US/search/{query}"
  },
  "lexar": {
    "url": "https://www.lexar.com",
    "searchTemplate": null
  },
  "lg": {
    "url": "https://www.lg.com",
    "searchTemplate": "https://www.lg.com/us/search/search-all?search={query}"
  },
  "lifestraw": {
    "url": "https://www.lifestraw.com",
    "searchTemplate": "https://www.lifestraw.com/search?q={query}"
  },
  "liquid i.v.": {
    "url": "https://www.liquid-iv.com",
    "searchTemplate": null
  },
  "lmnt": {
    "url": "https://drinklmnt.com",
    "searchTemplate": null
  },
  "lodge": {
    "url": "https://www.lodgecastiron.com",
    "searchTemplate": "https://www.lodgecastiron.com/search?q={query}"
  },
  "logitech": {
    "url": "https://www.logitech.com",
    "searchTemplate": "https://www.logitech.com/en-us/search?query={query}"
  },
  "lucky brand": {
    "url": "https://www.luckybrand.com",
    "searchTemplate": "https://www.luckybrand.com/search?q={query}"
  },
  "lululemon": {
    "url": "https://shop.lululemon.com",
    "searchTemplate": "https://shop.lululemon.com/search?Ntt={query}"
  },
  "luminox": {
    "url": "https://www.luminox.com",
    "searchTemplate": null
  },
  "mackie": {
    "url": "https://mackie.com",
    "searchTemplate": null
  },
  "makita": {
    "url": "https://www.makitatools.com",
    "searchTemplate": "https://www.makitatools.com/search?q={query}"
  },
  "marmot": {
    "url": "https://www.marmot.com",
    "searchTemplate": "https://www.marmot.com/search?q={query}"
  },
  "marshall": {
    "url": "https://www.marshall.com",
    "searchTemplate": null
  },
  "martin": {
    "url": "https://www.martinguitar.com",
    "searchTemplate": null
  },
  "mattel": {
    "url": "https://shop.mattel.com",
    "searchTemplate": "https://shop.mattel.com/search?q={query}"
  },
  "maytag": {
    "url": "https://www.maytag.com",
    "searchTemplate": null
  },
  "medela": {
    "url": "https://www.medela.com",
    "searchTemplate": "https://www.medela.com/search?q={query}"
  },
  "merrell": {
    "url": "https://www.merrell.com",
    "searchTemplate": "https://www.merrell.com/search?q={query}"
  },
  "michael kors": {
    "url": "https://www.michaelkors.com",
    "searchTemplate": "https://www.michaelkors.com/search?q={query}"
  },
  "microsoft": {
    "url": "https://www.microsoft.com",
    "searchTemplate": "https://www.microsoft.com/en-us/search/shop?q={query}"
  },
  "miele": {
    "url": "https://www.mieleusa.com",
    "searchTemplate": "https://www.mieleusa.com/search?text={query}"
  },
  "milwaukee": {
    "url": "https://www.milwaukeetool.com",
    "searchTemplate": "https://www.milwaukeetool.com/Search?query={query}"
  },
  "mizuno": {
    "url": "https://www.mizunousa.com",
    "searchTemplate": "https://www.mizunousa.com/search?q={query}"
  },
  "moen": {
    "url": "https://www.moen.com",
    "searchTemplate": "https://www.moen.com/search?q={query}"
  },
  "moleskine": {
    "url": "https://www.moleskine.com",
    "searchTemplate": "https://www.moleskine.com/search?q={query}"
  },
  "monoprice": {
    "url": "https://www.monoprice.com",
    "searchTemplate": "https://www.monoprice.com/search/index?keyword={query}"
  },
  "moog": {
    "url": "https://www.moogmusic.com",
    "searchTemplate": null
  },
  "motorola": {
    "url": "https://www.motorola.com",
    "searchTemplate": "https://www.motorola.com/search?q={query}"
  },
  "mountain hardwear": {
    "url": "https://www.mountainhardwear.com",
    "searchTemplate": "https://www.mountainhardwear.com/search?q={query}"
  },
  "msi": {
    "url": "https://www.msi.com",
    "searchTemplate": "https://www.msi.com/search/{query}"
  },
  "msr": {
    "url": "https://www.msrgear.com",
    "searchTemplate": null
  },
  "mudwtr": {
    "url": "https://mudwtr.com",
    "searchTemplate": null
  },
  "naadam": {
    "url": "https://naadam.co",
    "searchTemplate": "https://naadam.co/search?q={query}"
  },
  "nalgene": {
    "url": "https://nalgene.com",
    "searchTemplate": "https://nalgene.com/shop/?s={query}"
  },
  "native instruments": {
    "url": "https://www.native-instruments.com",
    "searchTemplate": null
  },
  "nature made": {
    "url": "https://www.naturemade.com",
    "searchTemplate": null
  },
  "nature's bounty": {
    "url": "https://www.naturesbounty.com",
    "searchTemplate": null
  },
  "nautica": {
    "url": "https://www.nautica.com",
    "searchTemplate": "https://www.nautica.com/search?q={query}"
  },
  "nemo": {
    "url": "https://www.nemoequipment.com",
    "searchTemplate": "https://www.nemoequipment.com/search?q={query}"
  },
  "nerf": {
    "url": "https://nerf.hasbro.com",
    "searchTemplate": null
  },
  "nespresso": {
    "url": "https://www.nespresso.com",
    "searchTemplate": "https://www.nespresso.com/us/en/search?q={query}"
  },
  "nest": {
    "url": "https://store.google.com/us/category/google_nest",
    "searchTemplate": null
  },
  "netgear": {
    "url": "https://www.netgear.com",
    "searchTemplate": null
  },
  "neutrogena": {
    "url": "https://www.neutrogena.com",
    "searchTemplate": null
  },
  "new balance": {
    "url": "https://www.newbalance.com",
    "searchTemplate": "https://www.newbalance.com/search/?q={query}"
  },
  "nike": {
    "url": "https://www.nike.com",
    "searchTemplate": "https://www.nike.com/w?q={query}"
  },
  "nikon": {
    "url": "https://www.nikonusa.com",
    "searchTemplate": null
  },
  "ninja": {
    "url": "https://www.sharkninja.com",
    "searchTemplate": "https://www.sharkninja.com/search?q={query}"
  },
  "nintendo": {
    "url": "https://www.nintendo.com",
    "searchTemplate": "https://www.nintendo.com/us/search/#q={query}"
  },
  "nomad": {
    "url": "https://nomadgoods.com",
    "searchTemplate": "https://nomadgoods.com/search?q={query}"
  },
  "nord": {
    "url": "https://www.nordkeyboards.com",
    "searchTemplate": null
  },
  "numi tea": {
    "url": "https://numitea.com",
    "searchTemplate": null
  },
  "nutribullet": {
    "url": "https://www.nutribullet.com",
    "searchTemplate": "https://www.nutribullet.com/search?q={query}"
  },
  "nuun": {
    "url": "https://nuunlife.com",
    "searchTemplate": null
  },
  "nzxt": {
    "url": "https://nzxt.com",
    "searchTemplate": "https://nzxt.com/search?q={query}"
  },
  "o'neill": {
    "url": "https://www.oneill.com",
    "searchTemplate": "https://us.oneill.com/search?q={query}"
  },
  "oakley": {
    "url": "https://www.oakley.com",
    "searchTemplate": "https://www.oakley.com/en-us/search?q={query}"
  },
  "olay": {
    "url": "https://www.olay.com",
    "searchTemplate": null
  },
  "old navy": {
    "url": "https://oldnavy.gap.com",
    "searchTemplate": "https://oldnavy.gap.com/browse/search.do?searchText={query}"
  },
  "olehenriksen": {
    "url": "https://www.olehenriksen.com",
    "searchTemplate": "https://www.olehenriksen.com/search?q={query}"
  },
  "olukai": {
    "url": "https://www.olukai.com",
    "searchTemplate": "https://www.olukai.com/search?q={query}"
  },
  "omron": {
    "url": "https://omronhealthcare.com",
    "searchTemplate": null
  },
  "on running": {
    "url": "https://www.on-running.com",
    "searchTemplate": "https://www.on-running.com/en-us/search?q={query}"
  },
  "oneplus": {
    "url": "https://www.oneplus.com",
    "searchTemplate": null
  },
  "opinel": {
    "url": "https://www.opinel-usa.com",
    "searchTemplate": null
  },
  "optimum nutrition": {
    "url": "https://www.optimumnutrition.com",
    "searchTemplate": null
  },
  "oral-b": {
    "url": "https://oralb.com",
    "searchTemplate": null
  },
  "orgain": {
    "url": "https://www.orgain.com",
    "searchTemplate": "https://www.orgain.com/search?q={query}"
  },
  "orvis": {
    "url": "https://www.orvis.com",
    "searchTemplate": "https://www.orvis.com/search?q={query}"
  },
  "osprey": {
    "url": "https://www.osprey.com",
    "searchTemplate": "https://www.osprey.com/catalogsearch/result/?q={query}"
  },
  "otterbox": {
    "url": "https://www.otterbox.com",
    "searchTemplate": "https://www.otterbox.com/search?q={query}"
  },
  "our place": {
    "url": "https://fromourplace.com",
    "searchTemplate": "https://fromourplace.com/search?q={query}"
  },
  "oura": {
    "url": "https://ouraring.com",
    "searchTemplate": null
  },
  "outdoor research": {
    "url": "https://www.outdoorresearch.com",
    "searchTemplate": "https://www.outdoorresearch.com/search?q={query}"
  },
  "oxo": {
    "url": "https://www.oxo.com",
    "searchTemplate": "https://www.oxo.com/catalogsearch/result/?q={query}"
  },
  "pacsafe": {
    "url": "https://pacsafe.com",
    "searchTemplate": "https://pacsafe.com/search?q={query}"
  },
  "panasonic": {
    "url": "https://www.panasonic.com",
    "searchTemplate": null
  },
  "patagonia": {
    "url": "https://www.patagonia.com",
    "searchTemplate": "https://www.patagonia.com/search/?q={query}"
  },
  "peak design": {
    "url": "https://www.peakdesign.com",
    "searchTemplate": "https://www.peakdesign.com/search?q={query}"
  },
  "pearl": {
    "url": "https://pearldrum.com",
    "searchTemplate": null
  },
  "pelican": {
    "url": "https://www.pelican.com",
    "searchTemplate": "https://www.pelican.com/us/en/search?q={query}"
  },
  "peloton": {
    "url": "https://www.onepeloton.com",
    "searchTemplate": null
  },
  "penn": {
    "url": "https://www.pennfishing.com",
    "searchTemplate": null
  },
  "pentel": {
    "url": "https://www.pentel.com",
    "searchTemplate": null
  },
  "petzl": {
    "url": "https://www.petzl.com",
    "searchTemplate": null
  },
  "philips": {
    "url": "https://www.usa.philips.com",
    "searchTemplate": "https://www.usa.philips.com/c-w/search.html#q={query}"
  },
  "philips hue": {
    "url": "https://www.philips-hue.com",
    "searchTemplate": null
  },
  "philips sonicare": {
    "url": "https://www.usa.philips.com/c-m-pe/electric-toothbrushes",
    "searchTemplate": null
  },
  "pilot": {
    "url": "https://www.pilotpen.us",
    "searchTemplate": null
  },
  "ping": {
    "url": "https://ping.com",
    "searchTemplate": null
  },
  "playmobil": {
    "url": "https://www.playmobil.us",
    "searchTemplate": "https://www.playmobil.us/search?q={query}"
  },
  "playstation": {
    "url": "https://www.playstation.com",
    "searchTemplate": null
  },
  "polk audio": {
    "url": "https://www.polkaudio.com",
    "searchTemplate": null
  },
  "prana": {
    "url": "https://www.prana.com",
    "searchTemplate": "https://www.prana.com/search?q={query}"
  },
  "presonus": {
    "url": "https://www.presonus.com",
    "searchTemplate": null
  },
  "primal kitchen": {
    "url": "https://www.primalkitchen.com",
    "searchTemplate": "https://www.primalkitchen.com/search?q={query}"
  },
  "primus": {
    "url": "https://www.primus.us",
    "searchTemplate": null
  },
  "prismacolor": {
    "url": "https://www.prismacolor.com",
    "searchTemplate": null
  },
  "prusa": {
    "url": "https://www.prusa3d.com",
    "searchTemplate": null
  },
  "puma": {
    "url": "https://us.puma.com",
    "searchTemplate": "https://us.puma.com/us/en/search?q={query}"
  },
  "pyrex": {
    "url": "https://www.pyrex.com",
    "searchTemplate": null
  },
  "quiksilver": {
    "url": "https://www.quiksilver.com",
    "searchTemplate": "https://www.quiksilver.com/search?q={query}"
  },
  "radio flyer": {
    "url": "https://www.radioflyer.com",
    "searchTemplate": "https://www.radioflyer.com/search?q={query}"
  },
  "ralph lauren": {
    "url": "https://www.ralphlauren.com",
    "searchTemplate": "https://www.ralphlauren.com/search?q={query}"
  },
  "ray-ban": {
    "url": "https://www.ray-ban.com",
    "searchTemplate": "https://www.ray-ban.com/usa/search?q={query}"
  },
  "razer": {
    "url": "https://www.razer.com",
    "searchTemplate": "https://www.razer.com/search/{query}"
  },
  "razor scooter": {
    "url": "https://www.razor.com",
    "searchTemplate": "https://www.razor.com/?s={query}"
  },
  "red wing": {
    "url": "https://www.redwingshoes.com",
    "searchTemplate": "https://www.redwingshoes.com/search?q={query}"
  },
  "reebok": {
    "url": "https://www.reebok.com",
    "searchTemplate": "https://www.reebok.com/search?q={query}"
  },
  "reef": {
    "url": "https://www.reef.com",
    "searchTemplate": "https://www.reef.com/search?q={query}"
  },
  "rode": {
    "url": "https://www.rode.com",
    "searchTemplate": null
  },
  "rogue fitness": {
    "url": "https://www.roguefitness.com",
    "searchTemplate": "https://www.roguefitness.com/search?q={query}"
  },
  "roku": {
    "url": "https://www.roku.com",
    "searchTemplate": null
  },
  "roland": {
    "url": "https://www.roland.com",
    "searchTemplate": null
  },
  "roxy": {
    "url": "https://www.roxy.com",
    "searchTemplate": "https://www.roxy.com/search?q={query}"
  },
  "rxbar": {
    "url": "https://www.rxbar.com",
    "searchTemplate": null
  },
  "ryobi": {
    "url": "https://www.ryobitools.com",
    "searchTemplate": "https://www.ryobitools.com/search?q={query}"
  },
  "sabian": {
    "url": "https://sabian.com",
    "searchTemplate": null
  },
  "salomon": {
    "url": "https://www.salomon.com",
    "searchTemplate": "https://www.salomon.com/en-us/search?q={query}"
  },
  "samsonite": {
    "url": "https://www.samsonite.com",
    "searchTemplate": "https://www.samsonite.com/search?q={query}"
  },
  "samsung": {
    "url": "https://www.samsung.com",
    "searchTemplate": "https://www.samsung.com/us/search/searchMain?searchTerm={query}"
  },
  "sandisk": {
    "url": "https://www.westerndigital.com/brand/sandisk",
    "searchTemplate": null
  },
  "santa cruz": {
    "url": "https://www.santacruzbicycles.com",
    "searchTemplate": null
  },
  "sanuk": {
    "url": "https://www.sanuk.com",
    "searchTemplate": "https://www.sanuk.com/search?q={query}"
  },
  "saucony": {
    "url": "https://www.saucony.com",
    "searchTemplate": "https://www.saucony.com/en/search?q={query}"
  },
  "scarpa": {
    "url": "https://www.scarpa.com",
    "searchTemplate": null
  },
  "schlage": {
    "url": "https://www.schlage.com",
    "searchTemplate": null
  },
  "sea to summit": {
    "url": "https://seatosummit.com",
    "searchTemplate": "https://seatosummit.com/search?q={query}"
  },
  "seagate": {
    "url": "https://www.seagate.com",
    "searchTemplate": "https://www.seagate.com/search/?q={query}"
  },
  "seiko": {
    "url": "https://www.seikowatches.com",
    "searchTemplate": null
  },
  "sennheiser": {
    "url": "https://www.sennheiser.com",
    "searchTemplate": null
  },
  "seventh generation": {
    "url": "https://www.seventhgeneration.com",
    "searchTemplate": null
  },
  "shark": {
    "url": "https://www.sharkclean.com",
    "searchTemplate": "https://www.sharkclean.com/search?q={query}"
  },
  "sharpie": {
    "url": "https://www.sharpie.com",
    "searchTemplate": null
  },
  "sheamoisture": {
    "url": "https://www.sheamoisture.com",
    "searchTemplate": "https://www.sheamoisture.com/search?q={query}"
  },
  "shimano": {
    "url": "https://www.shimano.com",
    "searchTemplate": null
  },
  "shure": {
    "url": "https://www.shure.com",
    "searchTemplate": "https://www.shure.com/en-US/search?q={query}"
  },
  "simplehuman": {
    "url": "https://www.simplehuman.com",
    "searchTemplate": "https://www.simplehuman.com/search?q={query}"
  },
  "skechers": {
    "url": "https://www.skechers.com",
    "searchTemplate": "https://www.skechers.com/search?q={query}"
  },
  "skullcandy": {
    "url": "https://www.skullcandy.com",
    "searchTemplate": "https://www.skullcandy.com/search?q={query}"
  },
  "smeg": {
    "url": "https://www.smeg.com",
    "searchTemplate": null
  },
  "smith optics": {
    "url": "https://www.smithoptics.com",
    "searchTemplate": "https://www.smithoptics.com/en_US/search?q={query}"
  },
  "snap-on": {
    "url": "https://www.snapon.com",
    "searchTemplate": null
  },
  "sonos": {
    "url": "https://www.sonos.com",
    "searchTemplate": "https://www.sonos.com/en-us/search?q={query}"
  },
  "sony": {
    "url": "https://electronics.sony.com/",
    "searchTemplate": "https://electronics.sony.com/search/{query}"
  },
  "sorel": {
    "url": "https://www.sorel.com",
    "searchTemplate": "https://www.sorel.com/search?q={query}"
  },
  "specialized": {
    "url": "https://www.specialized.com",
    "searchTemplate": "https://www.specialized.com/us/en/search/{query}"
  },
  "spy optic": {
    "url": "https://www.spyoptic.com",
    "searchTemplate": "https://www.spyoptic.com/search?q={query}"
  },
  "stanley": {
    "url": "https://www.stanley1913.com",
    "searchTemplate": "https://www.stanley1913.com/search?q={query}"
  },
  "steelseries": {
    "url": "https://steelseries.com",
    "searchTemplate": "https://steelseries.com/search?q={query}"
  },
  "stihl": {
    "url": "https://www.stihlusa.com",
    "searchTemplate": null
  },
  "suunto": {
    "url": "https://www.suunto.com",
    "searchTemplate": "https://www.suunto.com/search?q={query}"
  },
  "swatch": {
    "url": "https://www.swatch.com",
    "searchTemplate": null
  },
  "synology": {
    "url": "https://www.synology.com",
    "searchTemplate": "https://www.synology.com/search?q={query}"
  },
  "t-fal": {
    "url": "https://www.t-fal.com",
    "searchTemplate": null
  },
  "taylor": {
    "url": "https://www.taylorguitars.com",
    "searchTemplate": null
  },
  "taylormade": {
    "url": "https://www.taylormadegolf.com",
    "searchTemplate": "https://www.taylormadegolf.com/search?q={query}"
  },
  "ted baker": {
    "url": "https://www.tedbaker.com",
    "searchTemplate": "https://www.tedbaker.com/search?q={query}"
  },
  "the north face": {
    "url": "https://www.thenorthface.com",
    "searchTemplate": "https://www.thenorthface.com/en-us/search?q={query}"
  },
  "theragun": {
    "url": "https://www.therabody.com",
    "searchTemplate": null
  },
  "therm-a-rest": {
    "url": "https://www.thermarest.com",
    "searchTemplate": null
  },
  "thermos": {
    "url": "https://www.thermos.com",
    "searchTemplate": "https://www.thermos.com/search?q={query}"
  },
  "thule": {
    "url": "https://www.thule.com",
    "searchTemplate": "https://www.thule.com/en-us/search?search={query}"
  },
  "thuma": {
    "url": "https://www.thuma.co",
    "searchTemplate": null
  },
  "ticonderoga": {
    "url": "https://www.dixonticonderoga.com",
    "searchTemplate": null
  },
  "tile": {
    "url": "https://www.tile.com",
    "searchTemplate": null
  },
  "timberland": {
    "url": "https://www.timberland.com",
    "searchTemplate": "https://www.timberland.com/search?q={query}"
  },
  "timbuk2": {
    "url": "https://www.timbuk2.com",
    "searchTemplate": "https://www.timbuk2.com/search?q={query}"
  },
  "timex": {
    "url": "https://www.timex.com",
    "searchTemplate": "https://www.timex.com/search?q={query}"
  },
  "titleist": {
    "url": "https://www.titleist.com",
    "searchTemplate": null
  },
  "tommy hilfiger": {
    "url": "https://usa.tommy.com",
    "searchTemplate": "https://usa.tommy.com/en/search?q={query}"
  },
  "trek": {
    "url": "https://www.trekbikes.com",
    "searchTemplate": "https://www.trekbikes.com/us/en_US/search?q={query}"
  },
  "true religion": {
    "url": "https://www.truereligion.com",
    "searchTemplate": "https://www.truereligion.com/search?q={query}"
  },
  "tuft & needle": {
    "url": "https://www.tuftandneedle.com",
    "searchTemplate": null
  },
  "tumi": {
    "url": "https://www.tumi.com",
    "searchTemplate": "https://www.tumi.com/search?q={query}"
  },
  "turtle beach": {
    "url": "https://www.turtlebeach.com",
    "searchTemplate": "https://www.turtlebeach.com/search?q={query}"
  },
  "ty": {
    "url": "https://www.ty.com",
    "searchTemplate": null
  },
  "ubiquiti": {
    "url": "https://www.ui.com",
    "searchTemplate": null
  },
  "ugg": {
    "url": "https://www.ugg.com",
    "searchTemplate": "https://www.ugg.com/search?q={query}"
  },
  "under armour": {
    "url": "https://www.underarmour.com",
    "searchTemplate": "https://www.underarmour.com/en-us/search?q={query}"
  },
  "uni-ball": {
    "url": "https://uniballco.com",
    "searchTemplate": null
  },
  "uniqlo": {
    "url": "https://www.uniqlo.com",
    "searchTemplate": "https://www.uniqlo.com/us/en/search?q={query}"
  },
  "universal audio": {
    "url": "https://www.uaudio.com",
    "searchTemplate": null
  },
  "valve": {
    "url": "https://store.steampowered.com",
    "searchTemplate": null
  },
  "vans": {
    "url": "https://www.vans.com",
    "searchTemplate": "https://www.vans.com/search?q={query}"
  },
  "vari": {
    "url": "https://www.vari.com",
    "searchTemplate": "https://www.vari.com/search?q={query}"
  },
  "vaude": {
    "url": "https://www.vaude.com",
    "searchTemplate": null
  },
  "vichy": {
    "url": "https://www.vichyusa.com",
    "searchTemplate": null
  },
  "victorinox": {
    "url": "https://www.victorinox.com",
    "searchTemplate": "https://www.victorinox.com/en-US/search?q={query}"
  },
  "vitamix": {
    "url": "https://www.vitamix.com",
    "searchTemplate": "https://www.vitamix.com/search?q={query}"
  },
  "volcom": {
    "url": "https://www.volcom.com",
    "searchTemplate": "https://www.volcom.com/search?q={query}"
  },
  "wahl": {
    "url": "https://www.wahl.com",
    "searchTemplate": null
  },
  "waterpik": {
    "url": "https://www.waterpik.com",
    "searchTemplate": "https://www.waterpik.com/?q={query}"
  },
  "wera": {
    "url": "https://www.weratools.com/",
    "searchTemplate": null
  },
  "western digital": {
    "url": "https://www.westerndigital.com",
    "searchTemplate": "https://www.westerndigital.com/search?q={query}"
  },
  "whirlpool": {
    "url": "https://www.whirlpool.com",
    "searchTemplate": null
  },
  "wilson": {
    "url": "https://www.wilson.com",
    "searchTemplate": "https://www.wilson.com/en-us/search?q={query}"
  },
  "withings": {
    "url": "https://www.withings.com",
    "searchTemplate": null
  },
  "wolverine": {
    "url": "https://www.wolverine.com",
    "searchTemplate": "https://www.wolverine.com/US/en/search?q={query}"
  },
  "wrangler": {
    "url": "https://www.wrangler.com",
    "searchTemplate": "https://www.wrangler.com/search?q={query}"
  },
  "wusthof": {
    "url": "https://www.wusthof.com",
    "searchTemplate": "https://www.wusthof.com/search?q={query}"
  },
  "xbox": {
    "url": "https://www.xbox.com",
    "searchTemplate": null
  },
  "yakima": {
    "url": "https://www.yakima.com",
    "searchTemplate": "https://www.yakima.com/search?q={query}"
  },
  "yale": {
    "url": "https://www.yalehome.com",
    "searchTemplate": null
  },
  "yamaha": {
    "url": "https://www.yamaha.com",
    "searchTemplate": "https://www.yamaha.com/en/search/?search={query}"
  },
  "yeti": {
    "url": "https://www.yeti.com",
    "searchTemplate": "https://www.yeti.com/search?q={query}"
  },
  "zebra": {
    "url": "https://www.zebra.com",
    "searchTemplate": "https://www.zebra.com/search?q={query}"
  },
  "zildjian": {
    "url": "https://zildjian.com",
    "searchTemplate": "https://zildjian.com/search?q={query}"
  },
  "zojirushi": {
    "url": "https://www.zojirushi.com",
    "searchTemplate": "https://www.zojirushi.com/app/site_search?query={query}"
  }
};

// Brands that don't sell direct-to-consumer but whose products are carried by
// major retailers. We redirect to another retailer's search instead.
const ALTERNATE_STORE_MAP = {
  "amd": RETAILERS.bestBuy,
  "denon": RETAILERS.bestBuy,
  "hisense": RETAILERS.bestBuy,
  "hitachi": RETAILERS.bestBuy,
  "intel": RETAILERS.bestBuy,
  "linksys": RETAILERS.bestBuy,
  "marantz": RETAILERS.bestBuy,
  "onkyo": RETAILERS.bestBuy,
  "pioneer": RETAILERS.bestBuy,
  "sharp": RETAILERS.bestBuy,
  "tcl": RETAILERS.bestBuy,
  "toshiba": RETAILERS.bestBuy,
  "viewsonic": RETAILERS.bestBuy,
  "vizio": RETAILERS.bestBuy,
};

/**
 * Resolve a brand string to a store entry.
 * Returns { brand, url, searchTemplate? } or null.
 */
window.NoPrime.lookupBrand = function lookupBrand(rawBrand) {
  if (!rawBrand) return null;

  const key = rawBrand.trim().toLowerCase();

  // 1. Direct match
  if (MANUFACTURER_STORE_MAP[key]) {
    return { brand: key, ...MANUFACTURER_STORE_MAP[key] };
  }

  // 2. Alias match
  const canonical = BRAND_ALIASES[key];
  if (canonical && MANUFACTURER_STORE_MAP[canonical]) {
    return { brand: canonical, ...MANUFACTURER_STORE_MAP[canonical] };
  }

  // 3. Partial match – check if any brand key appears as a whole word
  //    inside the raw brand string (handles "Nike, Inc." → "nike").
  //    We require word boundaries to avoid false positives like
  //    "amazon basics" matching "asics".
  for (const [mapKey, entry] of Object.entries(MANUFACTURER_STORE_MAP)) {
    // Build a regex that matches mapKey as a whole word
    const escaped = mapKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:^|[\\s,.]|\\b)${escaped}(?:[\\s,.]|$|\\b)`, "i");
    if (re.test(key)) {
      return { brand: mapKey, ...entry };
    }
  }

  // 4. Alternate store match – brands without DTC stores, mapped to retailers
  if (ALTERNATE_STORE_MAP[key]) {
    return { brand: key, ...ALTERNATE_STORE_MAP[key] };
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
