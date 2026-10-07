const WA = '919999999999'; // SAMPLE number, owner sets real one in Admin > Settings
const KEY = 'bz_demo_v1';
const seed = {
  settings: { wa: WA },
  tours: [
    {id:1,slug:'bhutan-classic-6n7d',name:'Bhutan Classic: Paro, Thimphu, Punakha',days:7,price:42500,hue:20,status:'live',route:'Paro > Thimphu > Punakha > Paro',highlights:["Tiger's Nest hike","Punakha Dzong","Dochula Pass"],dates:['2026-11-14','2026-12-05','2027-01-16']},
    {id:2,slug:'bhutan-family-5n6d',name:'Bhutan Family Escape',days:6,price:36900,hue:35,status:'live',route:'Paro > Thimphu > Punakha',highlights:['Easy drives','Archery','Farmhouse lunch'],dates:['2026-11-21','2026-12-19']},
    {id:3,slug:'bhutan-tshechu-festival-8n9d',name:'Paro Tshechu Festival Journey',days:9,price:68000,hue:350,status:'live',route:'Paro > Thimphu > Punakha > Gangtey',highlights:['Masked dances','Gangtey valley','Local homestay'],dates:['2027-03-28']},
    {id:4,slug:'bhutan-heartland-bumthang-9n10d',name:'Heartland: Gangtey and Bumthang',days:10,price:89500,hue:150,status:'live',route:'Paro > Punakha > Gangtey > Bumthang',highlights:['Black-necked cranes','Jakar Dzong','Valley walks'],dates:['2026-12-12','2027-02-06']},
    {id:5,slug:'bhutan-wellness-retreat-6n7d',name:'Meditation and Wellness Retreat',days:7,price:74000,hue:200,status:'draft',route:'Paro > Thimphu',highlights:['Guided meditation','Hot stone bath','Monastery stay'],dates:[]}
  ],
  flights: [
    {id:1,route:'Mumbai > Paro (via Delhi)',airline:'Drukair',no:'KB 201',dep:'06:10',arr:'13:20',price:31800,days:'Mon, Thu, Sat',seats:12},
    {id:2,route:'Delhi > Paro',airline:'Drukair',no:'KB 213',dep:'07:30',arr:'10:55',price:21500,days:'Daily',seats:20},
    {id:3,route:'Kolkata > Paro',airline:'Bhutan Airlines',no:'B3 702',dep:'08:45',arr:'10:05',price:17900,days:'Tue, Fri, Sun',seats:8},
    {id:4,route:'Bagdogra > Paro',airline:'Bhutan Airlines',no:'B3 770',dep:'11:00',arr:'11:50',price:14200,days:'Wed, Sat',seats:15}
  ],
  enquiries: [
    {id:1,name:'Riya Shah',tour:'Bhutan Classic',date:'2026-12-05',pax:4,status:'new'},
    {id:2,name:'Amit Verma',tour:'Heartland',date:'2027-02-06',pax:2,status:'contacted'}
  ],
  users: [{id:1,name:'Owner',role:'owner'},{id:2,name:'Staff',role:'staff'}]
};
let D; try{D=JSON.parse(localStorage.getItem(KEY))}catch(e){} if(!D) D=structuredClone(seed);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}};
let session=null, tab='overview';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr=n=>'₹'+Number(n).toLocaleString('en-IN');
const fd=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
const waLink=t=>`https://wa.me/${D.settings.wa}?text=${encodeURIComponent(t)}`;
const art=(h,label='Photo placeholder')=>`<div class="ph"><svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g${h}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h},60%,78%)"/><stop offset="1" stop-color="hsl(${h},50%,92%)"/></linearGradient></defs><rect width="400" height="200" fill="url(#g${h})"/><circle cx="310" cy="50" r="22" fill="hsl(${h},80%,88%)"/><path d="M0 200V120l70-55 60 50 70-80 80 90 50-35 70 60v50z" fill="hsl(${h},35%,45%)"/><path d="M0 200v-40l90-30 80 40 90-45 140 50v25z" fill="hsl(${h},40%,30%)"/></svg><span class="tag">${label}</span></div>`;
const tourCard=t=>`<a class="card" href="#/tour/${esc(t.slug)}" style="text-decoration:none;color:inherit"><div class="img">${art(t.hue,'Sample photo')}</div><div class="body"><h3>${esc(t.name)}</h3><div class="muted">${t.days} days · ${esc(t.route)}</div><div class="chips">${t.highlights.map(h=>`<span>${esc(h)}</span>`).join('')}</div><div class="price">from ${inr(t.price)} <span class="muted">per person</span></div></div></a>`;
const live=()=>D.tours.filter(t=>t.status==='live');

const pages={
home:()=>`<section class="hero" style="--heroimg:linear-gradient(135deg,#5a2a1c,#b88a2e)"><div class="wrap"><h1>Bhutan, planned around you</h1><p>Private guides, permits and handpicked stays. Real conversations, not cookie-cutter packages.</p><a class="btn" href="#/tours">Explore tours</a> <a class="btn wa" target="_blank" rel="noopener" href="${waLink('Hi, I want to plan a Bhutan trip.')}">Plan on WhatsApp</a></div></section>
<section class="sec wrap"><h2>Popular journeys</h2><div class="grid">${live().slice(0,3).map(tourCard).join('')}</div></section>
<section class="sec wrap"><h2>Why La Bhutanz</h2><div class="grid">${[['Local partners','Licensed Bhutan operators and guides.'],['Fully handled','Permits, SDF, transfers and hotels sorted.'],['Transparent INR pricing','Clear per-person prices, no surprises.'],['Mumbai based','Talk to us in your own time zone, in your language.']].map(([a,b])=>`<div class="card body"><h3>${a}</h3><p class="muted">${b}</p></div>`).join('')}</div></section>
<section class="sec wrap"><h2>Upcoming departures</h2>${deps()}</section>
<section class="sec wrap"><h2>Traveller stories</h2><div class="grid">${['“Every detail was handled. Tiger’s Nest was unforgettable.” (sample)','“Our guide felt like family.” (sample)'].map(q=>`<div class="card body"><p>${q}</p></div>`).join('')}</div></section>`,
tours:()=>`<section class="sec wrap"><h1>Bhutan tour packages</h1><p class="muted">Prices are per person in INR and update from the admin panel.</p><div class="grid">${live().map(tourCard).join('')}</div></section>`,
flights:()=>`<section class="sec wrap"><h1>Flights to Bhutan</h1><p class="muted">Sample schedule. Managed by the owner in the admin panel.</p><div class="tablewrap"><table><tr><th>Route</th><th>Airline</th><th>Flight</th><th>Dep</th><th>Arr</th><th>Days</th><th>Fare</th><th></th></tr>${D.flights.map(f=>`<tr><td>${esc(f.route)}</td><td>${esc(f.airline)}</td><td>${esc(f.no)}</td><td>${esc(f.dep)}</td><td>${esc(f.arr)}</td><td>${esc(f.days)}</td><td>${inr(f.price)}</td><td><a class="btn sm wa" target="_blank" rel="noopener" href="${waLink('Enquiry: flight '+f.no+' '+f.route)}">Enquire</a></td></tr>`).join('')}</table></div></section>`,
about:()=>`<section class="sec wrap"><h1>About La Bhutanz Tours</h1><p>A Mumbai-based agency that focuses only on Bhutan, designing journeys for Indian and international travellers. (Sample copy, replace with the client’s story.)</p></section>`,
contact:()=>`<section class="sec wrap"><h1>Plan your trip</h1><p class="muted">The form opens WhatsApp with your details filled in.</p><div class="card body" style="max-width:520px"><form id="enq"><label>Name</label><input name="n" required><label>Tour</label><select name="t">${live().map(t=>`<option>${esc(t.name)}</option>`).join('')}</select><label>Travellers</label><input name="p" type="number" min="1" value="2"><label>Preferred month</label><input name="m" placeholder="e.g. December"><p><button class="btn wa">Send enquiry on WhatsApp</button></p></form></div></section>`
};
function deps(){const r=[];live().forEach(t=>t.dates.forEach(d=>r.push([d,t])));r.sort();return `<div class="tablewrap"><table><tr><th>Date</th><th>Tour</th><th>Price</th><th></th></tr>${r.slice(0,6).map(([d,t])=>`<tr><td>${fd(d)}</td><td>${esc(t.name)}</td><td>${inr(t.price)}</td><td><a class="btn sm wa" target="_blank" rel="noopener" href="${waLink('Enquiry: '+t.name+' departing '+fd(d))}">Book</a></td></tr>`).join('')}</table></div>`}
function tourPage(slug){const t=D.tours.find(x=>x.slug===slug);if(!t)return pages.tours();
 document.title=t.name+' | La Bhutanz Tours';
 return `<section class="sec wrap"><div class="two"><div class="card">${art(t.hue,'Sample photo')}</div><div><h1>${esc(t.name)}</h1><p class="muted">${t.days} days · ${esc(t.route)}</p><div class="price">${inr(t.price)} <span class="muted">per person</span></div><div class="chips">${t.highlights.map(h=>`<span>${esc(h)}</span>`).join('')}</div><h3>Departure dates</h3>${t.dates.length?t.dates.map(d=>`<p>${fd(d)} <a class="btn sm wa" target="_blank" rel="noopener" href="${waLink('Enquiry: '+t.name+' departing '+fd(d))}">Enquire on WhatsApp</a></p>`).join(''):'<p class="muted">Dates on request.</p>'}</div></div></section>`}

/* ---------- admin ---------- */
const field=(l,n,v,ty='text')=>`<label>${l}</label><input name="${n}" type="${ty}" value="${esc(v)}">`;
function admin(){
 if(!session)return `<section class="sec wrap"><div class="card body" style="max-width:380px;margin:auto"><h2>Admin login</h2><p class="muted">Demo only. Pick a role to see what each can do. The real build uses secure email login.</p><button class="btn" data-login="owner">Login as Owner</button> <button class="btn alt" data-login="staff">Login as Staff</button></div></section>`;
 const own=session.role==='owner';
 const tabs=[['overview','Overview'],['tours','Tours and prices'],['flights','Flights'],['enquiries','Enquiries'],...(own?[['users','Staff and settings']]:[])];
 const body={
  overview:()=>`<div class="stats"><div class="card stat">${D.tours.length}<b>${live().length} live</b>Tours</div><div class="card stat">Flights<b>${D.flights.length}</b></div><div class="card stat">New enquiries<b>${D.enquiries.filter(e=>e.status==='new').length}</b></div></div><p class="muted">Edit a price or date here, then open the public site tab to see it change instantly.</p>`,
  tours:()=>`<p><button class="btn sm" data-edit="tour:new">+ Add tour</button></p><div class="tablewrap"><table><tr><th>Tour</th><th>Days</th><th>Price</th><th>Dates</th><th>Status</th><th></th></tr>${D.tours.map(t=>`<tr><td>${esc(t.name)}</td><td>${t.days}</td><td>${inr(t.price)}</td><td>${t.dates.length}</td><td><span class="badge ${t.status==='live'?'':'off'}">${t.status}</span></td><td><button class="btn sm alt" data-edit="tour:${t.id}">Edit</button> ${own?`<button class="btn sm alt" data-del="tour:${t.id}">Delete</button>`:''}</td></tr>`).join('')}</table></div>`,
  flights:()=>`<p><button class="btn sm" data-edit="flight:new">+ Add flight</button></p><div class="tablewrap"><table><tr><th>Route</th><th>Flight</th><th>Time</th><th>Days</th><th>Fare</th><th>Seats</th><th></th></tr>${D.flights.map(f=>`<tr><td>${esc(f.route)}</td><td>${esc(f.airline)} ${esc(f.no)}</td><td>${esc(f.dep)} to ${esc(f.arr)}</td><td>${esc(f.days)}</td><td>${inr(f.price)}</td><td>${f.seats}</td><td><button class="btn sm alt" data-edit="flight:${f.id}">Edit</button> ${own?`<button class="btn sm alt" data-del="flight:${f.id}">Delete</button>`:''}</td></tr>`).join('')}</table></div>`,
  enquiries:()=>`<div class="tablewrap"><table><tr><th>Name</th><th>Tour</th><th>Date</th><th>Pax</th><th>Status</th></tr>${D.enquiries.map(e=>`<tr><td>${esc(e.name)}</td><td>${esc(e.tour)}</td><td>${fd(e.date)}</td><td>${e.pax}</td><td><select data-enq="${e.id}">${['new','contacted','booked','lost'].map(s=>`<option ${s===e.status?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('')}</table></div>`,
  users:()=>`<h3>Users</h3><div class="tablewrap"><table><tr><th>Name</th><th>Role</th></tr>${D.users.map(u=>`<tr><td>${esc(u.name)}</td><td>${u.role}</td></tr>`).join('')}</table></div><p class="muted">Owner can add staff. Staff can edit tours, prices, dates and flights but cannot delete or manage users.</p><h3>WhatsApp number</h3><form id="set">${field('Number with country code','wa',D.settings.wa)}<p><button class="btn sm">Save</button></p></form>`
 }[tab]();
 return `<div class="wrap admin"><aside class="side card body"><p class="muted">Signed in as <b>${session.role}</b></p>${tabs.map(([k,l])=>`<a href="#/admin" data-tab="${k}" class="${k===tab?'on':''}">${l}</a>`).join('')}<a href="#/admin" data-logout>Logout</a></aside><div>${body}</div></div>`}
function openForm(kind,id){
 const isT=kind==='tour',arr=isT?D.tours:D.flights,o=id==='new'?{}:arr.find(x=>x.id==id);
 const html=isT?`${field('Name','name',o.name)}<div class="two"><div>${field('Days','days',o.days||5,'number')}</div><div>${field('Price per person (INR)','price',o.price||0,'number')}</div></div>${field('Route','route',o.route)}${field('Highlights (comma separated)','hl',(o.highlights||[]).join(', '))}${field('Departure dates (comma separated, YYYY-MM-DD)','dates',(o.dates||[]).join(', '))}<label>Status</label><select name="status"><option ${o.status!=='draft'?'selected':''}>live</option><option ${o.status==='draft'?'selected':''}>draft</option></select>`
 :`${field('Route','route',o.route)}<div class="two"><div>${field('Airline','airline',o.airline)}</div><div>${field('Flight no.','no',o.no)}</div><div>${field('Departure','dep',o.dep,'time')}</div><div>${field('Arrival','arr',o.arr,'time')}</div><div>${field('Fare (INR)','price',o.price||0,'number')}</div><div>${field('Seats','seats',o.seats||0,'number')}</div></div>${field('Operating days','days',o.days)}`;
 const m=document.createElement('div');m.className='modal';m.innerHTML=`<form class="card"><h3>${id==='new'?'Add':'Edit'} ${kind}</h3>${html}<p><button class="btn">Save</button> <button type="button" class="btn alt" data-close>Cancel</button></p></form>`;
 document.body.appendChild(m);
 m.querySelector('[data-close]').onclick=()=>m.remove();
 m.querySelector('form').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
  let r;
  if(isT){const dates=f.dates.split(',').map(s=>s.trim()).filter(s=>/^\d{4}-\d{2}-\d{2}$/.test(s));
   r={name:f.name,days:+f.days,price:+f.price,route:f.route,highlights:f.hl.split(',').map(s=>s.trim()).filter(Boolean),dates,status:f.status};
   if(!o.id){r.slug=f.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');r.hue=Math.floor(Math.random()*360)}}
  else r={route:f.route,airline:f.airline,no:f.no,dep:f.dep,arr:f.arr,price:+f.price,seats:+f.seats,days:f.days};
  if(o.id)Object.assign(o,r);else arr.push({id:Date.now(),...r});
  save();m.remove();render()};
}
/* ---------- router ---------- */
function render(){
 const h=location.hash.replace('#/','')||'home',[p,arg]=h.split('/');
 document.title='La Bhutanz Tours | Custom Bhutan Trips from India';
 $('#app').innerHTML=p==='tour'?tourPage(arg):p==='admin'?admin():(pages[p]||pages.home)();
 $('#wafloat').href=waLink('Hi, I want to plan a Bhutan trip.');
 scrollTo(0,0);
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-login],[data-tab],[data-logout],[data-edit],[data-del]');if(!t)return;
 if(t.dataset.login){session={role:t.dataset.login};tab='overview';e.preventDefault();render()}
 else if(t.dataset.tab){tab=t.dataset.tab;e.preventDefault();render()}
 else if('logout' in t.dataset){session=null;e.preventDefault();render()}
 else if(t.dataset.edit){const[k,i]=t.dataset.edit.split(':');openForm(k,i)}
 else if(t.dataset.del&&confirm('Delete this item?')){const[k,i]=t.dataset.del.split(':');const key=k==='tour'?'tours':'flights';D[key]=D[key].filter(x=>x.id!=i);save();render()}});
document.addEventListener('change',e=>{if(e.target.dataset.enq){D.enquiries.find(x=>x.id==e.target.dataset.enq).status=e.target.value;save()}});
document.addEventListener('submit',e=>{
 if(e.target.id==='enq'){e.preventDefault();const f=Object.fromEntries(new FormData(e.target));open(waLink(`Hi, I'm ${f.n}. Interested in "${f.t}" for ${f.p} travellers in ${f.m||'flexible dates'}.`),'_blank')}
 if(e.target.id==='set'){e.preventDefault();D.settings.wa=String(new FormData(e.target).get('wa')).replace(/\D/g,'');save();alert('Saved')}});
addEventListener('hashchange',render);render();
