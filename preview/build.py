# Builds the single-file preview: python3 build.py  ->  index.html
import re
r=lambda f:open('src/'+f).read()
h=r('template.html')
h=h.replace('<link rel="stylesheet" href="styles.css">','<style>'+r('styles.css')+'</style>')
h=h.replace('<script src="data.js"></script><script src="app.js"></script>','<script>'+r('data.js')+'\n'+r('app.js')+'</script>')
open('index.html','w').write(h)
