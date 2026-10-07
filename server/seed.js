// Builds the first-run database from the content of the old bhutanz.com plus sensible defaults.
const old = require('./old-content.json');

const clean = s => String(s || '').replace(/ /g, ' ').replace(/^[·\s]+/, '').replace(/\s+/g, ' ').trim();
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// Prices are SAMPLES (INR per person) until the owner confirms them in Admin → Packages.
const META = [
  ['fly-4n5d', 'fly', 'Fly In Fly Out', 4, 5, 32000, true],
  ['fly-5n6d', 'fly', 'Fly In Fly Out', 5, 6, 39000, true],
  ['fly-6n7d', 'fly', 'Fly In Fly Out', 6, 7, 46000, false],
  ['fly-7n8d', 'fly', 'Fly In Fly Out', 7, 8, 53000, false],
  ['drive-6n7d', 'drive', 'Drive In Drive Out', 6, 7, 29000, false],
  ['drive-7n8d', 'drive', 'Drive In Drive Out', 7, 8, 34000, false],
  ['meditation-7n8d', 'special', 'Meditation Tour', 7, 8, 58000, true],
  ['explore-10n11d', 'special', 'Explore Bhutan', 10, 11, 72000, true],
  ['photography-12n13d', 'special', 'Photography Tour', 12, 13, 105000, false],
  ['last-shangri-la-9n10d', 'fixed', 'The Last Shangri-La', 9, 10, 89000, true],
  ['thunder-dragon-6n7d', 'fixed', 'Land of the Thunder Dragon', 6, 7, 62000, true]
];
const SUMMARY = {
  'fly-4n5d': "A comfortable first introduction to Bhutan — Tiger's Nest, Thimphu and the Dochula Pass to Punakha.",
  'fly-5n6d': 'Thimphu, Punakha and Paro at an unhurried pace, with a night in Punakha and a full Tiger\'s Nest day.',
  'fly-6n7d': 'Adds the glacial Phobjikha (Gangtey) valley and views of central Bhutan to the western highlights.',
  'fly-7n8d': 'A relaxed western Bhutan journey with time to explore Punakha and Paro valleys at leisure.',
  'drive-6n7d': 'Enter overland from Bagdogra / NJP via Phuentsholing and watch the landscape change.',
  'drive-7n8d': 'The overland route with an added night in Punakha via the Dochula Pass.',
  'meditation-7n8d': 'A contemplative journey through sacred monasteries, meditation centres and peaceful valleys.',
  'explore-10n11d': 'Cross the Himalayan heartland to Bumthang, the spiritual centre of the kingdom.',
  'photography-12n13d': 'A west-to-east crossing of Bhutan for landscapes, festivals, wildlife and village life.',
  'last-shangri-la-9n10d': 'Group fixed departure from Mumbai with return flights, hot-stone bath, pure-veg & Jain food and a female guide.',
  'thunder-dragon-6n7d': 'Group fixed departure from Mumbai with return flights, hot-stone bath, pure-veg & Jain food and a female guide.'
};
const GENERIC_INC = [
  'Handpicked hotels on twin-sharing basis (category flexible to your budget)',
  'Private vehicle with experienced driver for all transfers and sightseeing',
  'Experienced local English/Hindi-speaking guide',
  'Airport / border pick-up and drop',
  'Assistance with Bhutan Entry Permit, SDF payment and documentation',
  '24×7 on-trip support from La Bhutanz Tours'
];
const GENERIC_EXC = [
  'Sustainable Development Fee (SDF) — Nu. 1,200 per person per night for Indian citizens (children 6–12 half, under 6 free)',
  'Flights / train fare to and from Bhutan (unless the package says flights are included)',
  'Attraction entrance fees, camera fees and activity costs',
  'Travel insurance (mandatory)',
  'Personal expenses — laundry, beverages, tips and anything not listed in inclusions',
  'Costs from natural calamities, landslides, road blockages or strikes, payable on the spot',
  '5% GST on tour services (if not already included in the quoted price)'
];
const FIXED_INC = [
  'Mumbai – Paro – Mumbai return flight ticket',
  'All accommodation in standard 4-star hotels',
  'Only pure-veg and Jain food served',
  'Daily breakfast, lunch (in pure-veg restaurants) and dinner in the hotels',
  'Snacks / munching on the route and during sightseeing',
  'Daily 1-litre mineral water bottle per person',
  'One-time traditional Bhutanese hot-stone bath',
  'All transfers and sightseeing by a well-maintained coaster',
  'Tour conducted by a female guide'
];

function packages() {
  return META.map(([id, category, name, nights, days, price, featured], i) => {
    const key = id.replace(/^(fly|drive)-/, id.startsWith('fly') ? 'fly-' : 'drive-');
    const o = old.tours[id] || old.tours[key] || {};
    const fixed = category === 'fixed';
    return {
      id, slug: id, category, name, nights, days, price, singleSupplement: 0,
      stay: clean(o.stay) || '', summary: SUMMARY[id],
      intro: fixed ? 'A scheduled group departure from Mumbai with return flights included. Travel with fellow guests, enjoy pure-vegetarian and Jain meals throughout, and let us take care of every detail — from permits to hotels to a female tour guide.' : (o.intro || []).map(clean).join('\n\n'),
      highlights: fixed ? ['Mumbai – Paro – Mumbai return flights included', 'Standard 4-star hotels', 'Pure-veg & Jain meals throughout', 'One-time Bhutanese hot-stone bath', 'Conducted by a female guide', 'Fixed dates with limited seats'] : (o.highlights || []).map(clean),
      itinerary: (o.itinerary || []).map(d => ({ title: clean(d.title), meta: clean(d.meta), desc: clean(d.desc) })),
      inclusions: fixed ? FIXED_INC : GENERIC_INC,
      exclusions: fixed ? ['Attraction entrance fee, camera fees, activity cost', 'Personal expenses (laundry, beverages, tips, etc.)', 'Additional sightseeing or extra use of vehicle other than in the itinerary', 'Costs from natural calamities, landslides, road blockages or strikes, payable on the spot', 'Sustainable Development Fee (SDF) and Bhutan Entry Permit are arranged by us and billed as per actuals'] : GENERIC_EXC,
      ideal: (o.ideal || []).map(clean),
      faqs: (o.faqs || []).map(f => ({ q: clean(f.q), a: clean(f.a) })),
      image: '', flightIncluded: fixed, featured, active: true, order: i, priceConfirmed: false
    };
  });
}

function departures() {
  const out = []; let n = 0;
  const add = (packageId, date, seats, booked, extra = {}) => out.push({
    id: 'd' + (++n), packageId, date, fromCity: 'Mumbai', seats, booked, priceOverride: 0, status: 'open',
    airline: '', flightNo: '', route: extra.route || '', depTime: '', arrTime: '', notes: extra.notes || ''
  });
  ['2026-11-10', '2026-11-24', '2026-12-08', '2027-02-23', '2027-03-09', '2027-03-23', '2027-04-06'].forEach((d, i) => add('last-shangri-la-9n10d', d, 20, [14, 6, 3, 0, 2, 0, 0][i], { route: 'Mumbai → Paro → Mumbai' }));
  ['2026-11-03', '2026-11-17', '2026-12-01', '2027-03-02', '2027-03-16', '2027-04-13'].forEach((d, i) => add('thunder-dragon-6n7d', d, 20, [20, 9, 4, 0, 1, 0][i], { route: 'Mumbai → Paro → Mumbai' }));
  ['2026-10-25', '2026-11-22', '2026-12-20'].forEach((d, i) => add('fly-5n6d', d, 12, [5, 2, 0][i], { notes: 'Private group departure — land package, join us at Paro.' }));
  ['2026-11-15', '2027-03-14'].forEach(d => add('meditation-7n8d', d, 10, 0, { notes: 'Small group, land package.' }));
  return out;
}

const posts = [
  {
    id: 'p1', slug: 'best-time-to-visit-bhutan', title: 'Best time to visit Bhutan', date: '2026-09-15', published: true, image: '',
    excerpt: 'Spring and autumn are the classic seasons — here is how each month feels.',
    body: '<p>The best months for most travellers are <b>March to May</b> and <b>September to November</b>.</p><h3>Spring (March–May)</h3><p>Rhododendrons bloom, the weather is mild and the Paro Tshechu falls in this season.</p><h3>Autumn (September–November)</h3><p>Clear skies, crisp mountain views and major festivals, including Thimphu Tshechu. This is also the busiest period, so book flights and hotels early.</p><h3>Winter &amp; Summer</h3><p>Winter is cold but sunny and quiet, and the Black-Necked Crane Festival in Phobjikha is a highlight. Summer is lush and green with monsoon rain.</p><p>Not sure when to go? <a href="/contact">Ask our team</a> and we will suggest dates for your interests.</p>'
  },
  {
    id: 'p2', slug: 'sdf-explained-for-indian-travellers', title: 'Bhutan SDF explained for Indian travellers', date: '2026-09-22', published: true, image: '',
    excerpt: 'What the Sustainable Development Fee is, what it costs and how it is paid.',
    body: '<p>Every visitor to Bhutan pays a <b>Sustainable Development Fee (SDF)</b> that supports conservation, education and the tourism infrastructure of the kingdom.</p><ul><li>Indian visitors pay <b>Nu. 1,200 per person per night</b> (the same amount in Indian rupees).</li><li>Children aged 6–12 pay half; children under 6 are exempt.</li><li>It is paid during the permit application. We handle the payment for you.</li></ul><p>For example, an Indian couple staying five nights pays ₹12,000 in total. GST of 5% applies to tour package services but not to the SDF.</p>'
  },
  {
    id: 'p3', slug: 'tigers-nest-hike-guide', title: "Tiger's Nest (Paro Taktsang) hike — what to expect", date: '2026-10-01', published: true, image: '',
    excerpt: 'Moderate fitness, a gentle pace and a café viewpoint if you prefer not to climb all the way.',
    body: '<p>Perched on a cliff roughly 900 metres above Paro valley, Taktsang is Bhutan\'s most famous monastery. The hike takes a few hours and needs moderate fitness.</p><h3>Tips</h3><ul><li>Start early, wear sturdy shoes and carry water.</li><li>Take it slowly — you are walking at altitude.</li><li>Prefer a gentler day? Walk to the café viewpoint for a superb view of the monastery.</li></ul><p>Every La Bhutanz itinerary reserves a dedicated day for Tiger\'s Nest.</p>'
  }
];

const TERMS = '<p><i>These are starter terms. Please review them with the owner before relying on them.</i></p><h3>Booking &amp; payment</h3><p>A booking is confirmed once the advance amount is received and acknowledged in writing. The balance is payable before departure on the date communicated by La Bhutanz Tours.</p><h3>Cancellation &amp; refunds</h3><p>Cancellation charges depend on how close to departure the booking is cancelled and on non-refundable costs already paid to airlines, hotels and the Bhutan authorities (including the SDF). The applicable schedule is shared with every quotation.</p><h3>Itinerary changes</h3><p>Sightseeing may be re-ordered or changed because of weather, road conditions, festivals or government directives. Costs arising from natural calamities, landslides, road blockages or strikes are borne by the guest.</p><h3>Travel documents &amp; insurance</h3><p>Guests must carry valid identity documents and travel insurance. Entry into Bhutan is at the discretion of immigration officials.</p>';
const PRIVACY = '<p><i>Starter policy — please review before launch.</i></p><p>We collect the details you submit in enquiry forms (name, phone, email, travel plans) only to respond to you, prepare quotations and arrange your trip. We do not sell your data. We may share necessary details with hotels, airlines and the Bhutan authorities to arrange your journey. To ask us to delete your data, email <a href="mailto:tours@bhutanz.com">tours@bhutanz.com</a>.</p>';

module.exports = function seed() {
  const pages = Object.entries(old.pages).map(([slug, p]) => ({ id: 'pg-' + slug, slug, title: p.title, html: p.html, published: true }));
  pages.push({ id: 'pg-terms', slug: 'terms', title: 'Terms & Cancellation Policy', html: TERMS, published: true });
  pages.push({ id: 'pg-privacy', slug: 'privacy', title: 'Privacy Policy', html: PRIVACY, published: true });
  return {
    version: 2,
    settings: {
      brand: 'La Bhutanz Tours', tagline: 'Exceptional · Explorable · Experience',
      heroTitle: 'Personalised Bhutan journeys, crafted by local experts',
      heroSub: 'Land packages, fixed departures and private journeys for travellers from Mumbai and across India — permits, hotels, guides and logistics handled end to end.',
      whatsapp: '919324455999', phone: '+91 98203 89595', emails: ['tours@bhutanz.com', 'bhutanztours@gmail.com'],
      address: '14, Kapeesh Mall, 1st Floor, M. G. Road, Mulund (West), Mumbai 400080, Maharashtra, India',
      hours: 'Mon–Fri 11:00 AM – 6:00 PM · Sat & Sun closed', siteUrl: '', logo: '', favicon: '',
      sdfINR: 1200, gstPct: 5, gstIncluded: false, showPrices: true, advanceInfo: 'A booking advance confirms your seats. The balance is due before departure.',
      payment: { upiId: '', accountName: '', bank: '', accountNo: '', ifsc: '', note: '' },
      announcement: { enabled: true, text: 'Autumn & spring departures from Mumbai are filling fast — message us on WhatsApp for live availability.' },
      social: { instagram: 'https://www.instagram.com/labhutanz/', facebook: 'https://www.facebook.com/Bhutanztours/', youtube: 'https://www.youtube.com/@bhutanztours681', tripadvisor: 'https://www.tripadvisor.com/Attraction_Review-g304554-d34595555-Reviews-La_Bhutanz_Tours-Mumbai_Maharashtra.html', trustpilot: 'https://www.trustpilot.com/review/bhutanz.com', linkedin: 'https://www.linkedin.com/in/la-bhutanz-tours-001294420' },
      seo: { title: 'La Bhutanz Tours — Bhutan Tour Packages from Mumbai', description: 'Personalised Bhutan tour packages, fixed departures and private journeys from Mumbai. Permits, hotels, guides and SDF handled for you.' }
    },
    packages: packages(), departures: departures(),
    faqs: old.faqs.map((f, i) => ({ id: 'f' + i, q: clean(f.q), a: clean(f.a), order: i, active: true })),
    testimonials: [], posts, pages, enquiries: []
  };
};
