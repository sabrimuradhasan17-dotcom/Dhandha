# La Bhutanz: SEO and Build Plan

> Status: the live site (bhutanz.com) could not be crawled from the build environment (network blocked). Items marked **[verify]** must be checked against the real site before launch.

## 1. Competitors (from web research)
SOTC, Thrillophilia, PickYourTrail, Heavenly Bhutan, TourRadar. Typical listing: 7N/6D packages at about INR 28,500 to 60,000, from about INR 33,900 pp, inclusive of stays, meals, transfers, permits, plus the Indian-tourist SDF (about INR 1,200/night **[verify current rate]**).

**Where La Bhutanz can win:** big aggregators sell generic packages. La Bhutanz is a Bhutan-only specialist with custom itineraries, so target specific, high-intent, long-tail searches.

## 2. Keyword clusters
- Money: "Bhutan tour packages from Mumbai", "Bhutan packages from India", "Bhutan 6 nights 7 days package price"
- Places: Paro Tiger's Nest trek, Punakha Dzong, Gangtey, Bumthang
- Events: Paro Tshechu dates, Thimphu Tshechu dates (seasonal, high intent)
- Practical: Bhutan permit for Indians, SDF fee, best time to visit, flights to Paro
- Niche: Bhutan meditation retreat, Bhutan family trip, Bhutan honeymoon

## 3. Technical SEO checklist (Next.js)
- Server-rendered pages, real URLs (/tours/slug), no hash routing (the preview uses hash routing only for demo convenience)
- Unique title and meta description per page, editable from admin
- JSON-LD: TravelAgency, TouristTrip, Product/Offer (INR price), FAQPage, BreadcrumbList, Review (real reviews only)
- sitemap.xml generated from database, robots.txt, canonical tags, Open Graph
- 301 redirect map from every old URL **[needs crawl]**
- Core Web Vitals: next/image, WebP/AVIF, lazy loading, font subsetting
- Alt text on every image, descriptive file names
- Google Business Profile (Mumbai), Search Console, GA4, WhatsApp click events
- Content: one landing page per destination and per tour, a blog (festival dates, permit guide, packing list), FAQ

## 4. Admin panel (Supabase)
Roles: **owner** (everything, users, delete, settings) and **staff** (edit tours, dates, prices, flights, enquiries).
Tables: tours, tour_dates, flights, enquiries, profiles, audit_log. Row Level Security by role. Price changes written to audit_log. Public pages revalidate on save.
Phase 2 options: SEO fields per page, blog editor, live flight availability API.

## 5. Open items
- Real WhatsApp number, logo, brand colours, licence/GST details
- Licensed free photos (Unsplash/Pexels/Wikimedia) were unreachable from the build environment; placeholders are used
- Real tours, prices and copy from the existing site
