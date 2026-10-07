#!/usr/bin/env python3
"""One-off: turn text scraped from the old bhutanz.com pages into server/old-content.json.
Usage: python3 -I tools/extract-old-site.py <dir-with-page-txt-files> server/old-content.json"""
import json, re, sys, os
src, out = sys.argv[1], sys.argv[2]
def rd(n): return [l.strip() for l in open(os.path.join(src, n + '.txt'), errors='ignore').read().split('\n') if l.strip() and l.strip() != '·']

# proper nouns = words capitalised mid-sentence in well-cased pages
proper = set()
for n in ['Tours_fly-in-fly-out-5n6d', 'Tours_explore-bhutan-10n11d', 'Tours_drive-in-drive-out-7n8d', 'Tours_meditation-tour-7n8d', 'Tours_photography-tour-12n13d']:
    for l in rd(n):
        ws = re.findall(r"[A-Za-z][A-Za-z'’-]*", l)
        for i, w in enumerate(ws[1:], 1):
            if w[0].isupper() and not ws[i-1].endswith('.'): proper.add(w)
proper |= {'Paro','Thimphu','Punakha','Bhutan','Bhutanese','Dzong','Tiger','Tiger\'s','Nest','Taktsang','Druk','Air','Jumolhari','Himalayas','Himalayan','Guru','Rinpoche','Wangdue','Gangtey','Phobjikha','Bumthang','Haa','Dochu','La','Chele','Tibetan','Tibet','King','Buddhist','Buddha','Takin','Tashichhodzong','Tashichho','Rinpung','Kichu','Lhakhang','Drugyal','Chimi','Chhimi','Metshina','Docho','Mount','Ura','Trongsa','Mongar','Phuentsholing','Bagdogra','NJP','Mumbai','Bengaluru','Chorten','Memorial','Zoo','Radio','Tower','National','Library','Institute','Traditional','Medicine','Textile','Museum','Handicraft','Emporium','Paper','Factory','Shabdrung','Indian','Gho','Kira','Pass','Valley','Monastery','Temple','Hotel','River','Jambay','Kurje','Tamshing','Tang','Nunnery','Bhutan\'s','I'}
SMALL = {'a','an','the','and','or','of','in','on','at','to','for','with','by','from'}
def fix(line):
    ws = line.split(' ')
    alpha = [w for w in ws if re.match(r'^[A-Za-z]', w) and w.lower() not in SMALL]
    if len(alpha) < 4 or sum(1 for w in alpha if w[0].isupper()) / len(alpha) < .75: return line
    o = []
    for i, w in enumerate(ws):
        core = re.sub(r"[^A-Za-z'’]", '', w)
        if core in proper or re.match(r'^[A-Z]{2,}$', core) or not core: o.append(w)
        else: o.append(w.lower())
    s = ' '.join(o)
    s = re.sub(r'(^|[.!?]\s+)([a-z])', lambda m: m.group(1) + m.group(2).upper(), s)
    return s[0].upper() + s[1:] if s else s

STOP = re.compile(r'^(Who Is This|Frequently Asked|Plan Your|Explore More|Every traveller experiences|tours@bhutanz|Journey Highlights|Price Breakdown)', re.I)
DAY = re.compile(r'^Day\s*0?(\d+)\s*[:\-–—]\s*(.*)$', re.I)

def tour(name):
    L = rd(name)
    o = {'intro': [], 'highlights': [], 'stay': '', 'itinerary': [], 'ideal': [], 'faqs': []}
    # intro
    start = 1 if L and L[0].lower().startswith('introduction') else 0
    i = start
    while i < len(L) and not L[i].startswith('✓') and not L[i].lower().startswith('journey highlights') and not DAY.match(L[i]) and len(o['intro']) < 3:
        if len(L[i]) > 80: o['intro'].append(fix(L[i]))
        i += 1
    # highlights = first tick block
    j = 0
    while j < len(L) and not L[j].startswith('✓'): j += 1
    while j < len(L) and L[j].startswith('✓'): o['highlights'].append(fix(L[j][1:].strip())); j += 1
    # stay summary
    for l in L:
        if '|' in l and re.search(r'\d\s*N', l, re.I) and not DAY.match(l) and len(l) < 90 and not l.startswith('✓'): o['stay'] = re.sub(r'\s+', ' ', l); break
    # days
    cur = None
    for k, l in enumerate(L):
        m = DAY.match(l)
        if m:
            parts = [p.strip() for p in m.group(2).split('|')]
            cur = {'title': fix(parts[0]), 'meta': ' · '.join(parts[1:]), 'desc': []}
            o['itinerary'].append(cur); continue
        if cur is not None:
            if STOP.match(l) or l.startswith('✓'): cur = None; continue
            cur['desc'].append(fix(l))
    for d in o['itinerary']: d['desc'] = ' '.join(d['desc'])
    # ideal for
    for k, l in enumerate(L):
        if l.lower().startswith('who is this'):
            for x in L[k+1:]:
                if x.startswith('✓'): o['ideal'].append(fix(x[1:].strip()))
                elif o['ideal']: break
    # faqs
    for k, l in enumerate(L):
        if l.lower().startswith('frequently asked'):
            q = None
            for x in L[k+1:]:
                if re.match(r'^(Plan Your|Explore More|tours@bhutanz|Every traveller experiences)', x): break
                isq = (x.endswith('?') and len(x) < 170) or x.startswith('Q.')
                if isq:
                    q = {'q': re.sub(r'^(Q\.|\d+\.)\s*', '', x).strip(), 'a': ''}; o['faqs'].append(q)
                elif q: q['a'] = (q['a'] + ' ' + x).strip()
            break
    return o

def fixed(name):
    L = rd(name); o = {'intro': [], 'highlights': [], 'stay': '', 'itinerary': [], 'ideal': [], 'faqs': [], 'inclusions': [], 'exclusions': []}
    i = next((k for k, l in enumerate(L) if l.startswith('Tour Essentials:')), None)
    if i is not None:
        for l in L[i+1:]:
            if re.match(r'^(Short Itinerary|Approximate)', l, re.I): break
            o['inclusions'].append(fix(l))
    k = next((k for k, l in enumerate(L) if re.match(r'^Approximate|Day wise', l, re.I)), None)
    if k is None: k = next((n for n, l in enumerate(L) if l.startswith('Short Itinerary')), 0)
    body = L[k:]
    if name.endswith('9n10d'): body = L[next(n for n, l in enumerate(L) if re.match(r'^Day 01 ?:', l)):]
    cur = None
    for l in body:
        m = re.match(r'^Day\s*0?(\d+)\s*[:\-–—]\s*(.*)$', l, re.I)
        if m and (len(m.group(2)) > 3):
            cur = {'title': fix(m.group(2).split('(')[0].strip()), 'meta': '', 'desc': []}; o['itinerary'].append(cur); continue
        if cur is not None:
            if re.match(r'^(Price Breakdown)', l): cur = None; continue
            cur['desc'].append(fix(l))
    for d in o['itinerary']: d['desc'] = ' '.join(d['desc'])
    i = next((k for k, l in enumerate(L) if l.startswith('Tour Exclusion')), None)
    if i is not None:
        for l in L[i+1:]:
            if l.startswith('Requirements') or l.startswith('tours@'): break
            o['exclusions'].append(fix(l))
    return o

res = {}
for n, key in [('Tours_fly-in-fly-out-4n5d','fly-4n5d'),('Tours_fly-in-fly-out-5n6d','fly-5n6d'),('Tours_fly-in-fly-out-6n7d','fly-6n7d'),('Tours_fly-in-fly-out-7n8d','fly-7n8d'),
               ('Tours_drive-in-drive-out-6n7d','drive-6n7d'),('Tours_drive-in-drive-out-7n8d','drive-7n8d'),('Tours_meditation-tour-7n8d','meditation-7n8d'),
               ('Tours_explore-bhutan-10n11d','explore-10n11d'),('Tours_photography-tour-12n13d','photography-12n13d')]:
    res[key] = tour(n)
res['last-shangri-la-9n10d'] = fixed('fixed-departures_the-last-shangri-la-9n10d')
res['thunder-dragon-6n7d'] = fixed('fixed-departures_land-of-thunder-dragon-6n7d')

def html_from(name):
    L = rd(name); out = []; ul = False
    L = [l for l in L if l not in ('EXCEPTIONAL .', 'EXPLORABLE', 'EXPLORABLE .', '.', 'EXPERIENCE')]
    for idx, l in enumerate(L):
        if re.match(r'^(tours@bhutanz|bhutanztours@gmail|\|)', l) or l.startswith('+91'): continue
        nxt = L[idx+1] if idx + 1 < len(L) else ''
        li = l[:1] in '•✓' or l.startswith('- ')
        if li:
            if not ul: out.append('<ul>'); ul = True
            out.append('<li>' + re.sub(r'^[•✓\-]\s*', '', l).replace('<', '&lt;') + '</li>'); continue
        if ul: out.append('</ul>'); ul = False
        t = fix(l).replace('<', '&lt;')
        if len(l) < 85 and not re.search(r'[.,;:]$', l) and len(nxt) > len(l) and idx > 0: out.append('<h3>' + t + '</h3>')
        else: out.append('<p>' + t + '</p>')
    if ul: out.append('</ul>')
    return '\n'.join(out)

pages = {}
for slug, f, title in [('visa','visa','Bhutan Visa & Entry Permit Guide'),('festivals','festivals','Bhutan Festivals & Tshechu'),('about-bhutan','about-bhutan','About Bhutan'),('dos-and-donts','dos-donts',"Bhutan Travel Do's & Don'ts")]:
    h = html_from(f)
    pages[slug] = {'title': title, 'html': h}

faqs = []
q = None
for l in rd('faq'):
    if l.endswith('?') and len(l) < 160 and not l.startswith('Planning'):
        q = {'q': l, 'a': ''}; faqs.append(q)
    elif q: q['a'] = (q['a'] + ' ' + l).strip()
faqs = [f for f in faqs if f['a']]
json.dump({'tours': res, 'pages': pages, 'faqs': faqs}, open(out, 'w'), indent=1, ensure_ascii=False)
for k, v in res.items(): print(k, len(v['itinerary']), 'days', len(v['highlights']), 'hl', len(v['ideal']), 'ideal', len(v['faqs']), 'faq', len(v.get('inclusions', [])), 'inc')
print('faqs', len(faqs), {k: len(v['html']) for k, v in pages.items()})
