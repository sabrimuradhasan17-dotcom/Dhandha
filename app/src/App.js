import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, Alert, StatusBar, Switch, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { api, setToken, loadToken } from './api';
import { Btn, Input, Card, H, Muted, colors, STATUS_LABEL } from './ui';
import { payForBooking } from './pay';

const fail = (e) => Alert.alert('Oops', e.message);
const when = (iso) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

async function here() {
  const p = await Location.requestForegroundPermissionsAsync();
  if (p.status !== 'granted') throw new Error('Location permission is required');
  const { coords } = await Location.getCurrentPositionAsync({});
  return { lat: coords.latitude, lng: coords.longitude };
}

function usePoll(fn, ms = 8000) {
  const [data, setData] = useState(null);
  const load = () => fn().then(setData).catch(() => {});
  useEffect(() => {
    load();
    const t = setInterval(load, ms);
    return () => clearInterval(t);
  }, []);
  return [data, load];
}

/* ---------------------------------- Auth --------------------------------- */
function Auth({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('customer');
  const [f, setF] = useState({ name: '', phone: '', password: '' });
  const [cats, setCats] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  useEffect(() => { api('GET', '/categories').then(setCats).catch(() => {}); }, []);
  const submit = async () => {
    try {
      const body = mode === 'login' ? f : { ...f, role, categoryId };
      const r = await api('POST', `/auth/${mode === 'login' ? 'login' : 'register'}`, body);
      await setToken(r.token);
      if (r.pendingApproval) Alert.alert('Registered', 'An admin must approve your account before you can take jobs.');
      onAuthed(r.user);
    } catch (e) { fail(e); }
  };
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <H>Dhandha</H>
      <Muted>Trusted professionals at your doorstep</Muted>
      {mode === 'register' && (
        <>
          <Input placeholder="Full name" value={f.name} onChangeText={(name) => setF({ ...f, name })} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Btn title="I need services" kind={role === 'customer' ? 'primary' : 'ghost'} onPress={() => setRole('customer')} /></View>
            <View style={{ flex: 1 }}><Btn title="I'm a professional" kind={role === 'worker' ? 'primary' : 'ghost'} onPress={() => setRole('worker')} /></View>
          </View>
          {role === 'worker' && cats.map((c) => (
            <Btn key={c.id} title={c.name} kind={categoryId === c.id ? 'primary' : 'ghost'} onPress={() => setCategoryId(c.id)} />
          ))}
        </>
      )}
      <Input placeholder="10-digit phone" keyboardType="number-pad" maxLength={10} value={f.phone} onChangeText={(phone) => setF({ ...f, phone })} />
      <Input placeholder="Password" secureTextEntry value={f.password} onChangeText={(password) => setF({ ...f, password })} />
      <Btn title={mode === 'login' ? 'Log in' : 'Create account'} onPress={submit} />
      <Btn title={mode === 'login' ? 'New here? Sign up' : 'Have an account? Log in'} kind="ghost" onPress={() => setMode(mode === 'login' ? 'register' : 'login')} />
    </ScrollView>
  );
}

/* -------------------------------- Customer ------------------------------- */
function slots() {
  const out = [];
  for (let d = 0; d < 3; d++)
    for (const h of [9, 11, 14, 16, 18]) {
      const t = new Date(); t.setDate(t.getDate() + d); t.setHours(h, 0, 0, 0);
      if (t.getTime() > Date.now() + 3600e3) out.push(t);
    }
  return out;
}

function Browse({ onBook }) {
  const [cats, setCats] = useState([]);
  const [svcs, setSvcs] = useState([]);
  const [cat, setCat] = useState(null);
  useEffect(() => { api('GET', '/categories').then(setCats).catch(fail); }, []);
  useEffect(() => { if (cat) api('GET', `/services?categoryId=${cat.id}`).then(setSvcs).catch(fail); }, [cat]);
  if (cat)
    return (
      <>
        <Btn title="← Categories" kind="ghost" onPress={() => setCat(null)} />
        <H>{cat.name}</H>
        {svcs.map((s) => (
          <Card key={s.id} onPress={() => onBook(s)}>
            <Text style={{ fontWeight: '600', fontSize: 16 }}>{s.name}</Text>
            <Muted>{s.description} · {s.duration_min} min</Muted>
            <Text style={{ marginTop: 6, fontWeight: '700' }}>₹{s.price}</Text>
          </Card>
        ))}
      </>
    );
  return (
    <>
      <H>What do you need?</H>
      {cats.map((c) => <Card key={c.id} onPress={() => setCat(c)}><Text style={{ fontSize: 17 }}>{c.name}</Text></Card>)}
    </>
  );
}

function BookForm({ service, user, onDone, onCancel }) {
  const options = slots();
  const [slot, setSlot] = useState(options[0]);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [method, setMethod] = useState('online');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const loc = await here();
      const b = await api('POST', '/bookings', { serviceId: service.id, address, notes, ...loc, scheduledAt: slot.toISOString(), paymentMethod: method });
      if (method === 'online') {
        try { await payForBooking(b, user); } catch (e) { Alert.alert('Payment pending', `${e.message}\nYou can pay from My Bookings.`); }
      }
      onDone();
    } catch (e) { fail(e); }
    setBusy(false);
  };
  return (
    <>
      <Btn title="← Back" kind="ghost" onPress={onCancel} />
      <H>{service.name} · ₹{service.price}</H>
      <Muted>Pick a time</Muted>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 }}>
        {options.map((o) => (
          <View key={o.toISOString()} style={{ width: '48%' }}>
            <Btn title={when(o)} kind={slot.getTime() === o.getTime() ? 'primary' : 'ghost'} onPress={() => setSlot(o)} />
          </View>
        ))}
      </View>
      <Input placeholder="Full address (house, street, landmark)" value={address} onChangeText={setAddress} multiline />
      <Input placeholder="Notes for the professional (optional)" value={notes} onChangeText={setNotes} />
      <Muted>Payment</Muted>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Btn title="UPI / Card" kind={method === 'online' ? 'primary' : 'ghost'} onPress={() => setMethod('online')} /></View>
        <View style={{ flex: 1 }}><Btn title="Cash after service" kind={method === 'cash' ? 'primary' : 'ghost'} onPress={() => setMethod('cash')} /></View>
      </View>
      <Btn title={busy ? 'Booking…' : `Book now · ₹${service.price}`} disabled={busy || !address.trim()} onPress={submit} />
      <Muted>Your current location is used to match the nearest professional.</Muted>
    </>
  );
}

function BookingCard({ b, user, reload }) {
  const [stars, setStars] = useState(5);
  const act = (fn) => async () => { try { await fn(); reload(); } catch (e) { fail(e); } };
  return (
    <Card>
      <Text style={{ fontWeight: '700', fontSize: 16 }}>{b.service_name} · ₹{b.amount}</Text>
      <Muted>{when(b.scheduled_at)}</Muted>
      <Text style={{ color: colors.primary, marginVertical: 4 }}>{STATUS_LABEL[b.status]}</Text>
      {b.worker_name && <Muted>Professional: {b.worker_name} · {b.worker_phone}</Muted>}
      <Muted>{b.payment_method === 'cash' ? 'Cash' : 'Online'} · payment {b.payment_status}</Muted>
      {b.payment_method === 'online' && b.payment_status === 'pending' && b.status !== 'cancelled' && (
        <Btn title="Pay now" onPress={act(() => payForBooking(b, user))} />
      )}
      {['searching', 'assigned', 'unassigned'].includes(b.status) && (
        <Btn title="Cancel booking" kind="danger" onPress={() => Alert.alert('Cancel?', 'This cannot be undone.', [{ text: 'No' }, { text: 'Yes, cancel', onPress: act(() => api('POST', `/bookings/${b.id}/cancel`)) }])} />
      )}
      {b.status === 'completed' && !b.rating && (
        <>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((n) => <Text key={n} style={{ fontSize: 30 }} onPress={() => setStars(n)}>{n <= stars ? '★' : '☆'}</Text>)}
          </View>
          <Btn title="Submit rating" onPress={act(() => api('POST', `/bookings/${b.id}/rating`, { rating: stars }))} />
        </>
      )}
      {b.rating ? <Muted>You rated {'★'.repeat(b.rating)}</Muted> : null}
    </Card>
  );
}

function Bookings({ user }) {
  const [list, reload] = usePoll(() => api('GET', '/bookings'));
  if (!list) return <ActivityIndicator />;
  return (
    <>
      <H>My bookings</H>
      {list.length === 0 && <Muted>No bookings yet.</Muted>}
      {list.map((b) => <BookingCard key={b.id} b={b} user={user} reload={reload} />)}
    </>
  );
}

function Customer({ user }) {
  const [tab, setTab] = useState('browse');
  const [svc, setSvc] = useState(null);
  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {tab === 'browse' && !svc && <Browse onBook={setSvc} />}
        {tab === 'browse' && svc && <BookForm service={svc} user={user} onCancel={() => setSvc(null)} onDone={() => { setSvc(null); setTab('bookings'); }} />}
        {tab === 'bookings' && <Bookings user={user} />}
      </ScrollView>
      <Tabs tab={tab} setTab={setTab} items={[['browse', 'Services'], ['bookings', 'My bookings']]} />
    </>
  );
}

/* --------------------------------- Worker -------------------------------- */
function WorkerHome() {
  const [me, reloadMe] = usePoll(() => api('GET', '/auth/me'), 30000);
  const [offers, reloadOffers] = usePoll(() => api('GET', '/worker/offers'), 5000);
  const [jobs, reloadJobs] = usePoll(() => api('GET', '/worker/jobs'));
  const [earn, reloadEarn] = usePoll(() => api('GET', '/worker/earnings'), 30000);
  const reload = () => { reloadMe(); reloadOffers(); reloadJobs(); reloadEarn(); };
  const act = (fn) => async () => { try { await fn(); reload(); } catch (e) { fail(e); } };
  const toggle = async (v) => {
    try {
      const loc = v ? await here() : {};
      await api('PUT', '/worker/availability', { available: v, ...loc });
      reload();
    } catch (e) { fail(e); }
  };
  if (!me) return <ActivityIndicator />;
  const NEXT = { assigned: 'Start travel', on_the_way: 'Start service', in_progress: 'Complete job' };
  return (
    <>
      {!me.worker?.approved && <Card><Text>Your account is awaiting admin approval.</Text></Card>}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: '700', fontSize: 16 }}>{me.worker?.available ? 'You are online' : 'You are offline'}</Text>
          <Switch value={!!me.worker?.available} onValueChange={toggle} disabled={!me.worker?.approved} />
        </View>
        {earn && <Muted>{earn.jobs} jobs · earned ₹{earn.earned} · cash commission to remit ₹{earn.commission_owed_on_cash}</Muted>}
      </Card>
      <H>New job requests</H>
      {offers?.length === 0 && <Muted>None right now. Stay online to receive jobs.</Muted>}
      {offers?.map((o) => (
        <Card key={o.id}>
          <Text style={{ fontWeight: '700' }}>{o.service_name} · you earn ₹{o.earning}</Text>
          <Muted>{when(o.scheduled_at)} · {o.distance_km ?? '?'} km away</Muted>
          <Muted>{o.address} · {o.payment_method === 'cash' ? 'collect cash' : 'paid online'}</Muted>
          <Btn title="Accept" onPress={act(() => api('POST', `/worker/offers/${o.id}/accept`))} />
          <Btn title="Decline" kind="ghost" onPress={act(() => api('POST', `/worker/offers/${o.id}/decline`))} />
        </Card>
      ))}
      <H>My jobs</H>
      {jobs?.map((b) => (
        <Card key={b.id}>
          <Text style={{ fontWeight: '700' }}>{b.service_name} · ₹{b.amount}</Text>
          <Muted>{when(b.scheduled_at)} · {b.customer_name}</Muted>
          <Muted>{b.address}</Muted>
          <Text style={{ color: colors.primary, marginVertical: 4 }}>{STATUS_LABEL[b.status]}</Text>
          {NEXT[b.status] && <Btn title={NEXT[b.status]} onPress={act(() => api('POST', `/worker/jobs/${b.id}/advance`))} />}
        </Card>
      ))}
    </>
  );
}

/* ---------------------------------- Shell -------------------------------- */
function Tabs({ tab, setTab, items }) {
  return (
    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' }}>
      {items.map(([k, label]) => (
        <Text key={k} onPress={() => setTab(k)} style={{ flex: 1, textAlign: 'center', padding: 16, fontWeight: tab === k ? '700' : '400', color: tab === k ? colors.primary : colors.muted }}>{label}</Text>
      ))}
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    (async () => {
      if (!(await loadToken())) return setUser(null);
      try { setUser(await api('GET', '/auth/me')); } catch { await setToken(null); setUser(null); }
    })();
  }, []);
  const logout = async () => { await setToken(null); setUser(null); };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, paddingTop: StatusBar.currentHeight }}>
      {user === undefined ? <ActivityIndicator style={{ marginTop: 80 }} /> : user === null ? (
        <Auth onAuthed={setUser} />
      ) : user.role === 'admin' ? (
        <View style={{ padding: 20 }}><H>Use the web admin dashboard</H><Muted>Open the API URL in a browser to manage bookings and workers.</Muted><Btn title="Log out" onPress={logout} /></View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: colors.primary }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Hi, {user.name}</Text>
            <Text style={{ color: '#fff' }} onPress={logout}>Log out</Text>
          </View>
          {user.role === 'worker' ? <ScrollView contentContainerStyle={{ padding: 16 }}><WorkerHome /></ScrollView> : <Customer user={user} />}
        </>
      )}
    </SafeAreaView>
  );
}
