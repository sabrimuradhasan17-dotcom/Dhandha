/* SAMPLE content. Replace with real data from bhutanz.com once crawled. */
export const DEST=[
 {slug:'paro',name:'Paro',hue:25,photo:"Tiger's Nest Monastery",blurb:'Home to the only international airport and the iconic Tiger’s Nest, perched on a cliff above the valley.',best:'Mar to May, Sep to Nov',known:["Tiger's Nest hike",'Paro Dzong','Kyichu Lhakhang']},
 {slug:'thimphu',name:'Thimphu',hue:200,photo:'Buddha Dordenma',blurb:'The capital, where tradition meets modern Bhutan: giant Buddha, weekend market and craft shops.',best:'Mar to May, Sep to Nov',known:['Buddha Dordenma','Weekend market','Tashichho Dzong']},
 {slug:'punakha',name:'Punakha',hue:140,photo:'Punakha Dzong',blurb:'A warm, fertile valley with Bhutan’s most beautiful dzong at the meeting of two rivers.',best:'Feb to May, Sep to Nov',known:['Punakha Dzong','Suspension bridge','Chimi Lhakhang']},
 {slug:'gangtey',name:'Gangtey',hue:170,photo:'Phobjikha Valley',blurb:'A wide glacial valley where black-necked cranes winter and trails wander through quiet villages.',best:'Nov to Feb (cranes)',known:['Gangtey Monastery','Crane viewing','Nature trail']},
 {slug:'bumthang',name:'Bumthang',hue:45,photo:'Jakar Dzong',blurb:'The spiritual heartland of Bhutan, dotted with ancient temples, farmhouses and cheese and honey.',best:'Mar to Jun, Sep to Nov',known:['Jakar Dzong','Jambay Lhakhang','Tang valley']}
];
export const FAQ=[
 ['Do Indian citizens need a visa for Bhutan?','Indian citizens need a permit, not a visa. We arrange it for you. Passport or voter ID is required. [verify current rules]'],
 ['What is the Sustainable Development Fee (SDF)?','A per-night fee charged to visitors. Indian nationals pay a reduced rate. [verify current amount before launch]'],
 ['What is the best time to visit Bhutan?','March to May and September to November have the clearest views. Festivals (Tshechu) fall in spring and autumn.'],
 ['Can I customise a package?','Yes. Every trip is planned around your dates, pace and interests. Tell us on WhatsApp and we will build it.'],
 ['How do I book and pay?','Send an enquiry on WhatsApp. We confirm availability, share the itinerary and a payment link or bank details.'],
 ['Are flights included?','Packages are land-only by default. We can add flights to Paro. See the Flights page for current fares.']
];
export const SEED={
 settings:{wa:'919999999999',phone:'+91 99999 99999',email:'hello@example.com',address:'Mumbai, Maharashtra, India (sample)'},
 seo:{
  home:{t:'La Bhutanz Tours | Custom Bhutan Trips from India',d:'Custom Bhutan tour packages from Mumbai and India. Private guides, permits, handpicked stays. Prices in INR.'},
  tours:{t:'Bhutan Tour Packages from India | La Bhutanz',d:'Browse Bhutan packages from 6 to 10 days with prices in INR. Paro, Thimphu, Punakha, Gangtey and Bumthang.'},
  destinations:{t:'Bhutan Destinations Guide | La Bhutanz',d:'Explore Paro, Thimphu, Punakha, Gangtey and Bumthang. Best time, highlights and tours.'},
  flights:{t:'Flights to Paro, Bhutan from India | La Bhutanz',d:'Flight schedule and fares to Paro from Delhi, Kolkata, Bagdogra and Mumbai.'},
  blog:{t:'Bhutan Travel Blog | La Bhutanz',d:'Permit guides, festival dates and packing lists for your Bhutan trip.'},
  faq:{t:'Bhutan Travel FAQ | La Bhutanz',d:'Answers on permits, SDF, best time, payments and customising your Bhutan trip.'},
  about:{t:'About La Bhutanz Tours | Bhutan Specialists in Mumbai',d:'Mumbai-based Bhutan specialists working with licensed local partners and guides.'},
  plan:{t:'Plan Your Bhutan Trip | La Bhutanz',d:'Tell us your dates and interests and we will design your Bhutan itinerary on WhatsApp.'}
 },
 tours:[
  {id:1,slug:'bhutan-classic-6n7d',name:'Bhutan Classic: Paro, Thimphu, Punakha',price:42500,hue:25,photo:"Tiger's Nest",status:'live',route:'Paro > Thimphu > Punakha > Paro',highlights:["Tiger's Nest hike",'Punakha Dzong','Dochula Pass'],dates:['2026-11-14','2026-12-05','2027-01-16'],inclusions:['3-star hotels','Daily breakfast and dinner','Private car and guide','Permits and SDF','Airport transfers'],seoTitle:'Bhutan 6N/7D Package from India | Classic Tour',seoDesc:'7-day Bhutan Classic covering Paro, Thimphu and Punakha from INR 42,500 per person. Guide, permits and stays included.',
   itinerary:['Arrive Paro: Land at Paro, meet your guide, drive to Thimphu and settle in.','Thimphu: Buddha Dordenma, Memorial Chorten, craft shops and the weekend market.','Thimphu to Punakha: Cross Dochula Pass and visit Punakha Dzong.','Punakha: Chimi Lhakhang walk and the long suspension bridge.','Punakha to Paro: Scenic drive back with a stop at a village farmhouse.','Paro: Hike to Tiger’s Nest Monastery, then a hot stone bath.','Departure: Transfer to the airport with a farewell scarf.']},
  {id:2,slug:'bhutan-family-5n6d',name:'Bhutan Family Escape',price:36900,hue:40,photo:'Family at Punakha',status:'live',route:'Paro > Thimphu > Punakha',highlights:['Short easy drives','Archery','Farmhouse lunch'],dates:['2026-11-21','2026-12-19'],inclusions:['Family-friendly hotels','Breakfast and dinner','Private car','Guide','Permits'],seoTitle:'Bhutan Family Tour 6 Days | La Bhutanz',seoDesc:'A relaxed 6-day Bhutan trip for families with short drives, archery and farm visits from INR 36,900.',
   itinerary:['Arrive Paro: Airport pickup and a gentle walk around Paro town.','Paro to Thimphu: Try archery and meet locals at the weekend market.','Thimphu: Giant Buddha, takin reserve and a pottery stop.','Thimphu to Punakha: Dochula Pass and Punakha Dzong.','Punakha: River walk and farmhouse lunch.','Departure: Drive to Paro and fly out.']},
  {id:3,slug:'bhutan-tshechu-festival-8n9d',name:'Paro Tshechu Festival Journey',price:68000,hue:350,photo:'Tshechu mask dance',status:'live',route:'Paro > Thimphu > Punakha > Gangtey',highlights:['Masked dances','Gangtey valley','Local homestay'],dates:['2027-03-28'],inclusions:['4-star hotels and a homestay','All meals','Private car and guide','Festival entry','Permits'],seoTitle:'Paro Tshechu Festival Tour 2027 | La Bhutanz',seoDesc:'9-day Paro Tshechu journey with masked dances, Gangtey valley and a homestay from INR 68,000.',
   itinerary:['Arrive Paro: Check in and rest.','Paro Tshechu day 1: Sacred masked dances in the dzong courtyard.','Paro Tshechu day 2: Festival crowd, local food and the thongdrel unfurling.','Paro to Thimphu: Drive to the capital, city sights.','Thimphu: Textile Museum and craft village.','Thimphu to Punakha: Punakha Dzong at golden hour.','Punakha to Gangtey: Drive into the Phobjikha valley.','Gangtey: Nature trail and monastery visit, homestay dinner.','Departure: Return to Paro and fly out.']},
  {id:4,slug:'bhutan-heartland-bumthang-9n10d',name:'Heartland: Gangtey and Bumthang',price:89500,hue:150,photo:'Phobjikha Valley',status:'live',route:'Paro > Punakha > Gangtey > Bumthang',highlights:['Black-necked cranes','Jakar Dzong','Valley walks'],dates:['2026-12-12','2027-02-06'],inclusions:['Boutique lodges','All meals','Private car and guide','Domestic flight option','Permits'],seoTitle:'Bhutan Heartland Tour 10 Days | Bumthang',seoDesc:'10-day journey through Punakha, Gangtey and Bumthang from INR 89,500. Cranes, temples and valley walks.',
   itinerary:['Arrive Paro: Rest and short walk.','Paro: Tiger’s Nest hike.','Paro to Punakha: Via Thimphu and Dochula Pass.','Punakha: Dzong and river walk.','Punakha to Gangtey: Cranes and the nature trail.','Gangtey to Trongsa: Trongsa Dzong and museum.','Trongsa to Bumthang: Cross Yotong La into the heartland.','Bumthang: Jakar Dzong and Jambay Lhakhang.','Bumthang: Tang valley and a cheese factory visit.','Departure: Drive or fly back and exit via Paro.']},
  {id:5,slug:'bhutan-wellness-retreat-4n5d',name:'Meditation and Wellness Retreat',price:74000,hue:200,photo:'Monastery stay',status:'draft',route:'Paro > Thimphu',highlights:['Guided meditation','Hot stone bath','Monastery stay'],dates:[],inclusions:['Retreat lodge','Vegetarian meals','Guide','Permits'],seoTitle:'',seoDesc:'',
   itinerary:['Arrive Paro: Settle in and breathe.','Paro: Meditation session and hot stone bath.','Thimphu: Monastery stay and teachings.','Thimphu: Silent walk and craft visit.','Departure: Transfer to airport.']}
 ],
 flights:[
  {id:1,route:'Mumbai > Paro (via Delhi)',airline:'Drukair',no:'KB 201',dep:'06:10',arr:'13:20',price:31800,days:'Mon, Thu, Sat',seats:12},
  {id:2,route:'Delhi > Paro',airline:'Drukair',no:'KB 213',dep:'07:30',arr:'10:55',price:21500,days:'Daily',seats:20},
  {id:3,route:'Kolkata > Paro',airline:'Bhutan Airlines',no:'B3 702',dep:'08:45',arr:'10:05',price:17900,days:'Tue, Fri, Sun',seats:8},
  {id:4,route:'Bagdogra > Paro',airline:'Bhutan Airlines',no:'B3 770',dep:'11:00',arr:'11:50',price:14200,days:'Wed, Sat',seats:15},
  {id:5,route:'Guwahati > Paro',airline:'Drukair',no:'KB 217',dep:'09:20',arr:'10:40',price:16400,days:'Mon, Fri',seats:10}
 ],
 posts:[
  {id:1,slug:'bhutan-permit-for-indians',title:'Bhutan permit for Indians: documents and steps',status:'live',excerpt:'What you need to carry and how we process your entry permit.',body:'Indian citizens do not need a visa but do need an entry permit. Carry a passport (valid 6 months) or voter ID. We submit your details in advance so the permit is ready on arrival. [Sample article, replace with real copy.]'},
  {id:2,slug:'paro-tshechu-dates-2027',title:'Paro Tshechu 2027 dates and what to expect',status:'live',excerpt:'Plan around the most popular festival in Bhutan.',body:'Paro Tshechu is held in spring and features sacred masked dances and the unfurling of a giant thangka at dawn. Book early because hotels fill quickly. [Sample article.]'},
  {id:3,slug:'bhutan-packing-list',title:'What to pack for Bhutan in every season',status:'live',excerpt:'Layers, walking shoes and a few things people forget.',body:'Pack layers, a rain jacket, sturdy shoes for the Tiger’s Nest hike, sunscreen and a power bank. Dress modestly when visiting dzongs. [Sample article.]'}
 ],
 reviews:[
  {id:1,name:'Priya M., Pune',trip:'Bhutan Classic',rating:5,text:'Every detail was handled. Tiger’s Nest was unforgettable. (sample)'},
  {id:2,name:'Rahul S., Mumbai',trip:'Family Escape',rating:5,text:'Our guide felt like family and the kids loved the archery. (sample)'},
  {id:3,name:'Neha K., Delhi',trip:'Heartland',rating:4,text:'Quiet, authentic and well paced. Cranes in Gangtey were magical. (sample)'}
 ],
 enquiries:[
  {id:1,name:'Riya Shah',tour:'Bhutan Classic',when:'Dec 2026',pax:4,status:'new'},
  {id:2,name:'Amit Verma',tour:'Heartland',when:'Feb 2027',pax:2,status:'contacted'},
  {id:3,name:'Sana Khan',tour:'Custom trip',when:'Mar 2027',pax:6,status:'booked'}
 ],
 users:[{id:1,name:'Owner',role:'owner'},{id:2,name:'Staff',role:'staff'}]
};
