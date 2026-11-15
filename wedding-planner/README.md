# The Wedding Planner: digital product for Etsy

A complete wedding planning bundle generated from code:

- **Planner**: 116 pages, digital (hyperlinked tabs) + printable (US Letter & A4)
- **Invitation suite**: 30 designs (3 styles × 10 pieces), print-size PDFs for Canva import
- **Spreadsheet**: budget, guests, RSVPs, vendors, seating, checklist, dashboard
- **Vendor directory**: static site in `site/`, data in `site/vendors.json`
- **Etsy listing images**: 8 × 2700×2025 PNG
- **START HERE** buyer guide with all links

Seller instructions (Hebrew): [`SELLER-GUIDE.he.md`](SELLER-GUIDE.he.md)

```bash
npm install
npm run all        # build → dist/, upload-ready files → dist/Etsy-Upload/
```

Edit `build/config.js` (brand, Canva links, directory URL) before the final build.
Content lives in `build/content.js` (checklists, vendor questions) and `build/planner.js` (pages).
