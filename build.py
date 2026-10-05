#!/usr/bin/env python3
"""Static site generator for Vedanshi Enterprises. Run: python3 build.py"""
import os
OUT = os.path.dirname(os.path.abspath(__file__))
MAIL = "vedanshienterprises2804@gmail.com"
P1, P1T = "8058482609", "+91 80584 82609"
P2, P2T = "918401640388", "+91 84016 40388"

SERVICES = [
 dict(slug="transport", file="transport.html", icon="🚚", name="Transport", c="#ffb703",
  tag="Moving your goods safely, on time, every time.",
  intro="Reliable freight and logistics solutions built around your schedule — from a single consignment to regular bulk movement.",
  offers=[("🚛","Full & Part Truck Loads","FTL and PTL options matched to your cargo size and budget."),
          ("📍","Pan-India Movement","Route planning that connects cities, industrial hubs and towns."),
          ("📦","Industrial & Bulk Cargo","Safe handling for materials, machinery and heavy consignments."),
          ("🕒","On-Time Dispatch","Clear pickup windows and proactive delivery updates."),
          ("🛡️","Cargo Care","Careful loading, securing and handling at every stage."),
          ("🤝","Contract Logistics","Dedicated fleet support for recurring business needs.")],
  faq=[("How do I get a transport quote?","Call or WhatsApp us with pickup, drop and cargo details. We respond with a clear quote."),
       ("Do you handle part loads?","Yes, we arrange both full-truck and part-load movement depending on your requirement."),
       ("Can I track my consignment?","We keep you updated through the journey by call or WhatsApp."),
       ("Do you offer regular contracts?","Yes. Share your monthly volume and we will propose a dedicated plan.")]),
 dict(slug="real-estate", file="real-estate.html", icon="🏢", name="Real Estate", c="#34d399",
  tag="Land, property and spaces — handled with transparency.",
  intro="Guidance and dealing across residential, commercial and plot opportunities, with honest advice and clean paperwork support.",
  offers=[("🏡","Residential Properties","Homes, flats and plots that suit your family and budget."),
          ("🏬","Commercial Spaces","Shops, offices and warehouse spaces for your business."),
          ("🗺️","Land & Plots","Verified land opportunities for investment or construction."),
          ("🔑","Buy · Sell · Rent","End-to-end support for every kind of property transaction."),
          ("📑","Documentation Help","Guidance on paperwork, checks and registration steps."),
          ("📈","Investment Advice","Straightforward insight on location and long-term value.")],
  faq=[("Do you help with both buying and selling?","Yes — we assist buyers, sellers, landlords and tenants."),
       ("Can you find commercial or warehouse space?","Yes. Tell us your size, location and budget and we will shortlist options."),
       ("Do you assist with documentation?","We guide you through the paperwork and coordinate the next steps."),
       ("How do I list my property?","Contact us with the details and photos and we will take it from there.")]),
 dict(slug="telecom", file="telecom.html", icon="📡", name="Telecom", c="#22d3ee",
  tag="Connectivity infrastructure that keeps India talking.",
  intro="Telecom support services covering network infrastructure, site support and field operations for dependable connectivity.",
  offers=[("🗼","Tower & Site Support","Site-level assistance for telecom infrastructure."),
          ("🔌","Infrastructure Services","Installation and maintenance support for network setups."),
          ("🧰","Field Operations","Trained field teams for deployment and upkeep."),
          ("📶","Network Support","Help keeping connectivity stable and issues resolved fast."),
          ("🔧","Maintenance Contracts","Planned preventive care to reduce downtime."),
          ("📞","Telecom Solutions","Practical solutions tailored for businesses and sites.")],
  faq=[("What telecom services do you provide?","Infrastructure, site support, field operations and maintenance assistance."),
       ("Do you work with businesses?","Yes, we support business and site-based telecom requirements."),
       ("Is maintenance available on contract?","Yes, we offer planned maintenance arrangements."),
       ("How quickly can you respond?","Share your location and requirement and we will confirm timelines promptly.")]),
 dict(slug="packaging", file="packaging.html", icon="📦", name="Packaging", c="#fb923c",
  tag="Packaging that protects your product and your brand.",
  intro="Durable, practical packaging materials and solutions for shipping, storage and retail — sized to your product.",
  offers=[("📦","Corrugated Boxes","Strong cartons in sizes and grades for every product."),
          ("🎁","Custom Packaging","Boxes and wraps made to fit your product and brand."),
          ("🧴","Protective Materials","Wraps, fillers and cushioning to prevent damage."),
          ("🏭","Industrial Packing","Heavy-duty packaging for machinery and bulk goods."),
          ("🚚","Export-Ready Packing","Packaging prepared to withstand long transit."),
          ("♻️","Eco-Friendly Options","Recyclable materials that reduce waste.")],
  faq=[("Do you supply custom sizes?","Yes, we can supply packaging made to your dimensions."),
       ("Is there a minimum order?","Share your requirement and we will advise on quantities."),
       ("Can packaging carry my branding?","Yes, custom printing and branding options are available."),
       ("Do you deliver?","Yes — and our transport division can help move it to you.")]),
 dict(slug="scrape", file="scrape.html", icon="♻️", name="Scrape", c="#a3e635",
  tag="Turning scrap into value — responsibly.",
  intro="Scrap sourcing, collection and trading for industries and individuals, with fair pricing and responsible handling.",
  offers=[("🔩","Metal Scrap","Iron, steel, aluminium, copper and other ferrous and non-ferrous metals."),
          ("🏗️","Industrial Scrap","Bulk scrap from factories, construction and demolition."),
          ("📄","Paper & Cardboard","Paper waste and used packaging collected in volume."),
          ("⚖️","Fair Weighing & Pricing","Transparent weighing and current market-based rates."),
          ("🚛","Doorstep Pickup","Collection from your site using our own transport."),
          ("🌱","Responsible Recycling","Material channelled into proper recycling streams.")],
  faq=[("What scrap do you buy?","Metals, industrial scrap, paper and cardboard — contact us for specifics."),
       ("Do you collect from my location?","Yes, our transport division arranges pickups."),
       ("How is pricing decided?","Based on material type, quantity and current market rates."),
       ("Do you work with factories?","Yes, we handle regular and bulk industrial scrap.")]),
]


CHIPS = {
 "transport":(["Full Truck Load","Part Load","Container Movement","Heavy Machinery","Industrial Raw Material","FMCG & Retail Goods","Construction Material","Packaged Goods","Scrap Movement","Intra-city Delivery"],["Manufacturing","Construction","Retail & FMCG","Textile","Chemicals","Agriculture"]),
 "real-estate":(["Flats & Apartments","Villas & Bungalows","Residential Plots","Shops & Showrooms","Office Spaces","Warehouses & Godowns","Industrial Land","Agricultural Land","Rental Properties","Resale Properties"],["First-time Buyers","Investors","Businesses","Landlords","NRIs","Builders & Developers"]),
 "telecom":(["Tower Erection Support","Optical Fibre Laying","Site Survey","Equipment Installation","Preventive Maintenance","Network Troubleshooting","Cable & Duct Work","Power & Battery Backup","Site Acquisition Support","Field Manpower"],["Telecom Operators","Tower Companies","ISPs","Enterprises","Industrial Parks","Government Projects"]),
 "packaging":(["3-Ply & 5-Ply Boxes","Corrugated Sheets","Bubble Wrap","Stretch Film","Packing Tape","Foam & EPE Sheets","Pallets & Crates","Printed Cartons","Mailer Boxes","Poly Bags"],["Manufacturers","E-commerce Sellers","Exporters","Textile Units","Food & Pharma","Electronics"]),
 "scrape":(["Iron & Steel","Aluminium","Copper & Brass","Stainless Steel","Industrial Offcuts","Machinery Scrap","Paper & Cardboard","Plastic Scrap","E-waste (Metal Parts)","Demolition Scrap"],["Factories","Construction Sites","Workshops","Offices","Warehouses","Households"]),
}

SCENES = {
"transport":'''<svg class="scene" viewBox="0 0 400 300" role="img" aria-label="Truck on road"><rect x="0" y="236" width="400" height="64" rx="8" fill="#141c30"/><line class="s-dash" x1="0" y1="268" x2="400" y2="268" stroke="#ffb703" stroke-width="4"/><g class="s-truck"><rect x="70" y="120" width="170" height="100" rx="10" fill="#ffb703"/><rect x="80" y="132" width="150" height="8" rx="4" fill="#fb5607" opacity=".6"/><rect x="80" y="150" width="110" height="8" rx="4" fill="#fb5607" opacity=".35"/><path d="M246 150h50l34 36v34h-84z" fill="#fb5607"/><path d="M256 158h34l22 24h-56z" fill="#0b1120" opacity=".75"/><g><circle cx="120" cy="226" r="20" fill="#0b1120"/><circle class="s-wheel" cx="120" cy="226" r="9" fill="none" stroke="#ffb703" stroke-width="4" stroke-dasharray="10 6"/><circle cx="290" cy="226" r="20" fill="#0b1120"/><circle class="s-wheel" cx="290" cy="226" r="9" fill="none" stroke="#ffb703" stroke-width="4" stroke-dasharray="10 6"/></g></g><g fill="#fff" opacity=".12"><circle cx="60" cy="60" r="26"/><circle cx="90" cy="52" r="20"/><circle cx="320" cy="80" r="22"/><circle cx="348" cy="72" r="16"/></g></svg>''',
"real-estate":'''<svg class="scene" viewBox="0 0 400 300" role="img" aria-label="City buildings"><rect y="262" width="400" height="8" fill="#141c30"/><g><rect class="s-bld" x="30" y="140" width="64" height="122" rx="6" fill="#34d399"/><rect class="s-bld" style="animation-delay:.15s" x="106" y="70" width="70" height="192" rx="6" fill="#22d3ee"/><rect class="s-bld" style="animation-delay:.3s" x="188" y="110" width="60" height="152" rx="6" fill="#10b981"/><rect class="s-bld" style="animation-delay:.45s" x="260" y="40" width="74" height="222" rx="6" fill="#0ea5e9"/><rect class="s-bld" style="animation-delay:.6s" x="346" y="150" width="40" height="112" rx="6" fill="#34d399"/></g><g fill="#fff"><rect class="s-win" x="46" y="160" width="12" height="12" rx="2"/><rect class="s-win" style="animation-delay:.6s" x="68" y="190" width="12" height="12" rx="2"/><rect class="s-win" style="animation-delay:1.2s" x="124" y="96" width="12" height="12" rx="2"/><rect class="s-win" style="animation-delay:.3s" x="148" y="130" width="12" height="12" rx="2"/><rect class="s-win" style="animation-delay:1.8s" x="124" y="170" width="12" height="12" rx="2"/><rect class="s-win" style="animation-delay:.9s" x="204" y="136" width="12" height="12" rx="2"/><rect class="s-win" style="animation-delay:2.1s" x="224" y="176" width="12" height="12" rx="2"/><rect class="s-win" style="animation-delay:1.4s" x="278" y="70" width="12" height="12" rx="2"/><rect class="s-win" style="animation-delay:.2s" x="304" y="104" width="12" height="12" rx="2"/><rect class="s-win" style="animation-delay:1s" x="278" y="150" width="12" height="12" rx="2"/><rect class="s-win" style="animation-delay:1.6s" x="304" y="200" width="12" height="12" rx="2"/></g></svg>''',
"telecom":'''<svg class="scene" viewBox="0 0 400 300" role="img" aria-label="Telecom tower"><g fill="none" stroke="#22d3ee" stroke-width="3"><circle class="s-ring" cx="200" cy="90" r="90"/><circle class="s-ring" style="animation-delay:.9s" cx="200" cy="90" r="90"/><circle class="s-ring" style="animation-delay:1.8s" cx="200" cy="90" r="90"/></g><path d="M200 90 150 270M200 90l50 180M168 190h64M180 150h40M158 240h84" stroke="#eef2fa" stroke-width="5" fill="none" stroke-linecap="round"/><circle class="s-pulse" cx="200" cy="84" r="13" fill="#22d3ee"/><rect x="60" y="270" width="280" height="10" rx="5" fill="#141c30"/><g fill="#6366f1"><rect class="s-pulse" x="62" y="214" width="14" height="34" rx="3"/><rect class="s-pulse" style="animation-delay:.2s" x="84" y="198" width="14" height="50" rx="3"/><rect class="s-pulse" style="animation-delay:.4s" x="306" y="214" width="14" height="34" rx="3"/><rect class="s-pulse" style="animation-delay:.6s" x="328" y="198" width="14" height="50" rx="3"/></g></svg>''',
"packaging":'''<svg class="scene" viewBox="0 0 400 300" role="img" aria-label="Stacked boxes"><rect y="262" width="400" height="8" fill="#141c30"/><g class="s-box"><rect x="70" y="170" width="120" height="92" rx="6" fill="#fb923c"/><rect x="118" y="170" width="24" height="92" fill="#fdba74"/></g><g class="s-box" style="animation-delay:-1.3s"><rect x="200" y="140" width="130" height="122" rx="6" fill="#f43f5e"/><rect x="252" y="140" width="26" height="122" fill="#fda4af"/></g><g class="s-box" style="animation-delay:-2.6s"><rect x="120" y="76" width="110" height="86" rx="6" fill="#fdba74"/><rect x="164" y="76" width="22" height="86" fill="#fff" opacity=".6"/></g></svg>''',
"scrape":'''<svg class="scene" viewBox="0 0 400 300" role="img" aria-label="Recycling arrows"><g class="s-rot"><g fill="none" stroke="#a3e635" stroke-width="16" stroke-linecap="round"><path d="M200 50a100 100 0 0 1 86.6 50"/><path d="M286.6 200a100 100 0 0 1-173.2 0" stroke="#14b8a6"/><path d="M113.4 100A100 100 0 0 1 200 50" stroke="#34d399"/></g><g fill="#a3e635"><path d="M300 78l4 48-44-18z"/><path d="M130 232l-46-14 28-40z" fill="#14b8a6"/><path d="M118 62l46 12-30 38z" fill="#34d399"/></g></g><g><rect class="s-pulse" x="160" y="120" width="80" height="60" rx="8" fill="#eef2fa" opacity=".85"/><rect x="172" y="132" width="56" height="8" rx="4" fill="#0b1120"/><rect x="172" y="150" width="36" height="8" rx="4" fill="#0b1120" opacity=".5"/></g></svg>''',
}

def nav(active):
    items = "".join(f'<a href="{s["file"]}">{s["icon"]} &nbsp;{s["name"]}</a>' for s in SERVICES)
    def a(f, label):
        return f'<a href="{f}"{" class=on" if active==f else ""}>{label}</a>'
    dd_on = ' style="color:#fff"' if any(active==s["file"] for s in SERVICES) else ""
    return f'''<nav class="nav" id="nav">{a("index.html","Home")}{a("about.html","About")}
<div class="dd"><button type="button" aria-haspopup="true"{dd_on}>Services ▾</button><div class="dd-menu">{items}</div></div>
{a("contact.html","Contact")}</nav>'''

def page(file, title, desc, theme, body, active=None):
    html = f'''<!doctype html>
<html lang="en" class="no-js"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#060a13">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23fb5607'/%3E%3Ctext x='32' y='45' font-size='36' font-weight='800' text-anchor='middle' fill='%231a0d00' font-family='sans-serif'%3EV%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body data-theme="{theme}">
<div class="curtain" aria-hidden="true"><b>VEDANSHI</b></div>
<div class="progress" aria-hidden="true"><i></i></div>
<header class="hdr"><div class="wrap">
<a class="logo" href="index.html" aria-label="Vedanshi Enterprises home"><span class="mk">V</span><span>VEDANSHI<small>ENTERPRISES</small></span></a>
{nav(active or file)}
<a class="btn" href="contact.html">Get a Quote</a>
<button class="burger" type="button" aria-label="Menu" aria-controls="nav" aria-expanded="false"><i></i></button>
</div></header>
<main>
{body}
</main>
{footer()}
<a class="wa" href="https://wa.me/{P2}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">💬</a>
<script src="assets/js/main.js" defer></script>
</body></html>'''
    open(os.path.join(OUT, file), "w", encoding="utf-8").write(html)

def footer():
    links = "".join(f'<li><a href="{s["file"]}">{s["name"]}</a></li>' for s in SERVICES)
    return f'''<footer><div class="wrap">
<div class="f-grid">
<div><a class="logo" href="index.html"><span class="mk">V</span><span>VEDANSHI<small>ENTERPRISES</small></span></a>
<p style="margin-top:18px;max-width:34ch">Transport · Real Estate · Telecom · Packaging · Scrape — five businesses, one trusted partner.</p></div>
<div><h4>Company</h4><ul><li><a href="index.html">Home</a></li><li><a href="about.html">About Us</a></li><li><a href="contact.html">Contact</a></li></ul></div>
<div><h4>Services</h4><ul>{links}</ul></div>
<div><h4>Get in touch</h4><p>Ahmedabad, Gujarat, India</p><p><a href="mailto:{MAIL}">{MAIL}</a></p><p><a href="tel:+91{P1}">{P1T}</a><br><a href="tel:+{P2}">{P2T}</a></p></div>
</div>
<div class="copy"><span>© <span id="yr">2026</span> Vedanshi Enterprises. All rights reserved.</span><span>Transport • Real Estate • Telecom • Packaging • Scrape</span></div>
</div></footer>'''

def cta(text="Tell us what you need — we'll get back with a clear plan and quote."):
    return f'''<section><div class="wrap"><div class="cta rv"><h2>Let's build something <span class="grad">together</span></h2><p>{text}</p>
<div class="cta-row"><a class="btn" href="contact.html">Send an Enquiry →</a><a class="btn ghost" href="tel:+91{P1}">📞 {P1T}</a></div></div></div></section>'''

def svc_cards(skip=None, half=False):
    out = ""
    for i, s in enumerate(SERVICES):
        if s["slug"] == skip: continue
        w = " w3" if (half or i >= 3) else ""
        out += f'''<a class="card rv{w}" style="--c:{s["c"]};--d:{i*.08}s" href="{s["file"]}"><span class="num">0{i+1}</span><div class="ic">{s["icon"]}</div><h3>{s["name"]}</h3><p>{s["tag"]}</p><span class="more">Explore →</span></a>'''
    return out

def home():
    cards = svc_cards()
    marq = "".join(f'<span>{s["name"]}<b>✦</b></span>' for s in SERVICES) * 2
    words = "".join(f'<span>{w}</span>' for w in ["Transport","Real Estate","Telecom","Packaging","Scrape","Transport"])
    body = f'''
<section class="hero"><div class="blob a"></div><div class="blob b"></div><div class="blob c"></div><div class="gridbg"></div>
<div class="wrap hero-grid"><div>
<div class="pill rv"><i></i> Ahmedabad · Five businesses. One trusted partner.</div>
<h1 class="rv" style="--d:.1s">Powering India's growth in <span class="words">{words}</span></h1>
<p class="lead rv" style="--d:.2s">Vedanshi Enterprises brings Transport, Real Estate, Telecom, Packaging and Scrape services together under one roof — reliable, transparent and built for businesses that move fast.</p>
<div class="cta-row rv" style="--d:.3s"><a class="btn" href="contact.html">Get a Free Quote →</a><a class="btn ghost" href="#services">Explore Services</a></div>
</div>
<div class="hero-visual rv" style="--d:.2s"><div class="orbit"><div class="ring r1"></div><div class="ring r2"></div>
<div class="spinner"><div class="node"><span>🚚</span></div><div class="node n2"><span>🏢</span></div><div class="node n3"><span>📡</span></div><div class="node n4"><span>📦</span></div></div>
<div class="spinner rev"><div class="node"><span>♻️</span></div></div>
<div class="core">V</div></div></div></div>
<div class="scroll-cue" aria-hidden="true"></div></section>

<div class="marquee" aria-hidden="true"><div class="track">{marq}</div></div>

<section id="services"><div class="wrap">
<div class="sec-head rv"><span class="eyebrow">What we do</span><h2 class="title">Five services. <span class="grad">Endless possibilities.</span></h2><p class="lead">Pick a service to explore what we offer — or talk to us about combining them for your business.</p></div>
<div class="cards">{cards}</div></div></section>

<section style="background:var(--bg2)"><div class="wrap split">
<div class="rv"><span class="eyebrow">Why Vedanshi</span><h2 class="title">One partner for <span class="grad">many needs</span></h2>
<p class="lead">Instead of juggling multiple vendors, work with a single team that understands your logistics, space, connectivity, packaging and recycling needs.</p>
<ul class="checks"><li>Transparent pricing and honest communication</li><li>Quick response on call and WhatsApp</li><li>Services that connect — pack it, move it, recycle it</li><li>Flexible solutions for individuals and businesses</li></ul>
<a class="btn" href="about.html">About Us →</a></div>
<div class="panel rv" style="--d:.15s"><div class="stats">
<div class="stat"><b data-count="10" data-suffix="+">10+</b><span>Years of experience</span></div>
<div class="stat"><b data-count="500" data-suffix="+">500+</b><span>Happy clients</span></div>
<div class="stat"><b data-count="5">5</b><span>Business verticals</span></div></div>
<ul class="checks" style="margin:26px 0 0"><li>Head office in Ahmedabad, Gujarat</li><li>Serving Gujarat and across India</li></ul></div></div></section>

<section><div class="wrap"><div class="cover rv"><div><span class="eyebrow">Where we work</span><h2 class="title">Rooted in <span class="grad">Ahmedabad</span>, moving across India</h2><p class="lead">Our team is based in Ahmedabad, Gujarat, and serves customers across Gujarat, Rajasthan, Maharashtra and beyond.</p><a class="btn ghost" href="contact.html">Visit or contact us →</a></div>
<div class="routes" aria-hidden="true"><span>Ahmedabad</span><span>Surat</span><span>Vadodara</span><span>Rajkot</span><span>Mumbai</span><span>Jaipur</span><span>Delhi NCR</span><span>Pan-India</span></div></div></div></section>
<section style="padding-top:0"><div class="wrap"><div class="sec-head center rv"><span class="eyebrow">How we work</span><h2 class="title">Simple. Fast. <span class="grad">Reliable.</span></h2></div>
<div class="steps">
<div class="step rv"><h3>Tell us</h3><p>Share your requirement by call, WhatsApp or the enquiry form.</p></div>
<div class="step rv" style="--d:.1s"><h3>We plan</h3><p>We review the details and propose the best solution.</p></div>
<div class="step rv" style="--d:.2s"><h3>Clear quote</h3><p>Transparent pricing with no hidden surprises.</p></div>
<div class="step rv" style="--d:.3s"><h3>Delivered</h3><p>We execute and keep you updated until it's done.</p></div></div></div></section>
{cta()}'''
    page("index.html", "Vedanshi Enterprises — Transport, Real Estate, Telecom, Packaging & Scrape",
         "Vedanshi Enterprises: Transport, Real Estate, Telecom, Packaging and Scrape services under one roof.", "home", body)

def about():
    vals = [("🎯","Our Mission","To deliver dependable, fairly-priced services that help businesses and families move, build, connect, pack and recycle with confidence."),
            ("👁️","Our Vision","To grow into a multi-industry enterprise recognised for integrity, speed and long-term relationships."),
            ("💎","Our Values","Honesty in pricing, respect for commitments, and care for every customer and consignment.")]
    vc = "".join(f'<div class="card rv w3" style="--c:#ffb703;grid-column:span 2;--d:{i*.1}s"><div class="ic">{a}</div><h3>{b}</h3><p>{c}</p></div>' for i,(a,b,c) in enumerate(vals))
    body = f'''
<section class="hero sub"><div class="blob a"></div><div class="blob b"></div><div class="gridbg"></div><div class="wrap">
<span class="eyebrow rv">About us</span><h1 class="rv" style="--d:.1s">The people behind <span class="grad">Vedanshi Enterprises</span></h1>
<p class="lead rv" style="--d:.2s">A diversified enterprise serving customers across Transport, Real Estate, Telecom, Packaging and Scrape.</p></div></section>
<section><div class="wrap split"><div class="rv"><span class="eyebrow">Our story</span><h2 class="title">Many industries, <span class="grad">one standard</span></h2>
<p class="lead">Vedanshi Enterprises was built on a simple idea: customers shouldn't have to chase five different vendors. By combining transport, property, telecom support, packaging and scrap trading, we create solutions where each service strengthens the others.</p>
<p>Whether it is moving goods, finding the right space, supporting connectivity, protecting a product or turning scrap into value — we bring the same promise to every job: clear communication, fair pricing and reliable delivery.</p></div>
<div class="panel rv" style="--d:.15s"><ul class="checks"><li>Five integrated business verticals</li><li>Direct, owner-level accountability</li><li>Responsive on call, WhatsApp and email</li><li>Flexible for one-off and long-term needs</li><li>Pack it · Move it · Recycle it — all in-house</li></ul></div></div></section>
<section style="background:var(--bg2)"><div class="wrap"><div class="sec-head center rv"><span class="eyebrow">What drives us</span><h2 class="title">Mission, vision <span class="grad">&amp; values</span></h2></div><div class="cards">{vc}</div></div></section>
<section><div class="wrap"><div class="sec-head center rv"><span class="eyebrow">Our divisions</span><h2 class="title">Explore what <span class="grad">we do</span></h2></div><div class="cards">{svc_cards()}</div></div></section>
{cta()}'''
    page("about.html","About Us — Vedanshi Enterprises","Learn about Vedanshi Enterprises and our five business divisions.","home",body)

def contact():
    opts = "".join(f'<option>{s["name"]}</option>' for s in SERVICES) + "<option>Other</option>"
    body = f'''
<section class="hero sub"><div class="blob a"></div><div class="blob b"></div><div class="gridbg"></div><div class="wrap">
<span class="eyebrow rv">Contact</span><h1 class="rv" style="--d:.1s">Let's <span class="grad">talk business</span></h1>
<p class="lead rv" style="--d:.2s">Call, WhatsApp, email or send an enquiry — we'll respond quickly.</p></div></section>
<section style="padding-top:20px"><div class="wrap contact-grid">
<div class="info rv">
<a href="tel:+91{P1}"><span class="ic">📞</span><span><small>Call</small><b>{P1T}</b></span></a>
<a href="tel:+{P2}"><span class="ic">📱</span><span><small>Call / WhatsApp</small><b>{P2T}</b></span></a>
<a href="https://wa.me/{P2}" target="_blank" rel="noopener"><span class="ic">💬</span><span><small>WhatsApp</small><b>Chat with us now</b></span></a>
<a href="mailto:{MAIL}"><span class="ic">✉️</span><span><small>Email</small><b>{MAIL}</b></span></a>
<a href="https://www.google.com/maps/search/?api=1&query=Ahmedabad%2C+Gujarat" target="_blank" rel="noopener"><span class="ic">📍</span><span><small>Location</small><b>Ahmedabad, Gujarat, India</b></span></a>
<div><span class="ic">🕘</span><span><small>Enquiries</small><b>Mon – Sat · Replies within a day</b></span></div></div>
<div class="panel rv" style="--d:.1s"><h3>Send an enquiry</h3>
<form id="enquiry"><div class="row"><div><label for="n">Your name</label><input id="n" name="name" required autocomplete="name"></div>
<div><label for="p">Phone</label><input id="p" name="phone" type="tel" required autocomplete="tel"></div></div>
<label for="s">Service</label><select id="s" name="service">{opts}</select>
<label for="m">Your requirement</label><textarea id="m" name="message" required></textarea>
<input type="text" name="_honey" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
<div class="cta-row"><button class="btn" type="submit" value="send">Send Enquiry</button><button class="btn ghost" type="submit" value="wa">💬 Send on WhatsApp</button></div>
<p class="note" id="formstatus" role="status" aria-live="polite">Your enquiry goes straight to our team, and we reply within a day.</p></form></div></div></section>'''
    page("contact.html","Contact — Vedanshi Enterprises","Contact Vedanshi Enterprises by phone, WhatsApp or email.","home",body)

def service(s):
    offers = "".join(f'<div class="card rv w3" style="--c:{s["c"]};grid-column:span 2;--d:{i*.07}s"><div class="ic">{a}</div><h3>{b}</h3><p style="margin:0">{c}</p></div>' for i,(a,b,c) in enumerate(s["offers"]))
    faq = "".join(f'<details class="rv"><summary>{q}</summary><p>{a}</p></details>' for q,a in s["faq"])
    others = svc_cards(skip=s["slug"], half=True)
    ch, wh = CHIPS[s["slug"]]
    chips = "".join(f'<span class="chip">{c}</span>' for c in ch)
    who = "".join(f'<li>{w}</li>' for w in wh)
    body = f'''
<section class="hero sub"><div class="blob a"></div><div class="blob b"></div><div class="gridbg"></div>
<div class="wrap hero-grid"><div><div class="pill rv"><i></i> {s["name"]} · Vedanshi Enterprises</div>
<h1 class="rv" style="--d:.1s">{s["tag"].rstrip(".")}<span class="grad">.</span></h1>
<p class="lead rv" style="--d:.2s">{s["intro"]}</p>
<div class="cta-row rv" style="--d:.3s"><a class="btn" href="contact.html">Request a Quote →</a><a class="btn ghost" href="tel:+91{P1}">📞 {P1T}</a></div></div>
<div class="rv" style="--d:.2s">{SCENES[s["slug"]]}</div></div></section>
<section><div class="wrap"><div class="sec-head rv"><span class="eyebrow">Our {s["name"]} services</span><h2 class="title">What we <span class="grad">offer</span></h2></div><div class="cards">{offers}</div></div></section>
<section><div class="wrap split"><div class="rv"><span class="eyebrow">Specialities</span><h2 class="title">What we <span class="grad">handle</span></h2><div class="chips">{chips}</div></div><div class="panel rv" style="--d:.12s"><span class="eyebrow">Who we serve</span><ul class="checks">{who}</ul><p style="margin:0;font-size:14px">Based in Ahmedabad, Gujarat. Serving customers across Gujarat and India.</p></div></div></section>
<section style="background:var(--bg2)"><div class="wrap"><div class="sec-head center rv"><span class="eyebrow">Process</span><h2 class="title">From enquiry to <span class="grad">delivery</span></h2></div>
<div class="steps"><div class="step rv"><h3>Enquire</h3><p>Call, WhatsApp or fill the form with your requirement.</p></div><div class="step rv" style="--d:.1s"><h3>Plan</h3><p>We assess details and recommend the right approach.</p></div><div class="step rv" style="--d:.2s"><h3>Quote</h3><p>You receive clear, transparent pricing.</p></div><div class="step rv" style="--d:.3s"><h3>Deliver</h3><p>We execute on time and keep you informed.</p></div></div></div></section>
<section><div class="wrap split"><div class="rv"><span class="eyebrow">FAQ</span><h2 class="title">Common <span class="grad">questions</span></h2><p class="lead">Can't find your answer? Call us — we're happy to help.</p></div><div>{faq}</div></div></section>
<section style="background:var(--bg2)"><div class="wrap"><div class="sec-head rv"><span class="eyebrow">More from Vedanshi</span><h2 class="title">Explore our <span class="grad">other services</span></h2></div><div class="cards">{others}</div></div></section>
{cta()}'''
    page(s["file"], f'{s["name"]} Services — Vedanshi Enterprises', s["intro"], s["slug"].replace("-",""), body)

home(); about(); contact()
for s in SERVICES: service(s)
print("built", 3+len(SERVICES), "pages")
