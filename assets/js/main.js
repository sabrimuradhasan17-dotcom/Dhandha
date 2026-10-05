(function(){
  'use strict';
  var d=document,root=d.documentElement,body=d.body;
  root.classList.remove('no-js');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // header state + scroll progress (single rAF-throttled listener, passive)
  var hdr=d.querySelector('.hdr'),bar=d.querySelector('.progress i'),tick=false;
  function onScroll(){
    var y=window.pageYOffset||root.scrollTop,h=root.scrollHeight-window.innerHeight;
    if(hdr)hdr.classList.toggle('stuck',y>20);
    if(bar)bar.style.transform='scaleX('+(h>0?Math.min(y/h,1):0)+')';
    tick=false;
  }
  window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(onScroll);}},{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});onScroll();

  // mobile menu
  var burger=d.querySelector('.burger');
  function setMenu(o){body.classList.toggle('menu-open',o);root.style.overflow=o?'hidden':'';if(burger)burger.setAttribute('aria-expanded',o);}
  if(burger)burger.addEventListener('click',function(){setMenu(!body.classList.contains('menu-open'));});
  d.querySelectorAll('.dd>button').forEach(function(b){
    b.addEventListener('click',function(e){e.stopPropagation();b.parentNode.classList.toggle('open');});
  });
  d.addEventListener('click',function(e){d.querySelectorAll('.dd.open').forEach(function(x){if(!x.contains(e.target)&&window.innerWidth>980)x.classList.remove('open');});});
  d.querySelectorAll('.nav a').forEach(function(a){a.addEventListener('click',function(){setMenu(false);});});
  window.addEventListener('resize',function(){if(window.innerWidth>980)setMenu(false);});
  d.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false);});
  window.addEventListener('pageshow',function(){setMenu(false);});

  // reveal on scroll
  var rv=d.querySelectorAll('.rv');
  if('IntersectionObserver' in window&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:0,rootMargin:'0px 0px -8% 0px'});
    rv.forEach(function(el){io.observe(el);});
  }else rv.forEach(function(el){el.classList.add('in');});

  // count-up numbers
  var cn=d.querySelectorAll('[data-count]');
  if(cn.length&&'IntersectionObserver' in window){
    var co=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return;co.unobserve(e.target);
      var el=e.target,end=+el.dataset.count,suf=el.dataset.suffix||'',t0=null,dur=1400;
      if(reduce){el.textContent=end+suf;return;}
      (function step(t){if(!t0)t0=t;var p=Math.min((t-t0)/dur,1),v=Math.round(end*(1-Math.pow(1-p,3)));el.textContent=v+suf;if(p<1)requestAnimationFrame(step);})(performance.now());
    });},{threshold:.5});
    cn.forEach(function(el){co.observe(el);});
  }

  // card spotlight (desktop pointers only)
  if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    d.querySelectorAll('.card').forEach(function(c){
      c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');});
    });
  }

  // contact form -> opens mail client / WhatsApp with prefilled message (no backend needed)
  var form=d.getElementById('enquiry');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var f=new FormData(form),msg='Hello Vedanshi Enterprises,%0A%0AName: '+enc(f.get('name'))+'%0APhone: '+enc(f.get('phone'))+'%0AService: '+enc(f.get('service'))+'%0A%0A'+enc(f.get('message'));
      var how=e.submitter&&e.submitter.value;
      if(how==='wa')window.open('https://wa.me/918058482609?text='+msg,'_blank','noopener');
      else window.location.href='mailto:vedanshienterprises2804@gmail.com?subject='+encodeURIComponent('Enquiry: '+f.get('service'))+'&body='+msg;
    });
  }
  function enc(v){return encodeURIComponent(v||'');}
  var y=d.getElementById('yr');if(y)y.textContent=new Date().getFullYear();
})();
