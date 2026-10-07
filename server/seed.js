// Builds the first-run database from the content of the old bhutanz.com plus sensible defaults.
const fs = require('fs'), path = require('path');
const old = require('./old-content.json');
const IMG = path.join(__dirname, '..', 'public', 'img', 'packages');
const has = f => fs.existsSync(path.join(IMG, f));

const clean = s => String(s || '').replace(/ /g, ' ').replace(/^[·\s]+/, '').replace(/\s+/g, ' ').trim();
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// Prices start at 0 = "Price on request" on the site. The owner enters real INR per-person prices in Admin → Packages.
const META = [
  ['fly-4n5d', 'fly', 'Fly In Fly Out', 4, 5, 0, true],
  ['fly-5n6d', 'fly', 'Fly In Fly Out', 5, 6, 0, true],
  ['fly-6n7d', 'fly', 'Fly In Fly Out', 6, 7, 0, false],
  ['fly-7n8d', 'fly', 'Fly In Fly Out', 7, 8, 0, false],
  ['drive-6n7d', 'drive', 'Drive In Drive Out', 6, 7, 0, false],
  ['drive-7n8d', 'drive', 'Drive In Drive Out', 7, 8, 0, false],
  ['meditation-7n8d', 'special', 'Meditation Tour', 7, 8, 0, true],
  ['explore-10n11d', 'special', 'Explore Bhutan', 10, 11, 0, true],
  ['photography-12n13d', 'special', 'Photography Tour', 12, 13, 0, false],
  ['last-shangri-la-9n10d', 'fixed', 'The Last Shangri-La', 9, 10, 0, true],
  ['thunder-dragon-6n7d', 'fixed', 'Land of the Thunder Dragon', 6, 7, 0, true],
  ['discover-10n11d', 'special', 'Discover Bhutan', 10, 11, 0, false]
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
  'thunder-dragon-6n7d': 'Group fixed departure from Mumbai with return flights, hot-stone bath, pure-veg & Jain food and a female guide.',
  'discover-10n11d': 'A 10-night Bhutan discovery journey. Itinerary coming soon — enquire for details.'
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
      image: has(id + '-banner.jpg') ? '/img/packages/' + id + '-banner.jpg' : '',
      poster: has(id + '-poster.jpg') ? '/img/packages/' + id + '-poster.jpg' : '',
      imageHasTitle: !fixed,
      flightIncluded: fixed, featured, active: id !== 'discover-10n11d', order: i, priceConfirmed: false
    };
  });
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

const ABOUT = '<p>La Bhutanz Tours specialises in personalised Bhutan journeys for travellers from Mumbai, Thane, Navi Mumbai and across India, along with NRI and international travellers seeking authentic, meaningful and luxury experiences in the Kingdom of Bhutan.</p><p>Bhutan is one of the world\'s most peaceful and inspiring travel destinations. Nestled in the Eastern Himalayas, the Kingdom is renowned for its breathtaking mountain landscapes, ancient monasteries, vibrant festivals and rich Buddhist heritage.</p><p>From the iconic Tiger\'s Nest Monastery in Paro and the cultural charm of Thimphu to the scenic valleys of Punakha, Gangtey and Bumthang, Bhutan offers travellers a rare opportunity to experience authentic Himalayan culture, untouched natural beauty and meaningful moments of tranquility.</p><p>At La Bhutanz Tours, we create personalised Bhutan journeys thoughtfully designed around your interests, travel style and preferred pace. Whether you are planning a family holiday, honeymoon, cultural tour, photography expedition, wellness retreat or private group journey, every itinerary is carefully curated to create meaningful and memorable experiences in Bhutan.</p><p>We believe every traveller experiences Bhutan differently. Instead of offering one-size-fits-all itineraries, we take the time to understand what matters most to you and recommend experiences that match your expectations. From peaceful monasteries and scenic valleys to colourful festivals, Himalayan landscapes and authentic Bhutanese culture, every journey is planned with attention to comfort, flexibility and genuine local experiences.</p><p>From your first enquiry to your return journey, our team is here to guide you every step of the way. We assist with itinerary planning, accommodation selection, transportation arrangements, permits and travel guidance, working closely with trusted local partners to ensure your Bhutan journey is seamless, comfortable and memorable.</p><p>Whether you are visiting Bhutan for the first time or returning to explore more of the Kingdom of Happiness, La Bhutanz Tours is committed to helping you travel with confidence through personalised planning, trusted local expertise and thoughtfully curated Bhutan journeys.</p><h3>Why choose La Bhutanz Tours</h3><ul><li>Personalized Bhutan journeys tailored to your interests and travel style</li><li>Flexible itineraries for couples, families, solo travelers and private groups</li><li>Local destination expertise across Paro, Thimphu, Punakha, Gangtey and Bumthang</li><li>Assistance with Bhutan permits, travel planning and documentation</li><li>Handpicked hotels, comfortable transportation and dependable local support</li><li>Cultural, spiritual, photography, festival and adventure experiences</li><li>Dedicated assistance before, during and after your journey</li><li>Private departures and personalised holidays designed around your preferred travel dates, interests and pace</li></ul>';

module.exports = function seed() {
  const pages = Object.entries(old.pages).map(([slug, p]) => ({ id: 'pg-' + slug, slug, title: p.title, html: p.html, published: true }));
  pages.push({ id: 'pg-about-us', slug: 'about-us', title: 'About La Bhutanz Tours', html: ABOUT, published: true });
  pages.push({ id: 'pg-terms', slug: 'terms', title: 'Terms & Cancellation Policy', html: TERMS, published: true });
  pages.push({ id: 'pg-privacy', slug: 'privacy', title: 'Privacy Policy', html: PRIVACY, published: true });
  return {
    version: 2,
    settings: {
      brand: 'La Bhutanz Tours', tagline: 'Exceptional · Explorable · Experience',
      heroTitle: 'Personalised Bhutan Journeys Crafted by Local Travel Experts',
      heroSub: 'La Bhutanz Tours specialises in personalised Bhutan journeys for travellers from Mumbai, Thane, Navi Mumbai and across India, along with NRI and international travellers seeking authentic, meaningful and luxury experiences in the Kingdom of Bhutan.',
      whatsapp: '919324455999', phone: '+91 98203 89595', emails: ['tours@bhutanz.com', 'bhutanztours@gmail.com'],
      address: '14, Kapeesh Mall, 1st Floor, M. G. Road, Mulund (West), Mumbai 400080, Maharashtra, India',
      hours: 'Mon–Fri 11:00 AM – 6:00 PM · Sat & Sun closed', siteUrl: '', logo: '/img/logo.png', favicon: '/img/favicon.png', ogImage: '/img/og.jpg',
      documents: ['Passport (minimum 6 months validity) or voter ID card for adults', 'Passport (minimum 6 months validity) or birth certificate for children', 'Recent passport-size photograph', 'Valid travel insurance', 'Details of the number of times each guest has visited Bhutan', 'Please send these at the time of booking confirmation'],
      sdfINR: 1200, gstPct: 5, gstIncluded: false, showPrices: true, advanceInfo: 'A booking advance confirms your seats. The balance is due before departure.',
      payment: { upiId: '', accountName: '', bank: '', accountNo: '', ifsc: '', note: '' },
      announcement: { enabled: true, text: 'Planning Bhutan? Message us on WhatsApp for personalised itineraries, travel dates and availability.' },
      social: { instagram: 'https://www.instagram.com/labhutanz/', facebook: 'https://www.facebook.com/Bhutanztours/', youtube: 'https://www.youtube.com/@bhutanztours681', tripadvisor: 'https://www.tripadvisor.com/Attraction_Review-g304554-d34595555-Reviews-La_Bhutanz_Tours-Mumbai_Maharashtra.html', trustpilot: 'https://www.trustpilot.com/review/bhutanz.com', linkedin: 'https://www.linkedin.com/in/la-bhutanz-tours-001294420', pinterest: 'https://in.pinterest.com/labhutanztours/', blog: 'http://labhutanztours.blogspot.com/' },
      seo: { title: 'La Bhutanz Tours — Bhutan Tour Packages from Mumbai', description: 'Personalised Bhutan tour packages, fixed departures and private journeys from Mumbai. Permits, hotels, guides and SDF handled for you.' }
    },
    packages: packages(), departures: [], // add real departures in Admin → Departures & flights
    faqs: old.faqs.map((f, i) => ({ id: 'f' + i, q: clean(f.q), a: clean(f.a), order: i, active: true })),
    testimonials: [], posts, pages, enquiries: []
  };
};
