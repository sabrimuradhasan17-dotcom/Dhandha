#!/usr/bin/env python3
"""Strip the document wrapper from a stand-alone HTML file, leaving a fragment (title first) for hosts that add their own page shell."""
import re, sys
src, dst = sys.argv[1], sys.argv[2]
h = open(src, encoding='utf-8').read()
h = re.sub(r'<!doctype html>\s*<html[^>]*><head>\s*(<meta[^>]*>\s*)*', '', h, count=1, flags=re.I)
h = h.replace('</head><body>', '', 1).replace('</body></html>', '')
open(dst, 'w', encoding='utf-8').write(h.strip() + '\n')
print(dst, round(len(h) / 1048576, 1), 'MB; starts:', h.strip()[:40].replace('\n', ' '))
