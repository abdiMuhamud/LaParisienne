# La Parisienne · Restaurant & Pastry — website

A static site with no build step. Serve the folder with any static server (for example `npx serve .`), or deploy it to Vercel or Netlify.

## Structure
- `index.html`: the page
- `css/style.css`, `css/order.css`: styles
- `js/main.js`: logo spin intro, smooth scroll (Lenis), scroll animation (GSAP)
- `js/order.js`: menu, order bag, checkout, table and cake reservations → WhatsApp
- `js/data.js`: **edit this file** for branches, WhatsApp numbers, menu, prices and opening hours
- `assets/logo/*.png`: the real logo cut into masks (wordmark, Eiffel tower, banner) for the reveal
- `assets/*.jpg`: photos from the La Parisienne Facebook page

## Check with La Parisienne before going live
1. **Menu and prices** in `js/data.js` are placeholders.
2. **WhatsApp numbers**: each order goes to the WhatsApp number of the branch the customer picks
   (Kairaba 766 0676, Brusubi 203 0133, Brikama 203 0300, all from their Facebook cover).
   Make sure every number has WhatsApp.
3. **Opening hours** (`OPEN_FROM` / `OPEN_UNTIL`) set the time slots.
4. Branch addresses and map links.
