/* ============ CONFIG — client edits these ============ */
const CONFIG = {
  whatsappNumber: "910000000000",   // country code + number, no "+" (placeholder)
  currency: "₹",
  locale: "en-IN",
  razorpayKey: "",                  // paste Razorpay Key ID to enable live online payments
  orderEndpoint: ""                 // optional: URL that receives the order JSON (POST)
};

/* ============ PRODUCTS (placeholder names & prices) ============ */
const gold = "#c9a96a", dark = "#3a2e1f";
const art = {
  frame: `<svg viewBox="0 0 200 200"><rect x="40" y="30" width="120" height="140" fill="${dark}" stroke="${gold}" stroke-width="2"/><rect x="54" y="44" width="92" height="112" fill="#0d0b09" stroke="${gold}" stroke-opacity=".5"/><circle cx="100" cy="88" r="14" fill="#6a5532"/><path d="M62 150c0-26 17-40 38-40s38 14 38 40z" fill="#6a5532"/></svg>`,
  gallery: `<svg viewBox="0 0 200 200"><rect x="20" y="30" width="70" height="90" fill="${dark}" stroke="${gold}" stroke-width="2"/><rect x="100" y="30" width="80" height="50" fill="${dark}" stroke="${gold}" stroke-width="2"/><rect x="100" y="90" width="50" height="50" fill="${dark}" stroke="${gold}" stroke-width="2"/><rect x="30" y="130" width="60" height="40" fill="${dark}" stroke="${gold}" stroke-width="2"/><rect x="160" y="90" width="20" height="80" fill="${dark}" stroke="${gold}" stroke-width="2"/><g fill="#6a5532" opacity=".7"><rect x="28" y="38" width="54" height="74"/><rect x="108" y="38" width="64" height="34"/><rect x="108" y="98" width="34" height="34"/><rect x="38" y="138" width="44" height="24"/></g></svg>`,
  table: `<svg viewBox="0 0 200 200"><ellipse cx="100" cy="90" rx="78" ry="22" fill="${dark}" stroke="${gold}" stroke-width="2"/><ellipse cx="100" cy="86" rx="78" ry="22" fill="#52402a" stroke="${gold}" stroke-width="1.5"/><path d="M45 100l-8 62M155 100l8 62M80 108l-4 56M120 108l4 56" stroke="${gold}" stroke-width="5" stroke-linecap="round"/></svg>`,
  marble: `<svg viewBox="0 0 200 200"><ellipse cx="100" cy="82" rx="74" ry="20" fill="#d9d3c7" stroke="${gold}" stroke-width="2"/><path d="M60 80l30-6M110 90l24-10M80 88l10 4" stroke="#8d867a" stroke-width="1"/><path d="M70 98v58l-18 10h96l-18-10V98" fill="none" stroke="${gold}" stroke-width="4"/><rect x="62" y="162" width="76" height="6" fill="${gold}"/></svg>`,
  mirror: `<svg viewBox="0 0 200 200"><ellipse cx="100" cy="100" rx="58" ry="74" fill="${dark}" stroke="${gold}" stroke-width="3"/><ellipse cx="100" cy="100" rx="48" ry="64" fill="#1b1a19" stroke="${gold}" stroke-opacity=".5"/><path d="M70 60c20-10 40-6 56 6" stroke="#fff" stroke-opacity=".25" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`,
  side: `<svg viewBox="0 0 200 200"><rect x="50" y="60" width="100" height="14" fill="#52402a" stroke="${gold}" stroke-width="2"/><rect x="58" y="74" width="84" height="40" fill="#241d14" stroke="${gold}"/><circle cx="100" cy="94" r="4" fill="${gold}"/><path d="M60 114l-6 56M140 114l6 56" stroke="${gold}" stroke-width="5" stroke-linecap="round"/><rect x="56" y="128" width="88" height="5" fill="${gold}" opacity=".7"/></svg>`
};
const PRODUCTS = [
  { id:"frame-classic", cat:"Photo Frames", name:"Heritage Wooden Frame", desc:"Solid wood, hand-polished edges with a gilded inner lip.", price:1499, art:"frame" },
  { id:"frame-gallery", cat:"Photo Frames", name:"Gallery Wall Set", desc:"A curated set of five frames in mixed sizes for a statement wall.", price:4999, art:"gallery" },
  { id:"table-walnut", cat:"Coffee Tables", name:"Walnut Round Coffee Table", desc:"Warm walnut top on tapered brass-tipped legs.", price:18999, art:"table" },
  { id:"table-marble", cat:"Coffee Tables", name:"Marble Statement Table", desc:"Natural marble top with a slim gold-finish frame.", price:24999, art:"marble" },
  { id:"decor-mirror", cat:"Wall Décor", name:"Arc Accent Mirror", desc:"Oval mirror in a sculpted wood and brass frame.", price:6999, art:"mirror" },
  { id:"decor-side", cat:"Side Furniture", name:"Brass-Line Side Table", desc:"Compact side table with a hidden drawer — the perfect companion piece.", price:8999, art:"side" }
];
const money = n => CONFIG.currency + n.toLocaleString(CONFIG.locale);
const $ = s => document.querySelector(s);

/* ============ Render products ============ */
$("#products").innerHTML = PRODUCTS.map((p,i)=>`
  <article class="card reveal" style="transition-delay:${(i%3)*120}ms" data-tilt>
    <div class="card-art">${art[p.art]}</div>
    <div class="card-body">
      <span class="cat">${p.cat}</span>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="card-foot"><span class="price">${money(p.price)}</span>
      <button class="add" data-add="${p.id}">Add to cart</button></div>
    </div>
  </article>`).join("");

/* ============ Cart ============ */
let cart = {};
try { cart = JSON.parse(localStorage.getItem("korva-cart")) || {}; } catch(e){}
const save = () => { try { localStorage.setItem("korva-cart", JSON.stringify(cart)); } catch(e){} };
const find = id => PRODUCTS.find(p=>p.id===id);
const total = () => Object.entries(cart).reduce((s,[id,q])=>s+find(id).price*q,0);
const count = () => Object.values(cart).reduce((a,b)=>a+b,0);

function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.remove("show"),2200); }

function renderCart(){
  const ids = Object.keys(cart).filter(id=>find(id));
  $("#cartItems").innerHTML = ids.length ? ids.map(id=>{const p=find(id);return `
    <div class="line">
      <div class="thumb">${art[p.art]}</div>
      <div><h4>${p.name}</h4><small>${money(p.price)}</small>
        <div class="qty"><button data-dec="${id}">−</button><span>${cart[id]}</span><button data-inc="${id}">+</button></div></div>
      <div><strong>${money(p.price*cart[id])}</strong><button class="rm" data-rm="${id}">Remove</button></div>
    </div>`}).join("") : `<p class="empty">Your cart is empty.</p>`;
  $("#cartTotal").textContent = money(total());
  $("#checkoutTotal").textContent = money(total());
  $("#cartCount").textContent = count();
  $("#checkoutBtn").disabled = !ids.length;
  $("#checkoutBtn").style.opacity = ids.length ? 1 : .4;
  save();
}
const open = el => { el.classList.add(el.id==="modal"?"open":"open"); $("#overlay").classList.add("show"); };
function openDrawer(){ $("#drawer").classList.add("open"); $("#overlay").classList.add("show"); }
function closeAll(){ $("#drawer").classList.remove("open"); $("#modal").classList.remove("open"); $("#overlay").classList.remove("show"); }

document.addEventListener("click", e=>{
  const t = e.target.closest("[data-add],[data-inc],[data-dec],[data-rm],[data-wa]");
  if(!t) return;
  if(t.dataset.add){ cart[t.dataset.add]=(cart[t.dataset.add]||0)+1; renderCart(); toast("Added to cart"); const b=$("#cartBtn"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }
  else if(t.dataset.inc){ cart[t.dataset.inc]++; renderCart(); }
  else if(t.dataset.dec){ if(--cart[t.dataset.dec]<=0) delete cart[t.dataset.dec]; renderCart(); }
  else if(t.dataset.rm){ delete cart[t.dataset.rm]; renderCart(); }
  else if(t.dataset.wa){ e.preventDefault(); window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(t.dataset.wa)}`,"_blank"); }
});
$("#cartBtn").onclick = openDrawer;
$("#drawerClose").onclick = closeAll;
$("#overlay").onclick = closeAll;
$("#modalClose").onclick = closeAll;
document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeAll(); });
$("#checkoutBtn").onclick = () => { $("#drawer").classList.remove("open"); $("#modal").classList.add("open"); $("#checkoutMsg").textContent=""; };

/* ============ Checkout ============ */
function orderSummary(o){
  const lines = Object.entries(cart).map(([id,q])=>`• ${find(id).name} × ${q} — ${money(find(id).price*q)}`).join("\n");
  return `*New Korva order ${o.ref}*\n${lines}\n\n*Total:* ${money(total())}\n*Payment:* ${o.pay==="cod"?"Cash on delivery":"Online"}\n\n*Customer:* ${o.name}\n*Phone:* ${o.phone}\n*Address:* ${o.address}, ${o.city} ${o.zip}`;
}
function finish(o){
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(orderSummary(o))}`,"_blank");
  cart = {}; renderCart(); closeAll(); $("#checkoutForm").reset(); toast("Order placed — thank you!");
}
$("#checkoutForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  const o = {...f, ref:"KV"+Date.now().toString().slice(-6), items:cart, total:total()};
  const msg = $("#checkoutMsg"); msg.textContent = "Processing…";
  if(CONFIG.orderEndpoint){ try{ await fetch(CONFIG.orderEndpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)}); }catch(err){} }
  if(f.pay==="online" && CONFIG.razorpayKey){
    try{
      await new Promise((res,rej)=>{ if(window.Razorpay) return res(); const s=document.createElement("script"); s.src="https://checkout.razorpay.com/v1/checkout.js"; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
      new Razorpay({ key:CONFIG.razorpayKey, amount:total()*100, currency:"INR", name:"Korva", description:"Order "+o.ref,
        prefill:{name:f.name,email:f.email,contact:f.phone}, theme:{color:"#c9a96a"},
        handler:()=>finish(o) }).open();
      msg.textContent=""; return;
    }catch(err){ msg.textContent="Could not load payment gateway. Please try again."; return; }
  }
  finish(o);
});

/* ============ Effects ============ */
// loader + hero text split
document.querySelectorAll("[data-split]").forEach(h=>{
  h.innerHTML = h.innerHTML.split(/(<br>|<em>.*?<\/em>|\s+)/).filter(Boolean).map(tok=>{
    if(tok==="<br>") return tok;
    if(tok.startsWith("<em>")) return `<em>${tok.slice(4,-5).split(" ").map((w,i)=>`<span class="w"><span style="transition-delay:${.5+i*.1}s">${w}</span></span>`).join(" ")}</em>`;
    if(/^\s+$/.test(tok)) return " ";
    return `<span class="w"><span>${tok}</span></span>`;
  }).join("");
  h.querySelectorAll(".w > span").forEach((s,i)=>{ if(!s.style.transitionDelay) s.style.transitionDelay=(i*.08)+"s"; });
});
window.addEventListener("load", ()=>setTimeout(()=>{ $("#loader").classList.add("done"); document.body.classList.add("ready"); document.querySelectorAll(".hero .reveal").forEach((el,i)=>setTimeout(()=>el.classList.add("in"),600+i*150)); },1700));

// scroll reveal + counters
const io = new IntersectionObserver(es=>es.forEach(en=>{
  if(!en.isIntersecting) return; en.target.classList.add("in"); io.unobserve(en.target);
  en.target.querySelectorAll("[data-count]").forEach(c=>{
    const to=+c.dataset.count, suf=c.dataset.suffix||""; let t0;
    const step=ts=>{ t0=t0||ts; const p=Math.min((ts-t0)/1400,1); c.textContent=Math.round(to*(1-Math.pow(1-p,3)))+suf; if(p<1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}),{threshold:.15});
document.querySelectorAll(".reveal").forEach(el=>{ if(!el.closest(".hero")) io.observe(el); });

// nav, progress, parallax
const nav=$("#nav"), prog=$("#progress"), hf=document.querySelectorAll(".hf");
addEventListener("scroll", ()=>{
  const y=scrollY; nav.classList.toggle("scrolled", y>40);
  prog.style.width = (y/(document.body.scrollHeight-innerHeight)*100)+"%";
  hf.forEach((el,i)=>{ el.style.transform=`translateY(${y*(.06+i*.04)}px) rotate(${(i-1)*2+y*.004}deg)`; });
},{passive:true});

// mobile menu
$("#burger").onclick = e=>{ e.currentTarget.classList.toggle("open"); $("#navLinks").classList.toggle("open"); };
document.querySelectorAll("#navLinks a").forEach(a=>a.addEventListener("click",()=>{ $("#burger").classList.remove("open"); $("#navLinks").classList.remove("open"); }));

// custom cursor + magnetic buttons + card tilt (fine pointers only)
if(matchMedia("(hover:hover) and (pointer:fine)").matches){
  const c=$("#cursor"), d=$("#cursorDot"); let x=0,y=0,cx=0,cy=0;
  addEventListener("mousemove", e=>{ x=e.clientX; y=e.clientY; d.style.transform=`translate(${x}px,${y}px)`; document.body.classList.add("has-cursor"); });
  (function loop(){ cx+=(x-cx)*.15; cy+=(y-cy)*.15; c.style.transform=`translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
  document.addEventListener("mouseover", e=>c.classList.toggle("hover", !!e.target.closest("a,button,.card")));
  document.querySelectorAll(".magnetic").forEach(b=>{
    b.addEventListener("mousemove", e=>{ const r=b.getBoundingClientRect(); b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.25}px,${(e.clientY-r.top-r.height/2)*.35}px)`; });
    b.addEventListener("mouseleave", ()=>b.style.transform="");
  });
  document.querySelectorAll("[data-tilt]").forEach(card=>{
    card.addEventListener("mousemove", e=>{ const r=card.getBoundingClientRect(), px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5; card.style.transform=`perspective(900px) rotateY(${px*8}deg) rotateX(${-py*8}deg) translateY(-6px)`; });
    card.addEventListener("mouseleave", ()=>card.style.transform="");
  });
}
$("#year").textContent = new Date().getFullYear();
renderCart();
