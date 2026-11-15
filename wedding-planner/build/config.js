// ─────────────────────────────────────────────────────────────
//  EDIT THIS FILE before building the files you will sell.
//  Every link the buyer clicks in the PDFs comes from here.
// ─────────────────────────────────────────────────────────────
module.exports = {
  brand: 'Ivory & Vow',                 // your shop / brand name (appears in footers)
  productTitle: 'The Wedding Planner',
  productSubtitle: 'Everything you need, from yes to ever after',
  edition: 'Complete Edition · 2027',
  shopUrl: 'https://www.etsy.com/shop/YOUR-SHOP-NAME',
  supportEmail: 'hello@your-domain.com',

  // Live vendor directory (the /site folder, hosted on GitHub Pages / Netlify).
  // A QR code and links to this page are printed in the planner.
  // Opening-page image: 'illustration' (art/out/couple-illustration.png — only sell it if you hold a
  // commercial license for it) or 'vintage' (public-domain 1828/1848 fashion plates, safe to sell).
  openingImage: 'illustration',

  vendorDirectoryUrl: 'https://YOUR-USERNAME.github.io/wedding-vendors/',

  // The interactive app (site/app, hosted together with the directory).
  appUrl: 'https://YOUR-USERNAME.github.io/wedding-vendors/app/',

  // Canva template links. In Canva: open the design → Share → "Template link" → copy.
  // Paste each link here and run `npm run build` again.
  canva: {
    classic: {
      saveTheDate: 'https://www.canva.com/',
      invitation: 'https://www.canva.com/',
      rsvp: 'https://www.canva.com/',
      details: 'https://www.canva.com/',
      program: 'https://www.canva.com/',
      menu: 'https://www.canva.com/',
      tableNumber: 'https://www.canva.com/',
      placeCard: 'https://www.canva.com/',
      welcomeSign: 'https://www.canva.com/',
      thankYou: 'https://www.canva.com/',
    },
    modern: {
      saveTheDate: 'https://www.canva.com/',
      invitation: 'https://www.canva.com/',
      rsvp: 'https://www.canva.com/',
      details: 'https://www.canva.com/',
      program: 'https://www.canva.com/',
      menu: 'https://www.canva.com/',
      tableNumber: 'https://www.canva.com/',
      placeCard: 'https://www.canva.com/',
      welcomeSign: 'https://www.canva.com/',
      thankYou: 'https://www.canva.com/',
    },
    botanical: {
      saveTheDate: 'https://www.canva.com/',
      invitation: 'https://www.canva.com/',
      rsvp: 'https://www.canva.com/',
      details: 'https://www.canva.com/',
      program: 'https://www.canva.com/',
      menu: 'https://www.canva.com/',
      tableNumber: 'https://www.canva.com/',
      placeCard: 'https://www.canva.com/',
      welcomeSign: 'https://www.canva.com/',
      thankYou: 'https://www.canva.com/',
    },
    garden: {
      saveTheDate: 'https://www.canva.com/',
      invitation: 'https://www.canva.com/',
      rsvp: 'https://www.canva.com/',
      details: 'https://www.canva.com/',
      program: 'https://www.canva.com/',
      menu: 'https://www.canva.com/',
      tableNumber: 'https://www.canva.com/',
      placeCard: 'https://www.canva.com/',
      welcomeSign: 'https://www.canva.com/',
      thankYou: 'https://www.canva.com/',
    },
  },

  // Download links printed in the START HERE guide (Etsy allows 5 files per
  // listing; put the big files on Google Drive / Dropbox and link them here
  // if you need more room). Leave as-is to say "included in your download".
  downloads: {
    spreadsheetCopyLink: '', // optional: Google Sheets "make a copy" link (…/copy)
  },
};
