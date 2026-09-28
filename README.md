# Al-Elahi Travels — Website

Website for **Al-Elahi Travels** — daily Umrah bus service from Riyadh to Makkah & Madinah, plus Umrah packages from Pakistan.

Built from the requirements document `Al-Elahi-Travels-Website-Requirements-v3.docx`.

---

## 1. How to open the site

Just double-click **`index.html`**.

No build step, no server and no internet connection is required — all images, styles and scripts are stored locally.

To share it online, upload the whole folder to any web host (Netlify, Vercel, GitHub Pages, cPanel, etc.). The home page must stay named `index.html`.

---

## 2. Pages

| File | Page | Contents |
|---|---|---|
| `index.html` | Home | Hero banner, intro, Why Choose Us, package preview, routes, gallery preview, reviews, FAQ, call-to-action |
| `packages.html` | Packages | 10 Riyadh packages + 7 Pakistan packages, all with **Book Now** → booking form |
| `about.html` | About Us | About text, Our Services, Why Trust Us, location + Google Map |
| `gallery.html` | Gallery | Our Buses · Hotels · Holy Places with category filter and image lightbox |
| `contact.html` | Contact Us | Phone/WhatsApp, location, inquiry form, how-to-book guide, Google Map |

---

## 3. Business details used on the site

| Item | Value |
|---|---|
| Phone / WhatsApp | **+966 53 632 1755** (primary) |
| Phone 2 | **+966 55 145 7823** |
| Location | Shamsia Building, Batha, Old Saptco Bus Station, Riyadh, Saudi Arabia |
| Google Maps place | Al - ELAHI TRAVELS — `24.6430954, 46.7139238` |
| Facebook | https://www.facebook.com/share/184K1dMvXa/ |

Google Maps is embedded live on `about.html` and `contact.html`, pinned to the business coordinates.

> **No prices are displayed anywhere on the website**, exactly as the requirements asked. Every package says *"Rate on request"* and the enquiry is confirmed on WhatsApp.

---

## 4. The booking form (Book Now)

Every **Book Now** button opens a popup form with these fields:

1. Full Name *(required)*
2. Travel Date *(required)*
3. Iqama / ID Number
4. Mobile Number / WhatsApp *(required)*
5. Number of People — Men + Women with **+ / −** steppers, total calculated automatically
6. Bus Type — VIP Bus / Normal Bus
7. Hotel Preference — 3 Star / 4 Star / 5 Star / No Hotel (sirf bus)
8. Destination Preference — Makkah Only / Madinah Only / Makkah + Madinah
9. Package Selected — filled in automatically from the package you clicked
10. Additional Message *(optional)*

On submit, the form:
- opens **WhatsApp** with all the details neatly pre-written, and
- shows the thank-you message **"Shukriya! Hum jald aap se contact karenge."**

---

## 5. Changing the WhatsApp number or phone numbers

Open **`js/main.js`** and edit the block at the top:

```js
var CONFIG = {
  whatsapp: "966536321755",      // <-- WhatsApp number, country code + number, NO + or spaces
  whatsappAlt: "966551457823",
  phonePrimary: "+966 53 632 1755",
  phoneAlt: "+966 55 145 7823",
  ...
};
```

The `whatsapp` value is the number that receives all bookings, so this is the **only** place you need to change for the form to go to a different number.

The phone numbers written in the header, footer and Contact page are plain HTML — search for `+966536321755` in the `.html` files to replace them everywhere.

---

## 6. Replacing the photos with your own (Facebook / Google)

The requirements asked to use images from the Facebook page and the Google Maps listing. Facebook photo albums sit behind a login wall and Google Maps photos are served by a script-only viewer, so those files can't be downloaded automatically. The site therefore ships with **high-quality placeholder photographs** of the Kaaba, Masjid an-Nabawi and coaches.

**To swap in your real photos, just overwrite these files** (keep the exact same file names — nothing else needs changing):

```
assets/img/places/kaaba.jpg              ← Kaaba / Masjid al-Haram
assets/img/places/masjid-al-haram.jpg    ← Tawaf / Haram wide shot
assets/img/places/haram-aerial.jpg       ← Masjid al-Haram aerial view
assets/img/places/masjid-an-nabawi.jpg   ← Masjid an-Nabawi
assets/img/places/green-dome.jpg         ← Green Dome (portrait, tall crop)
assets/img/places/mosque-dusk.jpg        ← any wide mosque photo

assets/img/buses/vip-bus.jpg             ← your VIP bus
assets/img/buses/coach-bus.jpg           ← your normal coach bus
assets/img/buses/coach-interior.jpg      ← bus interior

assets/img/hotels/hotel-3star.jpg        ← 3 star room
assets/img/hotels/hotel-4star.jpg        ← 4 star room
assets/img/hotels/hotel-5star.jpg        ← 5 star / Clock Tower area
```

Recommended sizes:

| Folder | Size | Notes |
|---|---|---|
| `places` | 1600 × 1067 | landscape |
| `places/green-dome.jpg` | 1000 × 1500 | portrait |
| `buses` | 1400 × 933 | landscape |
| `hotels` | 1200 × 800 | landscape |

Save as **JPG**. You can also add new gallery photos by copying a `<figure class="gal-item">` block in `gallery.html` and keeping `data-cat="buses"` / `"hotels"` / `"places"` so the filter buttons keep working. Give each new item a unique `alt` and `figcaption`.

The **logo** lives at `assets/logo.jfif` and is used in the header, footer and as the browser tab icon.

---

## 7. Where the site is designed to be edited

| I want to change… | File |
|---|---|
| Colours, fonts, spacing, layout | `css/style.css` (all colours are variables at the very top) |
| Menu, phone numbers, footer | any `.html` file — the header and footer are repeated on each page |
| Packages, titles, routes | `packages.html` (each package is an `<article class="pkg">`) |
| Booking logic, WhatsApp message format | `js/main.js` |
| FAQ questions | `index.html`, the `<details class="faq-item">` blocks |
| Reviews | `index.html`, the `<article class="quote">` blocks |

The whole site is built from one stylesheet, `css/style.css`. Every colour, font,
radius and space value is declared once at the very top in `:root`, so the design
can be retuned without touching any other rule.

#### Brand colours — taken from the logo

The logo is a **red circular emblem with black text, white accents and a gold
Kaaba**, so the palette below was sampled directly from `assets/logo.jfif` rather
than picked by hand. That is why nothing on the site fights the logo.

```css
/* ink — text and dark sections */
--ink:      #0E0E10;   /* near-black, headings + dark sections */
--ink-600:  #3D3D44;   /* body copy                     */
--ink-400:  #82828C;   /* muted / meta copy             */

/* brand red — the logo red */
--brand:     #C3111A;  /* buttons, links, accents       */
--brand-700: #8B0A11;  /* pressed / darker red          */

/* gold — the Kaaba gold */
--gold:      #B08B2E;  /* fine hairlines and labels on dark */

/* paper — warm off-whites */
--paper:    #FFFFFF;   /* page background               */
--paper-2:  #FAF7F2;   /* alternating sections          */
--paper-3:  #F1EBE1;   /* borders, image frames         */
```

#### Typography

Three Google Fonts, loaded with a single `<link>` in every page:

| Role | Font | Used for |
|---|---|---|
| Display | **Instrument Serif** | page and section headings |
| Body / UI | **Instrument Sans** | paragraphs, buttons, forms, nav |
| Labels | **IBM Plex Mono** | eyebrows, numbers, tags, small caps meta |

#### Layout devices

A few deliberate choices separate this from an off-the-shelf template — worth
knowing about before you edit, because they are structural, not decorative:

- **Ruled entries instead of cards.** Content blocks (`.card`, `.info-item`,
  `.stat`, `.faq-item`) are separated by 1px hairlines and whitespace — there are
  no boxes, no drop shadows and no rounded tiles.
- **Boxed cards only where a real choice is being made.** The package cards
  (`.pkg`) are the one place a bordered box is used, because the user is picking
  between them. On the home page they get the `.pkg--feature` treatment —
  `.pkg-feature-grid` lays out two, with a hairline cap that turns red on hover
  and a full-width primary button. The package list on `packages.html` uses the
  same `.pkg` box at list size, so both pages feel like one system.
- **Section calls to action sit under a hairline.** `.section-cta` puts a rule
  across the column and centres one secondary button beneath it — used for
  "See All Packages", "Open Full Gallery" and the contact-page WhatsApp link.
- **Numbered section headings.** `.section-head` increments a CSS counter and the
  `.eyebrow` prints it as `01`, `02`, `03`… in mono, followed by a hairline that
  runs to the edge of the column. Adding or reordering a section renumbers
  everything automatically.
- **Tight radii.** `2px` / `4px` / `6px` only — no pill-shaped buttons.
- **Giant footer wordmark.** A ghosted `Al-Elahi Travels` set in the display serif
  behind the footer columns (`.footer-wordmark`).
- **Scroll-progress bar.** A 2px red line across the very top of the viewport.
- **A very faint paper grain** (`.028` opacity SVG noise) over the page background.

#### Type scale

```css
--wrap:  1280px;                      /* content width        */
--sect:  clamp(64px, 8vw, 132px);     /* section padding      */
--header-h: 76px;                     /* sticky header height */
```

Body copy is `1rem` with a `1.72` line-height; headings use `clamp()` so they
scale smoothly between phone and desktop instead of jumping at breakpoints.

---

## 8. Features included

- Mobile-friendly on phones, tablets and desktops
- Sticky header that becomes solid on scroll, with a slide-in mobile menu
- **One** WhatsApp button on mobile — the round floating button
- Editorial, rule-based layout with automatically numbered sections
- Animated counters and scroll-reveal effects
- Scroll-progress indicator
- Booking popup with automatic package pre-fill and live passenger total
- Package page with **Riyadh / Pakistan** tabs
- Gallery with category filter and a full-screen lightbox (arrow keys work)
- Live Google Maps embed
- SEO meta tags, Open Graph tags and TravelAgency structured data
- Respects the "reduce motion" accessibility setting
- Print-friendly stylesheet

All visible website text is in **English**.

### Mobile chrome (buttons on a phone)

So the screen is never crowded, the phone layout keeps exactly one floating button:

| Element | On mobile | On desktop |
|---|---|---|
| Header WhatsApp button | hidden | shown |
| Hero / banner "WhatsApp Us" button | hidden | shown |
| Bottom "Call Now" bar | **removed** | — |
| Floating WhatsApp button | **the single round button** | shown with a "WhatsApp" label |

There is no Call button in the mobile menu either. The phone numbers are still
easy to find as normal content — in the footer on every page, and on the
**Contact** page.

The footer social icon and the inline "message us on +966…" links inside body text are normal content links and stay.

### Mobile menu (hamburger)

Tapping the menu opens a slide-in panel with:

- an uppercase mono **Menu** label and a **✕ close button** in the top-right
- the five nav links as hairline-separated rows, each with its own icon and a chevron
- staggered slide-in animation, with the current page picked out in brand red
- a full-width red **Book Now** button
- a **Head Office** footer with the address and service hours

The menu closes with the ✕ button, the backdrop, the **Esc** key, or by picking
a link.

### Responsive breakpoints

The layout is tuned for every screen size. Gallery tiles are arranged so that a
row is **always filled edge to edge** — there are never empty holes next to a
wide photo.

| Screen width | Gallery columns | Layout notes |
|---|---|---|
| 1081px and up | 4 | wide tiles span 2 columns |
| 1081px – 621px | 2 | wide tiles span the full row |
| 620px and below | 1 | menu button stays reachable, brand text shrinks |
| 420px and below | 1 | logo and brand text shrink further |

Verified 320, 360, 390, 414, 480, 620, 768, 900, 1024, 1200 and 1440px across all
five pages: no empty holes, no broken images and no sideways scrolling.

---

## 9. Image credits

The placeholder photos are freely licensed. Replace them with your own photos to remove this notice.

| File | Source | Licence | Credit |
|---|---|---|---|
| `places/masjid-al-haram.jpg` | Wikimedia Commons | CC BY 2.0 | Basheer Olakara |
| `places/kaaba.jpg` | Wikimedia Commons | GFDL | Betaneik (Persian Wikipedia) |
| `places/haram-aerial.jpg` | Wikimedia Commons | CC0 | Wurzelgnohm |
| `places/masjid-an-nabawi.jpg` | Wikimedia Commons | CC BY 4.0 | Meshari Alawfi |
| `places/green-dome.jpg` | Wikimedia Commons | GFDL 1.2 | Muhammad Mahdi Karim |
| `hotels/hotel-5star.jpg` | Wikimedia Commons | CC0 | SilverBullet X |
| `buses/coach-interior.jpg` | Wikimedia Commons | CC BY-SA 2.0 | Atomic Taco |
| `places/mosque-dusk.jpg`, `buses/vip-bus.jpg`, `buses/coach-bus.jpg`, `hotels/hotel-3star.jpg`, `hotels/hotel-4star.jpg` | Unsplash | Unsplash License | Unsplash contributors |
| `assets/logo.jfif` | Supplied by Al-Elahi Travels | — | — |
