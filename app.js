'use strict';

// Versión de la app (se ve en la pantalla de inicio). Arreglos y ajustes: 0.x.y; novedades: 0.x.0.
const APP_VERSION = '0.2.2';
// Uso de la app en Vercel Analytics: es una sola página, así que cada función se cuenta como una
// página virtual. Solo se envía el nombre de la función, nunca datos de la app.
const track = (path) => { try { window.va?.('pageview', { path }); } catch (_) { /* sin analítica */ } };
const trackLabel = (label) => track(`/${label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`);
const STORAGE_KEY = 'tripctrl:v1';
const DISPLAY_KEY = 'tripctrl:display';
const INSTALL_HINT_KEY = 'tripctrl:installHint';
const SYNC_KEY = 'tripctrl:sync';
const LINK_KEY = 'tripctrl:docLink';
const LINK_DATA_KEY = 'tripctrl:docData';
const DOC_URL = 'https://doc-app-lovat.vercel.app/'; // DocCTRL: «?open=id» abre la ficha de esa partida

const ICONS = {
  // Plan y gastos
  plane: '<path d="M12 2.5c.8 0 1.4.7 1.4 1.6v5.4l7.6 4.6V16l-7.6-2.3v4.6l2.1 1.6v1.6L12 20.4l-3.5 1.1v-1.6l2.1-1.6v-4.6L3 16v-1.9l7.6-4.6V4.1c0-.9.6-1.6 1.4-1.6z"/>',
  train: '<rect x="6" y="3" width="12" height="14" rx="3"/><path d="M6 10h12"/><circle cx="9" cy="13.5" r=".8" fill="currentColor"/><circle cx="15" cy="13.5" r=".8" fill="currentColor"/><path d="M8.5 17l-2 4M15.5 17l2 4M9.5 6.5h5"/>',
  car: '<path d="M4 16.5V12l2-5h12l2 5v4.5"/><path d="M3.5 12h17"/><rect x="3.5" y="12" width="17" height="4.5" rx="1"/><circle cx="7.5" cy="14.2" r=".9" fill="currentColor"/><circle cx="16.5" cy="14.2" r=".9" fill="currentColor"/><path d="M6 16.5v2M18 16.5v2"/>',
  bed: '<path d="M3 18.5V6M3 14.5h18v4M21 14.5V12a2.5 2.5 0 0 0-2.5-2.5H11v5"/><circle cx="7" cy="11" r="1.8"/>',
  ticket: '<path d="M3.5 8.5V6a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v2.5a2.5 2.5 0 0 0 0 5V16a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-2.5a2.5 2.5 0 0 0 0-5z"/><path d="M14 5v12" stroke-dasharray="1.5 2"/>',
  food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 21V3c-2 1-3 3.5-3 7h3"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  bag: '<path d="M5.5 8h13l-1 12.5h-11z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M15 13.5h2.5"/>',
  suitcase: '<rect x="4" y="7" width="16" height="12.5" rx="2.5"/><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2"/><path d="M8.5 7v12.5M15.5 7v12.5"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5z"/>',
  route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7.5a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H16"/>',
  // Documentos
  id: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.6-1.6 1.7-2.4 3-2.4s2.4.8 3 2.4"/><path d="M14 10h4M14 13h4"/>',
  passport: '<rect x="5.5" y="3" width="13" height="18" rx="2"/><circle cx="12" cy="10.5" r="3.2"/><path d="M8.8 10.5h6.4M12 7.3c-1 .9-1.4 2-1.4 3.2s.4 2.3 1.4 3.2c1-.9 1.4-2 1.4-3.2s-.4-2.3-1.4-3.2z"/><path d="M9 17h6"/>',
  license: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><circle cx="8.5" cy="12" r="2.6"/><path d="M8.5 9.4v1.2M6.1 13l1.2-.4M10.9 13l-1.2-.4"/><path d="M14 10h4M14 13h4"/>',
  health: '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/><path d="M12 10.5v5M9.5 13h5"/>',
  shield: '<path d="M12 3.5l7 2.5v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  stamp: '<path d="M9.5 4.5h5l-.8 7h-3.4z"/><path d="M5 14.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2H5z"/><path d="M5 19.5h14"/>',
  // Interfaz
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/><path d="M10 11v5.5M14 11v5.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.3" r=".6" fill="currentColor"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M15.5 14.2c2.4-.4 4.4 1.2 5 4.3"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.9 1.2-1.8-.5-1-.1-2.2 1.1-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M4 17v1.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V17"/>',
  upload: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4 17v1.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V17"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9a4.75 4.75 0 0 1-.5 9.5z"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.34-5.66L20 8.5"/><path d="M20 4v4.5h-4.5"/>',
  logout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
  doc: '<path d="M6.5 3h7.5l4.5 4.5V20a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4.5h4.5"/><path d="M8.5 12h7M8.5 15.5h7"/>',
};
const icon = (name, size = 22) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.doc}</svg>`;

// Logo de TripCTRL: anillo fino, anillo discontinuo, arco (la ruta) y avión de líneas finas
let logoCount = 0;
function logoSVG(size) {
  const id = `tc-g${logoCount++}`;
  return `
    <svg class="logo-mark" viewBox="0 0 120 120" width="${size}" height="${size}" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <defs>
        <linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#e11d48"/><stop offset=".55" stop-color="#fb7185"/><stop offset="1" stop-color="#fecdd3"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" stroke="url(#${id})" stroke-width="1.2" opacity=".55"/>
      <circle cx="60" cy="60" r="42" stroke="url(#${id})" stroke-width=".8" stroke-dasharray="2 5" opacity=".6"/>
      <path class="logo-arc" pathLength="1" d="M60 8 A52 52 0 1 1 14.97 86" stroke="url(#${id})" stroke-width="3"/>
      <circle class="logo-dot" cx="14.97" cy="86" r="3" fill="#fb7185" stroke="none"/>
      <path transform="rotate(45 60 60)" d="M60 30c3 0 4 4 4 8v14l22 12v6l-22-6v12l7 5v5l-11-3-11 3v-5l7-5v-12l-22 6v-6l22-12v-14c0-4 1-8 4-8z" stroke="url(#${id})" stroke-width="1.8"/>
    </svg>`;
}
document.querySelectorAll('[data-logo]').forEach((el) => { el.innerHTML = logoSVG(Number(el.dataset.logo)); });
document.getElementById('app-version').textContent = `Versión ${APP_VERSION}`;

// ---------- Catálogos ----------

// Destino: decide qué documentos hacen falta
const REGIONS = {
  es: { label: 'España', icon: 'pin' },
  eu: { label: 'Europa (UE y Schengen)', short: 'Europa', icon: 'route' },
  world: { label: 'Resto del mundo', short: 'Internacional', icon: 'globe' },
};

// Partes del plan. `cat`: dónde suma su coste en los gastos · `until`: tienen fecha de fin (alojamiento, coche)
const KINDS = {
  flight: { label: 'Vuelo', icon: 'plane', ph: 'IB3250 Madrid → Roma', time: 'Salida', cat: 'transport' },
  train: { label: 'Tren o bus', icon: 'train', ph: 'AVE Madrid → Barcelona', time: 'Salida', cat: 'transport' },
  car: { label: 'Coche de alquiler', icon: 'car', ph: 'Recogida en el aeropuerto', time: 'Recogida', until: 'Devolución', cat: 'transport' },
  hotel: { label: 'Alojamiento', icon: 'bed', ph: 'Hotel, apartamento…', time: 'Entrada', until: 'Salida', cat: 'stay' },
  activity: { label: 'Actividad o entrada', icon: 'ticket', ph: 'Museo, excursión, concierto…', time: 'Hora', cat: 'activities' },
  food: { label: 'Restaurante', icon: 'food', ph: 'Cena en…', time: 'Hora', cat: 'food' },
  other: { label: 'Otro', icon: 'pin', ph: 'Lo que quieras apuntar', time: 'Hora', cat: 'other' },
};

const EXP_CATS = {
  transport: { label: 'Transporte', icon: 'plane', k: 'flight' },
  stay: { label: 'Alojamiento', icon: 'bed', k: 'hotel' },
  food: { label: 'Comida', icon: 'food', k: 'food' },
  activities: { label: 'Actividades', icon: 'ticket', k: 'activity' },
  shopping: { label: 'Compras', icon: 'bag', k: 'train' },
  other: { label: 'Otros', icon: 'wallet', k: 'other' },
};

// Documentos que se comprueban en DocCTRL (sus tipos) y lo que se pide según el destino
const DOC_TYPES = { dni: 'DNI', passport: 'Pasaporte', tse: 'Tarjeta sanitaria europea', license: 'Carnet de conducir' };
function personReqs(trip) {
  const car = trip.plan.some((p) => p.kind === 'car');
  const r = trip.region === 'world'
    ? [{ key: 'passport', label: 'Pasaporte', icon: 'passport', types: ['passport'], six: true }]
    : [{ key: 'id', label: trip.region === 'es' ? 'DNI' : 'DNI o pasaporte', icon: 'id', types: trip.region === 'es' ? ['dni'] : ['dni', 'passport'] }];
  if (trip.region === 'eu') r.push({ key: 'tse', label: 'Tarjeta sanitaria europea', icon: 'health', types: ['tse'], optional: true });
  if (car) r.push({ key: 'license', label: 'Carnet de conducir', icon: 'license', types: ['license'] });
  return r;
}
// Lo que no está en DocCTRL: se marca a mano, una vez por viaje
function tripReqs(trip) {
  const car = trip.plan.some((p) => p.kind === 'car');
  const r = [];
  if (trip.region === 'world') {
    r.push({ key: 'visa', label: 'Visado o autorización de entrada', hint: 'ESTA (EE. UU.), eTA (Canadá), ETA (Reino Unido)… Compruébalo en la web de Exteriores.', icon: 'stamp' });
    r.push({ key: 'insurance', label: 'Seguro de viaje', hint: 'Fuera de Europa la sanidad pública no te cubre.', icon: 'shield' });
    if (car) r.push({ key: 'idp', label: 'Permiso internacional de conducir', hint: 'Se pide en la DGT; algunos países lo exigen.', icon: 'license' });
  }
  return r;
}

const PACK_BASE = ['DNI o pasaporte', 'Tarjetas y algo de efectivo', 'Cargador del móvil', 'Batería externa', 'Auriculares', 'Medicinas', 'Neceser', 'Ropa interior y calcetines', 'Pijama', 'Calzado cómodo', 'Gafas de sol'];
const PACK_WORLD = ['Adaptador de enchufe', 'Copia del seguro de viaje'];

// ---------- Utilidades ----------

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const normalize = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const normName = (s) => normalize(s).trim();
const isISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const todayISO = () => { const t = new Date(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; };
const fmtDate = (iso) => (isISO(iso) ? `${iso.slice(8)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : iso || '');
const toDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const fmtDay = (iso, opts) => toDate(iso).toLocaleDateString('es-ES', opts).replace(/\./g, '');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function daysBetween(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5);
}
const daysUntil = (iso) => daysBetween(todayISO(), iso);
function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
function addMonths(iso, months) {
  const [y, m, d] = iso.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return `${first.getUTCFullYear()}-${pad(first.getUTCMonth() + 1)}-${pad(Math.min(d, last))}`;
}
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
// Importes escritos a la española («1.250,50») o con punto decimal («1250.5»)
function num(v) {
  let s = String(v ?? '').replace(/[\s€]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}
const eur = (n) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (_) {
    return false;
  }
}

function toast(text) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = text;
  document.body.append(el);
  setTimeout(() => el.remove(), 2600);
}

// ---------- Datos ----------
// people: [{id, name, at}] (viajeros) · trips: [{id, name, region, start, end, people: [id], budget, notes,
//   plan: [{id, kind, date, time, until, title, place, ref, cost, notes}],
//   expenses: [{id, concept, amount, cat, date}], pack: [{id, text, done}],
//   checks: {clave: true} (documentos marcados a mano), at (ms del último cambio)}]
// deleted: {id: ms} de viajes y viajeros borrados (para que la sincronización respete los borrados).

const str = (v) => String(v ?? '').trim();
function cleanTrip(t) {
  const arr = (a) => (Array.isArray(a) ? a.filter((x) => x && x.id) : []);
  const start = isISO(t.start) ? t.start : todayISO();
  return {
    id: String(t.id),
    name: str(t.name) || 'Viaje',
    region: REGIONS[t.region] ? t.region : 'eu',
    start,
    end: isISO(t.end) && t.end >= start ? t.end : start,
    people: Array.isArray(t.people) ? t.people.map(String) : [],
    budget: str(t.budget),
    notes: str(t.notes),
    plan: arr(t.plan).map((p) => ({
      id: String(p.id), kind: KINDS[p.kind] ? p.kind : 'other', date: isISO(p.date) ? p.date : '', time: /^\d{2}:\d{2}$/.test(p.time || '') ? p.time : '',
      until: isISO(p.until) ? p.until : '', title: str(p.title), place: str(p.place), ref: str(p.ref), cost: str(p.cost), notes: str(p.notes),
    })),
    expenses: arr(t.expenses).map((x) => ({ id: String(x.id), concept: str(x.concept), amount: str(x.amount), cat: EXP_CATS[x.cat] ? x.cat : 'other', date: isISO(x.date) ? x.date : '' })),
    pack: arr(t.pack).map((x) => ({ id: String(x.id), text: str(x.text), done: !!x.done })).filter((x) => x.text),
    checks: Object.fromEntries(Object.entries(t.checks || {}).filter(([, v]) => v === true)),
    at: Number(t.at) || 0,
  };
}
function cleanData(d) {
  const people = Array.isArray(d?.people) ? d.people.filter((p) => p?.id && p.name).map((p) => ({ id: String(p.id), name: String(p.name), at: Number(p.at) || 0 })) : [];
  const trips = (Array.isArray(d?.trips) ? d.trips : []).filter((t) => t?.id).map(cleanTrip);
  const deleted = Object.fromEntries(Object.entries(d?.deleted || {}).filter(([, v]) => Number.isFinite(v)));
  return { people: people.length || d?.people ? people : [{ id: 'p1', name: 'Yo', at: 0 }], trips, deleted };
}

let data = cleanData(load(STORAGE_KEY, null));
let filter = 'next'; // 'next' · 'past' · 'all'
let query = '';

// Guarda en el dispositivo y sube los cambios a la nube (si está activada)
function persist() {
  if (!save(STORAGE_KEY, data)) toast('No se han podido guardar los datos en este dispositivo.');
  queueSync();
}
const touch = (trip) => { trip.at = Date.now(); persist(); };

const personName = (id) => data.people.find((p) => p.id === id)?.name || '';
const tripPeople = (t) => t.people.filter((id) => data.people.some((p) => p.id === id));
const tripLen = (t) => daysBetween(t.start, t.end) + 1;
const findTrip = (id) => data.trips.find((t) => t.id === id);

function fmtRange(t) {
  const sameYear = t.start.slice(0, 4) === t.end.slice(0, 4);
  const a = fmtDay(t.start, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
  const b = fmtDay(t.end, { day: 'numeric', month: 'short', year: 'numeric' });
  return t.start === t.end ? b : `${a} – ${b}`;
}

// Situación del viaje: próximo (en N días), en curso (día X de N) o pasado
function tripWhen(t) {
  const today = todayISO();
  if (today < t.start) {
    const n = daysUntil(t.start);
    return { state: 'next', days: n, text: n === 1 ? 'Mañana' : n < 60 ? `En ${n} días` : `En ${Math.round(n / 30.4)} meses` };
  }
  if (today <= t.end) {
    const day = daysBetween(t.start, today) + 1;
    return { state: 'now', days: 0, text: `En curso · día ${day} de ${tripLen(t)}` };
  }
  const n = -daysUntil(t.end);
  return { state: 'past', days: n, text: n < 60 ? `Hace ${plural(n, 'día', 'días')}` : n < 365 ? `Hace ${Math.round(n / 30.4)} meses` : `Hace ${plural(Math.round(n / 365), 'año', 'años')}` };
}

// Costes: lo reservado en el plan más los gastos apuntados
function tripCosts(t) {
  const byCat = Object.fromEntries(Object.keys(EXP_CATS).map((k) => [k, 0]));
  let booked = 0;
  let spent = 0;
  for (const p of t.plan) { const c = num(p.cost); booked += c; byCat[KINDS[p.kind].cat] += c; }
  for (const x of t.expenses) { const c = num(x.amount); spent += c; byCat[x.cat] += c; }
  return { booked, spent, total: booked + spent, byCat, budget: num(t.budget) };
}

function visibleTrips() {
  const q = normalize(query.trim());
  const today = todayISO();
  return data.trips.filter((t) => {
    if (filter === 'next' && t.end < today) return false;
    if (filter === 'past' && t.end >= today) return false;
    if (!q) return true;
    const hay = [t.name, t.notes, REGIONS[t.region].label, ...tripPeople(t).map(personName), ...t.plan.flatMap((p) => [p.title, p.place, p.ref, p.notes])].map(normalize).join(' ');
    return q.split(/\s+/).every((w) => hay.includes(w));
  }).sort((a, b) => (filter === 'past' ? (a.start < b.start ? 1 : -1) : (a.start < b.start ? -1 : 1)));
}

// ---------- Vínculo con DocCTRL ----------
// TripCTRL lee de DocCTRL el DNI, pasaporte, tarjeta sanitaria europea y carnet de conducir de cada
// persona (solo tipo y caducidad) para comprobar que estén en vigor durante el viaje. Hace falta la
// nube activada en las dos apps con el mismo usuario; la contraseña de DocCTRL se pide una vez para
// derivar aquí sus claves (nunca se guarda). Las personas se emparejan por su nombre.

let link = load(LINK_KEY, null);          // { username, user, auth, key }
let linkData = load(LINK_DATA_KEY, null); // { at, people: { nombre normalizado: { name, docs: [{id, type, exp}] } } }
let linkError = '';
let linkBusy = false;

async function derivePeerAccount(username, password) {
  const u = username.trim().toLowerCase();
  const base = await crypto.subtle.importKey('raw', utf8.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = (salt) => crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: utf8.encode(salt), iterations: PBKDF2_ITERATIONS }, base, 256);
  const [auth, key] = await Promise.all([bits(`docctrl-auth:${u}`), bits(`docctrl-enc:${u}`)]);
  return { username: u, user: await sha256hex(`docctrl-user:${u}`), auth: hex(auth), key: toB64(key) };
}
const linkErrorText = (err) => ({
  'peer-missing': 'No se encuentra tu cuenta de DocCTRL en la nube. Comprueba que el usuario es el mismo y que las dos apps usan la misma base de datos en Vercel.',
  'peer-auth': 'La contraseña de DocCTRL no es correcta.',
  'too-many': 'Demasiados intentos. Espera 15 minutos.',
}[err.message] || syncErrorText(err));

// De DocCTRL solo se guarda lo necesario: tipo, caducidad e id (para abrir la ficha). Ni números ni fotos.
function extractDocs(doc) {
  const people = {};
  for (const p of doc?.people ?? []) people[p.id] = { name: p.name, docs: [] };
  for (const it of doc?.items ?? []) {
    if (!DOC_TYPES[it.type] || !people[it.person]) continue;
    people[it.person].docs.push({ id: it.id, type: it.type, exp: isISO(it.f?.exp) ? it.f.exp : '' });
  }
  return Object.fromEntries(Object.values(people).map((p) => [normName(p.name), p]));
}

async function refreshLink({ interactive = false } = {}) {
  if (!sync || !link || linkBusy) return false;
  linkBusy = true;
  try {
    const out = await syncCall('peer-pull', { peer: { user: link.user, auth: link.auth } });
    linkData = { at: Date.now(), people: out.blob ? extractDocs(await decryptData(out.blob, link)) : {} };
    save(LINK_DATA_KEY, linkData);
    linkError = '';
    render();
    redrawDetail();
    return true;
  } catch (err) {
    console.warn(err);
    linkError = linkErrorText(err);
    if (interactive) toast(linkError);
    return false;
  } finally {
    linkBusy = false;
  }
}
const docPerson = (pid) => linkData?.people?.[normName(personName(pid))] ?? null;

// Estado de un documento de una persona para un viaje
// cls: ok · warn (pasaporte con menos de 6 meses tras la vuelta) · bad (caduca antes o durante) · missing · manual (sin DocCTRL)
function checkDoc(trip, pid, req) {
  const ticked = trip.checks[`${pid}:${req.key}`] === true;
  if (!linkData) return { cls: ticked ? 'ok' : 'manual', ticked, text: ticked ? 'Comprobado' : `Comprueba que esté en vigor hasta el ${fmtDate(trip.end)}` };
  const dp = docPerson(pid);
  const docs = (dp?.docs ?? []).filter((d) => req.types.includes(d.type));
  if (!docs.length) {
    return { cls: ticked ? 'ok' : 'missing', ticked, text: ticked ? 'Comprobado a mano' : dp ? 'No está en DocCTRL' : `${personName(pid)} no está en DocCTRL` };
  }
  // El que más dura (sin fecha de caducidad cuenta como en vigor)
  const best = docs.slice().sort((a, b) => (b.exp || '9999') .localeCompare(a.exp || '9999'))[0];
  const what = req.types.length > 1 ? `${DOC_TYPES[best.type]}: ` : '';
  if (!best.exp) return { cls: 'ok', doc: best, text: `${what}sin fecha de caducidad en DocCTRL` };
  if (best.exp < todayISO()) return { cls: 'bad', doc: best, text: `${what}caducado el ${fmtDate(best.exp)}` };
  if (best.exp < trip.start) return { cls: 'bad', doc: best, text: `${what}caduca antes de salir (${fmtDate(best.exp)})` };
  if (best.exp < trip.end) return { cls: 'bad', doc: best, text: `${what}caduca durante el viaje (${fmtDate(best.exp)})` };
  if (req.six && best.exp < addMonths(trip.end, 6)) return { cls: 'warn', doc: best, text: `${what}caduca el ${fmtDate(best.exp)}: muchos países piden 6 meses de validez desde la vuelta` };
  return { cls: 'ok', doc: best, text: `${what}en vigor hasta el ${fmtDate(best.exp)}` };
}

// Avisos pendientes de documentos de un viaje que aún no ha terminado
function docIssues(trip) {
  if (trip.end < todayISO()) return 0;
  let n = 0;
  for (const pid of tripPeople(trip)) {
    for (const req of personReqs(trip)) {
      const c = checkDoc(trip, pid, req);
      if (c.cls === 'bad' || c.cls === 'warn' || (!req.optional && (c.cls === 'missing' || c.cls === 'manual'))) n++;
    }
  }
  for (const req of tripReqs(trip)) if (!trip.checks[req.key]) n++;
  return n;
}

// ---------- Render ----------

function render() {
  renderSummary();
  renderFilters();
  renderList();
}

function renderSummary() {
  const today = todayISO();
  const upcoming = data.trips.filter((t) => t.end >= today).sort((a, b) => (a.start < b.start ? -1 : 1));
  const next = upcoming[0];
  const year = today.slice(0, 4);
  const daysYear = data.trips.reduce((s, t) => {
    const a = t.start < `${year}-01-01` ? `${year}-01-01` : t.start;
    const b = t.end > `${year}-12-31` ? `${year}-12-31` : t.end;
    return s + (a <= b ? daysBetween(a, b) + 1 : 0);
  }, 0);
  const issues = upcoming.reduce((s, t) => s + docIssues(t), 0);
  const w = next && tripWhen(next);
  $('summary').classList.toggle('alert', issues > 0);
  $('summary').innerHTML = `
    <p class="label">${w?.state === 'now' ? 'De viaje' : 'Próximo viaje'}</p>
    ${next ? `
    <button type="button" class="next-trip" data-open="${next.id}">
      <span class="big-stat">
        ${w.state === 'now' ? `<span class="big-ok">${icon('plane', 30)}</span>` : `<span class="big-number">${w.days}</span><span class="big-unit">${w.days === 1 ? 'día' : 'días'}</span>`}
        <span class="next-text"><b>${esc(next.name)}</b><small>${esc(w.state === 'now' ? w.text : fmtRange(next))}</small></span>
      </span>
    </button>` : `
    <div class="big-stat"><span class="big-ok">${icon('suitcase', 30)}</span><span class="big-label">${data.trips.length ? 'Ningún viaje a la vista' : 'Aún no hay viajes'}</span></div>`}
    <dl class="tiles">
      <div><dt>Próximos</dt><dd>${upcoming.length}</dd></div>
      <div><dt>Días en ${year}</dt><dd>${daysYear}</dd></div>
      <div class="${issues ? 't-soon' : ''}"><dt>Documentos</dt><dd>${issues ? issues : `<span class="t-ok">${icon('check', 22)}</span>`}</dd></div>
    </dl>`;
}

function renderFilters() {
  const today = todayISO();
  const counts = { next: data.trips.filter((t) => t.end >= today).length, past: data.trips.filter((t) => t.end < today).length, all: data.trips.length };
  $('people-row').innerHTML = [['next', 'Próximos'], ['past', 'Pasados'], ['all', 'Todos']].map(([k, l]) =>
    `<button type="button" class="chip ${filter === k ? 'on' : ''}" data-filter="${k}">${l}<span>${counts[k]}</span></button>`).join('');
}

function tripCard(t) {
  const w = tripWhen(t);
  const issues = docIssues(t);
  const who = tripPeople(t).map(personName).join(', ');
  const sub = [fmtRange(t), plural(tripLen(t), 'día', 'días'), data.people.length > 1 ? who : ''].filter(Boolean).join(' · ');
  return `
    <button type="button" class="item trip-card region-${t.region} ${w.state}" data-open="${t.id}">
      <span class="item-icon">${icon(REGIONS[t.region].icon, 22)}</span>
      <span class="item-main">
        <span class="item-title">${esc(t.name)}</span>
        <span class="item-sub">${esc(sub)}</span>
        <span class="trip-meta">
          <span class="item-exp ${w.state === 'past' ? 'past' : w.state === 'now' ? 'now' : 'ok'}">${esc(w.text)}</span>
          ${issues ? `<span class="item-exp soon">${icon('alert', 12)} ${plural(issues, 'documento', 'documentos')}</span>` : ''}
        </span>
      </span>
    </button>`;
}

function renderList() {
  const list = $('list');
  if (!data.trips.length) {
    list.innerHTML = `
      <div class="card empty">
        <span class="empty-logo">${logoSVG(72)}</span>
        <h2>¿A dónde vamos?</h2>
        <p class="muted">Apunta tus viajes con su plan día a día (vuelos, hoteles, entradas…), comprueba que los documentos de cada viajero estén en regla con DocCTRL, lleva los gastos y prepara la maleta.</p>
        <button type="button" class="done-btn" data-add>${icon('plus', 18)} Crear el primero</button>
        <button type="button" class="ghost-btn" data-demo>Ver un viaje de ejemplo</button>
      </div>`;
    return;
  }
  const trips = visibleTrips();
  if (!trips.length) {
    list.innerHTML = `<p class="muted center-note">${query ? 'Nada coincide con la búsqueda.' : filter === 'past' ? 'Aún no hay viajes pasados.' : 'No hay viajes a la vista. ¿Planeamos uno?'}</p>`;
    return;
  }
  list.innerHTML = `<div class="items">${trips.map(tripCard).join('')}</div>`;
}

// ---------- Hojas (ventanas inferiores) ----------

function openSheet(cls, label) {
  closeSheet();
  const back = document.createElement('div');
  back.className = 'sheet-backdrop';
  back.innerHTML = `<div class="sheet ${cls}" role="dialog" aria-modal="true" aria-label="${esc(label)}"></div>`;
  document.body.append(back);
  back.addEventListener('click', (e) => { if (e.target === back) closeSheet(); });
  return back.firstElementChild;
}
function closeSheet() {
  document.querySelector('.sheet-backdrop')?.remove();
  detail = null;
}
const sheetHead = (title, sub = '', cls = '', ic = '') => `
  <div class="sheet-head ${cls}">
    ${ic ? `<span class="item-icon">${icon(ic, 22)}</span>` : ''}
    <div class="head-text"><h2 class="sheet-title">${esc(title)}</h2>${sub ? `<p class="muted small">${esc(sub)}</p>` : ''}</div>
    <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button>
  </div>`;
const peopleChips = (selected) => `
  <div class="chips-wrap" id="ed-people">
    ${data.people.map((p) => `<button type="button" class="chip ${selected.includes(p.id) ? 'on' : ''}" data-pid="${esc(p.id)}">${esc(p.name)}</button>`).join('')}
  </div>`;

// Alta y edición de un viaje
function openTripEditor(id) {
  const t = id ? findTrip(id) : null;
  let region = t?.region || 'eu';
  let people = t ? [...t.people] : data.people.slice(0, 1).map((p) => p.id);
  const sheet = openSheet('editor-sheet tall', t ? 'Editar viaje' : 'Nuevo viaje');
  const start0 = t?.start || '';
  sheet.innerHTML = `
    ${sheetHead(t ? 'Editar viaje' : 'Nuevo viaje', '', `region-${region}`, 'suitcase')}
    <div class="fields">
      <label class="fld wide"><span>Destino</span><input id="tr-name" type="text" value="${esc(t?.name || '')}" placeholder="Roma, Japón, la playa…" autocomplete="off"></label>
      <label class="fld"><span>Ida</span><input id="tr-start" type="date" value="${esc(start0)}"></label>
      <label class="fld"><span>Vuelta</span><input id="tr-end" type="date" value="${esc(t?.end || '')}"></label>
    </div>
    <p class="opt-label">Dónde</p>
    <div class="seg wrap" id="tr-region">
      ${Object.entries(REGIONS).map(([k, r]) => `<button type="button" data-r="${k}" class="${region === k ? 'on' : ''}">${esc(r.short || r.label)}</button>`).join('')}
    </div>
    <p class="muted small" id="tr-region-note"></p>
    <p class="opt-label">Quién viaja</p>
    ${peopleChips(people)}
    <div class="fields">
      <label class="fld wide"><span>Presupuesto (€)</span><input id="tr-budget" type="text" inputmode="decimal" value="${esc(t?.budget || '')}" placeholder="Opcional" autocomplete="off"></label>
      <label class="fld wide"><span>Notas</span><textarea id="tr-notes" rows="2">${esc(t?.notes || '')}</textarea></label>
    </div>
    <div class="editor-actions">
      ${t ? `<button type="button" class="ghost-btn danger" id="tr-delete">${icon('trash', 18)} Eliminar</button>` : '<span></span>'}
      <button type="button" class="done-btn" id="tr-save">Guardar</button>
    </div>`;
  const q = (s) => sheet.querySelector(s);
  const note = () => {
    q('#tr-region-note').textContent = {
      es: 'Te recordaré el DNI de cada viajero.',
      eu: 'DNI o pasaporte en vigor y la tarjeta sanitaria europea.',
      world: 'Pasaporte con 6 meses de validez, visado y seguro de viaje.',
    }[region];
  };
  note();
  q('[data-close]').addEventListener('click', () => (t ? openTrip(t.id) : closeSheet()));
  q('#tr-region').addEventListener('click', (e) => {
    const b = e.target.closest('[data-r]');
    if (!b) return;
    region = b.dataset.r;
    sheet.querySelectorAll('#tr-region button').forEach((x) => x.classList.toggle('on', x === b));
    note();
  });
  q('#tr-start').addEventListener('change', () => { if (!q('#tr-end').value || q('#tr-end').value < q('#tr-start').value) q('#tr-end').value = q('#tr-start').value; });
  sheet.querySelectorAll('#ed-people .chip').forEach((b) => b.addEventListener('click', () => {
    const pid = b.dataset.pid;
    people = people.includes(pid) ? people.filter((x) => x !== pid) : [...people, pid];
    b.classList.toggle('on', people.includes(pid));
  }));
  q('#tr-save').addEventListener('click', () => {
    const name = q('#tr-name').value.trim();
    const start = q('#tr-start').value;
    const end = q('#tr-end').value || start;
    if (!name) return toast('Pon el destino');
    if (!start) return toast('Pon la fecha de ida');
    if (end < start) return toast('La vuelta es anterior a la ida');
    const rec = { name, start, end, region, people, budget: q('#tr-budget').value.trim(), notes: q('#tr-notes').value.trim(), at: Date.now() };
    let trip = t;
    if (t) Object.assign(t, rec);
    else { trip = cleanTrip({ id: uid(), ...rec }); data.trips.push(trip); }
    persist();
    if (!t) filter = trip.end < todayISO() ? 'past' : 'next';
    render();
    openTrip(trip.id);
    toast(t ? 'Cambios guardados' : 'Viaje creado');
  });
  q('#tr-delete')?.addEventListener('click', () => {
    if (!confirm(`¿Eliminar el viaje «${t.name}» con su plan, gastos y maleta? No se puede deshacer.`)) return;
    data.trips = data.trips.filter((x) => x !== t);
    data.deleted[t.id] = Date.now();
    persist();
    closeSheet();
    render();
    toast('Viaje eliminado');
  });
  if (!t) q('#tr-name').focus();
}

// ---------- Ficha del viaje (pestañas: Plan · Documentos · Gastos · Maleta) ----------

let detail = null; // { id, tab, sheet }
const TABS = [['plan', 'Plan'], ['docs', 'Papeles'], ['money', 'Gastos'], ['pack', 'Maleta']];

function openTrip(id, tab) {
  const t = findTrip(id);
  if (!t) return;
  const prevTab = detail?.id === id ? detail.tab : 'plan';
  const sheet = openSheet('detail-sheet tall', t.name);
  detail = { id, tab: tab || prevTab, sheet };
  drawDetail();
  sheet.addEventListener('click', onDetailClick);
  sheet.addEventListener('change', onDetailChange);
}
function redrawDetail() {
  if (detail && document.body.contains(detail.sheet)) drawDetail();
}

function drawDetail() {
  const t = findTrip(detail.id);
  if (!t) return closeSheet();
  const w = tripWhen(t);
  const issues = docIssues(t);
  const sheet = detail.sheet;
  const scroll = sheet.scrollTop;
  sheet.innerHTML = `
    <div class="sheet-head region-${t.region}">
      <span class="item-icon">${icon(REGIONS[t.region].icon, 22)}</span>
      <div class="head-text"><h2 class="sheet-title">${esc(t.name)}</h2>
        <p class="muted small">${esc([fmtRange(t), plural(tripLen(t), 'día', 'días'), REGIONS[t.region].short || REGIONS[t.region].label].join(' · '))}</p></div>
      <button class="icon-btn sm" type="button" data-edit aria-label="Editar viaje">${icon('edit', 17)}</button>
      <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button>
    </div>
    <div class="when-banner ${w.state}">
      ${icon(w.state === 'past' ? 'check' : w.state === 'now' ? 'plane' : 'clock', 18)}
      <span><b>${esc(w.text)}</b><small>${esc(tripPeople(t).map(personName).join(', ') || 'Sin viajeros')}</small></span>
    </div>
    <div class="seg tabs" role="tablist">
      ${TABS.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" class="${detail.tab === k ? 'on' : ''}" aria-selected="${detail.tab === k}">${l}${k === 'docs' && issues ? `<i class="dot-badge">${issues}</i>` : ''}</button>`).join('')}
    </div>
    <div class="tab-body">${{ plan: planTab, docs: docsTab, money: moneyTab, pack: packTab }[detail.tab](t)}</div>`;
  sheet.scrollTop = scroll;
}

// --- Plan día a día ---
function planTab(t) {
  const days = [];
  for (let d = t.start; d <= t.end; d = addDays(d, 1)) days.push(d);
  const items = t.plan.slice().sort((a, b) => `${a.date || '0'}${a.time || '99'}`.localeCompare(`${b.date || '0'}${b.time || '99'}`));
  const outside = items.filter((p) => !p.date || p.date < t.start || p.date > t.end);
  const row = (p) => {
    const k = KINDS[p.kind];
    const sub = [p.until && `${k.until} ${fmtDay(p.until, { weekday: 'short', day: 'numeric' })}`, p.place].filter(Boolean).join(' · ');
    return `
      <button type="button" class="plan-row k-${p.kind}" data-plan="${p.id}">
        <span class="plan-time">${p.time || ''}</span>
        <span class="plan-icon">${icon(k.icon, 18)}</span>
        <span class="item-main">
          <span class="plan-title">${esc(p.title || k.label)}</span>
          ${sub ? `<span class="item-sub">${esc(sub)}</span>` : ''}
          ${p.ref ? `<span class="plan-ref">${icon('ticket', 12)} ${esc(p.ref)}</span>` : ''}
        </span>
        ${num(p.cost) ? `<span class="plan-cost">${eur(num(p.cost))}</span>` : ''}
      </button>`;
  };
  // Alojamientos y coches que siguen activos ese día (sin repetir el día que empiezan)
  const ongoing = (d) => t.plan.filter((p) => p.until && p.date && p.date < d && p.until >= d);
  const today = todayISO();
  return `
    ${days.map((d, i) => {
      const list = items.filter((p) => p.date === d);
      const cont = ongoing(d);
      return `
        <section class="day ${d === today ? 'today' : ''}">
          <h3 class="day-title"><span>Día ${i + 1}</span>${esc(cap(fmtDay(d, { weekday: 'long', day: 'numeric', month: 'long' })))}
            <button type="button" class="day-add" data-add-plan="${d}" aria-label="Añadir al día ${i + 1}">${icon('plus', 16)}</button></h3>
          ${cont.map((p) => `<p class="day-cont k-${p.kind}">${icon(KINDS[p.kind].icon, 14)} ${esc(p.title || KINDS[p.kind].label)}${p.until === d ? ` · ${KINDS[p.kind].until.toLowerCase()} hoy` : ''}</p>`).join('')}
          ${list.length ? `<div class="plan-list">${list.map(row).join('')}</div>` : cont.length ? '' : '<p class="muted small day-empty">Día libre</p>'}
        </section>`;
    }).join('')}
    ${outside.length ? `<section class="day"><h3 class="day-title"><span>Fuera de fechas</span>Sin fecha o fuera del viaje</h3><div class="plan-list">${outside.map(row).join('')}</div></section>` : ''}
    ${t.notes ? `<div class="notes"><p class="opt-label">Notas</p><p>${esc(t.notes).replace(/\n/g, '<br>')}</p></div>` : ''}
    <div class="editor-actions">
      <button type="button" class="ghost-btn" data-ics>${icon('calendar', 17)} Al calendario</button>
      <button type="button" class="done-btn" data-add-plan="">${icon('plus', 17)} Añadir al plan</button>
    </div>`;
}

// --- Documentos (con DocCTRL) ---
function docsTab(t) {
  const reqs = personReqs(t);
  const people = tripPeople(t);
  const linkCard = !link
    ? `<div class="link-card">
        <span class="link-logo">${icon('link', 20)}</span>
        <span><b>Vincula DocCTRL</b><small>Para comprobar solo las caducidades del DNI, pasaporte, tarjeta sanitaria europea y carnet de cada viajero.</small></span>
        <button type="button" class="done-btn sm-btn" data-link>Vincular</button>
      </div>`
    : `<button type="button" class="link-card on" data-link>
        <span class="link-logo">${icon('link', 20)}</span>
        <span><b>DocCTRL vinculado</b><small>${esc(linkError || (linkData?.at ? `Datos del ${new Date(linkData.at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}` : 'Pendiente'))}</small></span>
        <span class="link-refresh" data-refresh-link aria-label="Actualizar">${icon('refresh', 18)}</span>
      </button>`;
  const docRow = (pid, req) => {
    const c = checkDoc(t, pid, req);
    const canTick = c.cls === 'manual' || c.cls === 'missing' || c.ticked;
    return `
      <div class="doc-row ${c.cls}">
        <span class="doc-icon">${icon(req.icon, 18)}</span>
        <span class="item-main"><span class="plan-title">${esc(req.label)}${req.optional ? ' <small class="muted">(recomendada)</small>' : ''}</span><span class="doc-state">${esc(c.text)}</span></span>
        ${c.doc ? `<a class="doc-open" href="${DOC_URL}?open=${encodeURIComponent(c.doc.id)}" target="_blank" rel="noopener" aria-label="Abrir en DocCTRL">${icon('external', 16)}</a>`
          : c.cls === 'missing' ? `<a class="doc-open" href="${DOC_URL}" target="_blank" rel="noopener" aria-label="Añadir en DocCTRL">${icon('plus', 16)}</a>` : ''}
        ${canTick ? `<button type="button" class="tick ${c.ticked ? 'on' : ''}" data-tick="${esc(`${pid}:${req.key}`)}" aria-label="Marcar como comprobado">${icon('check', 16)}</button>` : ''}
      </div>`;
  };
  const tr = tripReqs(t);
  return `
    ${linkCard}
    ${people.length ? people.map((pid) => `
      <section class="day">
        <h3 class="day-title"><span>${icon('people', 13)}</span>${esc(personName(pid))}${linkData && !docPerson(pid) ? '<small class="muted"> · no está en DocCTRL</small>' : ''}</h3>
        <div class="plan-list">${reqs.map((r) => docRow(pid, r)).join('')}</div>
      </section>`).join('') : '<p class="muted small">Añade viajeros al viaje (botón editar) para comprobar sus documentos.</p>'}
    ${tr.length ? `
      <section class="day">
        <h3 class="day-title"><span>${icon('globe', 13)}</span>Para todo el viaje</h3>
        <div class="plan-list">${tr.map((r) => `
          <div class="doc-row ${t.checks[r.key] ? 'ok' : 'manual'}">
            <span class="doc-icon">${icon(r.icon, 18)}</span>
            <span class="item-main"><span class="plan-title">${esc(r.label)}</span><span class="doc-state">${esc(r.hint)}</span></span>
            <button type="button" class="tick ${t.checks[r.key] ? 'on' : ''}" data-tick="${r.key}" aria-label="Marcar como hecho">${icon('check', 16)}</button>
          </div>`).join('')}</div>
      </section>` : ''}
    <p class="muted tiny">${linkData ? 'Toca ↗ para abrir el documento en DocCTRL. ' : ''}${t.region === 'world' ? 'Requisitos orientativos: confírmalos para tu destino en exteriores.gob.es.' : 'Dentro de la UE basta con el DNI o el pasaporte en vigor.'}</p>`;
}

// --- Gastos ---
function moneyTab(t) {
  const c = tripCosts(t);
  const n = Math.max(1, tripPeople(t).length);
  const pct = c.budget ? Math.min(100, (c.total / c.budget) * 100) : 0;
  const over = c.budget && c.total > c.budget;
  const cats = Object.entries(EXP_CATS).filter(([k]) => c.byCat[k]);
  const exps = t.expenses.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return `
    <div class="money-card">
      <div class="money-top">
        <span><small>Total del viaje</small><b>${eur(c.total)}</b></span>
        ${n > 1 ? `<span class="right"><small>Por persona</small><b>${eur(c.total / n)}</b></span>` : ''}
      </div>
      ${c.budget ? `
        <div class="bar ${over ? 'over' : ''}"><i style="width:${pct}%"></i></div>
        <p class="small ${over ? 'warn-line' : 'muted'}">${over ? `Te pasas ${eur(c.total - c.budget)} del presupuesto (${eur(c.budget)})` : `Quedan ${eur(c.budget - c.total)} de ${eur(c.budget)}`}</p>` : '<p class="muted small">Sin presupuesto: añádelo editando el viaje.</p>'}
      <dl class="mini-stats two">
        <div><dt>Reservado en el plan</dt><dd>${eur(c.booked)}</dd></div>
        <div><dt>Gastos apuntados</dt><dd>${eur(c.spent)}</dd></div>
      </dl>
    </div>
    ${cats.length ? `<div class="cat-bars">${cats.map(([k, x]) => `
      <div class="cat-bar k-${x.k}"><span class="cb-icon">${icon(x.icon, 16)}</span><span class="cb-name">${x.label}</span><span class="cb-val">${eur(c.byCat[k])}</span>
        <span class="cb-track"><i style="width:${(c.byCat[k] / c.total) * 100}%"></i></span></div>`).join('')}</div>` : ''}
    <p class="opt-label">Gastos</p>
    ${exps.length ? `<div class="plan-list">${exps.map((x) => `
      <button type="button" class="plan-row k-${EXP_CATS[x.cat].k}" data-exp="${x.id}">
        <span class="plan-icon">${icon(EXP_CATS[x.cat].icon, 18)}</span>
        <span class="item-main"><span class="plan-title">${esc(x.concept || EXP_CATS[x.cat].label)}</span><span class="item-sub">${esc([EXP_CATS[x.cat].label, x.date && fmtDay(x.date, { weekday: 'short', day: 'numeric', month: 'short' })].filter(Boolean).join(' · '))}</span></span>
        <span class="plan-cost">${eur(num(x.amount))}</span>
      </button>`).join('')}</div>` : '<p class="muted small">Apunta aquí lo que gastes allí: comidas, taxis, compras… Lo reservado en el plan ya cuenta.</p>'}
    <div class="editor-actions"><span></span><button type="button" class="done-btn" data-add-exp>${icon('plus', 17)} Añadir gasto</button></div>`;
}

// --- Maleta ---
function packTab(t) {
  const done = t.pack.filter((x) => x.done).length;
  return `
    ${t.pack.length ? `
      <div class="pack-head"><span>${done} de ${t.pack.length} preparados</span><div class="bar"><i style="width:${(done / t.pack.length) * 100}%"></i></div></div>
      <div class="pack-list">${t.pack.map((x) => `
        <div class="pack-row ${x.done ? 'done' : ''}">
          <button type="button" class="tick ${x.done ? 'on' : ''}" data-pack="${x.id}" aria-label="Preparado">${icon('check', 16)}</button>
          <span>${esc(x.text)}</span>
          <button type="button" class="pack-del" data-pack-del="${x.id}" aria-label="Quitar">${icon('close', 14)}</button>
        </div>`).join('')}</div>` : '<p class="muted small">Haz la lista de lo que te llevas y ve marcando lo que ya está en la maleta.</p>'}
    <form class="pack-add" data-pack-form>
      <input type="text" id="pack-input" placeholder="Añadir a la maleta…" autocomplete="off" enterkeyhint="done">
      <button type="submit" class="icon-btn sm" aria-label="Añadir">${icon('plus', 18)}</button>
    </form>
    <div class="row-btns">
      <button type="button" class="ghost-btn" data-pack-base>${icon('suitcase', 17)} Lista básica</button>
      ${done ? `<button type="button" class="ghost-btn" data-pack-reset>Desmarcar todo</button>` : ''}
    </div>`;
}

async function onDetailClick(e) {
  const t = findTrip(detail?.id);
  if (!t) return;
  const at = (sel) => e.target.closest(sel);
  if (at('[data-close]')) return closeSheet();
  if (at('[data-edit]')) return openTripEditor(t.id);
  const tab = at('[data-tab]');
  if (tab) { detail.tab = tab.dataset.tab; detail.sheet.scrollTop = 0; return drawDetail(); }
  const addPlan = at('[data-add-plan]');
  if (addPlan) return openPlanEditor(t.id, null, addPlan.dataset.addPlan || '');
  const plan = at('[data-plan]');
  if (plan) return openPlanEditor(t.id, plan.dataset.plan);
  if (at('[data-ics]')) return downloadICS(t);
  if (at('[data-add-exp]')) return openExpenseEditor(t.id);
  const exp = at('[data-exp]');
  if (exp) return openExpenseEditor(t.id, exp.dataset.exp);
  if (at('[data-refresh-link]')) { e.stopPropagation(); toast('Actualizando DocCTRL…'); return refreshLink({ interactive: true }); }
  if (at('[data-link]')) return openLinkSheet(t.id);
  const tick = at('[data-tick]');
  if (tick) {
    const k = tick.dataset.tick;
    if (t.checks[k]) delete t.checks[k]; else t.checks[k] = true;
    touch(t); render(); return drawDetail();
  }
  const pk = at('[data-pack]');
  if (pk) { const x = t.pack.find((y) => y.id === pk.dataset.pack); x.done = !x.done; touch(t); return drawDetail(); }
  const pd = at('[data-pack-del]');
  if (pd) { t.pack = t.pack.filter((y) => y.id !== pd.dataset.packDel); touch(t); return drawDetail(); }
  if (at('[data-pack-base]')) {
    const have = new Set(t.pack.map((x) => normName(x.text)));
    const add = [...PACK_BASE, ...(t.region === 'world' ? PACK_WORLD : []), ...(t.plan.some((p) => p.kind === 'car') ? ['Carnet de conducir'] : [])].filter((x) => !have.has(normName(x)));
    if (!add.length) return toast('Ya tienes la lista básica');
    t.pack.push(...add.map((text) => ({ id: uid(), text, done: false })));
    touch(t); drawDetail();
    return toast(`${plural(add.length, 'cosa añadida', 'cosas añadidas')}`);
  }
  if (at('[data-pack-reset]')) { t.pack.forEach((x) => { x.done = false; }); touch(t); return drawDetail(); }
}
function onDetailChange() {}
document.addEventListener('submit', (e) => {
  if (!e.target.matches('[data-pack-form]')) return;
  e.preventDefault();
  const t = findTrip(detail?.id);
  const input = e.target.querySelector('input');
  const text = input.value.trim();
  if (!t || !text) return;
  t.pack.push({ id: uid(), text, done: false });
  touch(t);
  drawDetail();
  detail.sheet.querySelector('#pack-input')?.focus();
});

// Alta y edición de una parte del plan
function openPlanEditor(tripId, planId, day = '') {
  const t = findTrip(tripId);
  const p = planId ? t.plan.find((x) => x.id === planId) : null;
  let kind = p?.kind || 'flight';
  const sheet = openSheet('editor-sheet tall', p ? 'Editar' : 'Añadir al plan');
  const draw = () => {
    const k = KINDS[kind];
    const cur = (id, fallback) => sheet.querySelector(id)?.value ?? fallback;
    const v = {
      title: cur('#pl-title', p?.title || ''), date: cur('#pl-date', p?.date || day || t.start), time: cur('#pl-time', p?.time || ''),
      until: cur('#pl-until', p?.until || ''), place: cur('#pl-place', p?.place || ''), ref: cur('#pl-ref', p?.ref || ''),
      cost: cur('#pl-cost', p?.cost || ''), notes: cur('#pl-notes', p?.notes || ''),
    };
    sheet.innerHTML = `
      ${sheetHead(p ? (p.title || k.label) : 'Añadir al plan', t.name, `k-${kind}`, k.icon)}
      <div class="type-grid kinds">
        ${Object.entries(KINDS).map(([key, x]) => `<button type="button" class="type-btn k-${key} ${kind === key ? 'on' : ''}" data-kind="${key}"><span>${icon(x.icon, 20)}</span>${esc(x.label)}</button>`).join('')}
      </div>
      <div class="fields">
        <label class="fld wide"><span>Qué</span><input id="pl-title" type="text" value="${esc(v.title)}" placeholder="${esc(k.ph)}" autocomplete="off"></label>
        <label class="fld"><span>Día</span><input id="pl-date" type="date" value="${esc(v.date)}"></label>
        <label class="fld"><span>${esc(k.time)}</span><input id="pl-time" type="time" value="${esc(v.time)}"></label>
        ${k.until ? `<label class="fld wide"><span>${esc(k.until)}</span><input id="pl-until" type="date" value="${esc(v.until)}"></label>` : ''}
        <label class="fld wide"><span>${kind === 'flight' || kind === 'train' ? 'Terminal, estación…' : 'Dirección o lugar'}</span><input id="pl-place" type="text" value="${esc(v.place)}" autocomplete="off"></label>
        <label class="fld"><span>Localizador o reserva</span><input id="pl-ref" type="text" value="${esc(v.ref)}" autocapitalize="characters" autocomplete="off"></label>
        <label class="fld"><span>Precio (€)</span><input id="pl-cost" type="text" inputmode="decimal" value="${esc(v.cost)}" autocomplete="off"></label>
        <label class="fld wide"><span>Notas</span><textarea id="pl-notes" rows="2">${esc(v.notes)}</textarea></label>
      </div>
      ${p?.place ? `<a class="ghost-btn wide-btn" href="https://maps.google.com/?q=${encodeURIComponent(p.place)}" target="_blank" rel="noopener">${icon('pin', 17)} Ver en el mapa</a>` : ''}
      ${p?.ref ? `<button type="button" class="ghost-btn wide-btn" data-copy="${esc(p.ref)}">${icon('copy', 17)} Copiar localizador</button>` : ''}
      <div class="editor-actions">
        ${p ? `<button type="button" class="ghost-btn danger" id="pl-delete">${icon('trash', 18)} Eliminar</button>` : '<span></span>'}
        <button type="button" class="done-btn" id="pl-save">Guardar</button>
      </div>`;
  };
  draw();
  sheet.addEventListener('click', async (e) => {
    if (e.target.closest('[data-close]')) return openTrip(t.id, 'plan');
    const kb = e.target.closest('[data-kind]');
    if (kb) { kind = kb.dataset.kind; return draw(); }
    const cp = e.target.closest('[data-copy]');
    if (cp) { try { await navigator.clipboard.writeText(cp.dataset.copy); toast('Copiado'); } catch (_) { toast('No se ha podido copiar'); } return; }
    if (e.target.closest('#pl-save')) {
      const g = (id) => sheet.querySelector(id)?.value.trim() ?? '';
      const rec = { kind, title: g('#pl-title'), date: g('#pl-date'), time: g('#pl-time'), until: KINDS[kind].until ? g('#pl-until') : '', place: g('#pl-place'), ref: g('#pl-ref'), cost: g('#pl-cost'), notes: g('#pl-notes') };
      if (rec.until && rec.date && rec.until < rec.date) return toast(`${KINDS[kind].until} anterior al día de inicio`);
      if (p) Object.assign(p, rec); else t.plan.push({ id: uid(), ...rec });
      t.plan = cleanTrip(t).plan;
      touch(t); render();
      openTrip(t.id, 'plan');
      return toast(p ? 'Cambios guardados' : 'Añadido al plan');
    }
    if (e.target.closest('#pl-delete')) {
      if (!confirm(`¿Quitar «${p.title || KINDS[p.kind].label}» del plan?`)) return;
      t.plan = t.plan.filter((x) => x !== p);
      touch(t); render();
      openTrip(t.id, 'plan');
    }
  });
}

// Alta y edición de un gasto
function openExpenseEditor(tripId, expId) {
  const t = findTrip(tripId);
  const x = expId ? t.expenses.find((y) => y.id === expId) : null;
  let cat = x?.cat || 'food';
  const today = todayISO();
  const sheet = openSheet('editor-sheet tall', x ? 'Editar gasto' : 'Nuevo gasto');
  sheet.innerHTML = `
    ${sheetHead(x ? 'Editar gasto' : 'Nuevo gasto', t.name, '', 'wallet')}
    <div class="fields">
      <label class="fld wide"><span>Importe (€)</span><input id="ex-amount" type="text" inputmode="decimal" value="${esc(x?.amount || '')}" autocomplete="off"></label>
      <label class="fld wide"><span>Concepto</span><input id="ex-concept" type="text" value="${esc(x?.concept || '')}" placeholder="Cena, taxi, souvenirs…" autocomplete="off"></label>
      <label class="fld wide"><span>Día</span><input id="ex-date" type="date" value="${esc(x?.date || (today >= t.start && today <= t.end ? today : t.start))}"></label>
    </div>
    <div class="type-grid kinds" id="ex-cats">
      ${Object.entries(EXP_CATS).map(([k, c]) => `<button type="button" class="type-btn k-${c.k} ${cat === k ? 'on' : ''}" data-cat="${k}"><span>${icon(c.icon, 20)}</span>${c.label}</button>`).join('')}
    </div>
    <div class="editor-actions">
      ${x ? `<button type="button" class="ghost-btn danger" id="ex-delete">${icon('trash', 18)} Eliminar</button>` : '<span></span>'}
      <button type="button" class="done-btn" id="ex-save">Guardar</button>
    </div>`;
  const q = (s) => sheet.querySelector(s);
  q('[data-close]').addEventListener('click', () => openTrip(t.id, 'money'));
  q('#ex-cats').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    cat = b.dataset.cat;
    sheet.querySelectorAll('#ex-cats .type-btn').forEach((y) => y.classList.toggle('on', y === b));
  });
  q('#ex-save').addEventListener('click', () => {
    const amount = q('#ex-amount').value.trim();
    if (!num(amount)) return toast('Pon el importe');
    const rec = { amount, concept: q('#ex-concept').value.trim(), date: q('#ex-date').value, cat };
    if (x) Object.assign(x, rec); else t.expenses.push({ id: uid(), ...rec });
    touch(t);
    openTrip(t.id, 'money');
    toast(x ? 'Cambios guardados' : 'Gasto apuntado');
  });
  q('#ex-delete')?.addEventListener('click', () => {
    t.expenses = t.expenses.filter((y) => y !== x);
    touch(t);
    openTrip(t.id, 'money');
  });
  if (!x) q('#ex-amount').focus();
}

// ---------- Calendario (.ics) ----------
// El viaje como evento de varios días y cada parte del plan: con hora, a esa hora (1 h); sin hora, de día completo.

function downloadICS(t) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const icsEsc = (s) => String(s).replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  const day = (iso) => iso.replace(/-/g, '');
  const ev = (uidv, summary, start, end, desc = '', loc = '') => [
    'BEGIN:VEVENT', `UID:${uidv}@tripctrl`, `DTSTAMP:${stamp}`, start, end, `SUMMARY:${icsEsc(summary)}`,
    ...(desc ? [`DESCRIPTION:${icsEsc(desc)}`] : []), ...(loc ? [`LOCATION:${icsEsc(loc)}`] : []), 'END:VEVENT',
  ];
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OmT Finance//TripCTRL//ES', 'CALSCALE:GREGORIAN',
    ...ev(t.id, `✈︎ ${t.name}`, `DTSTART;VALUE=DATE:${day(t.start)}`, `DTEND;VALUE=DATE:${day(addDays(t.end, 1))}`, 'Creado con TripCTRL.')];
  for (const p of t.plan) {
    if (!p.date) continue;
    const k = KINDS[p.kind];
    const desc = [p.ref && `Localizador: ${p.ref}`, p.notes].filter(Boolean).join('\n');
    if (p.time) {
      const [h, m] = p.time.split(':').map(Number);
      const s = `${day(p.date)}T${pad(h)}${pad(m)}00`;
      const e = `${day(p.date)}T${pad((h + 1) % 24)}${pad(m)}00`;
      lines.push(...ev(p.id, `${k.label}: ${p.title || k.label}`, `DTSTART:${s}`, h === 23 ? `DURATION:PT1H` : `DTEND:${e}`, desc, p.place));
    } else {
      lines.push(...ev(p.id, `${k.label}: ${p.title || k.label}`, `DTSTART;VALUE=DATE:${day(p.date)}`, `DTEND;VALUE=DATE:${day(addDays(p.until || p.date, 1))}`, desc, p.place));
    }
  }
  lines.push('END:VCALENDAR');
  const file = new File([lines.join('\r\n') + '\r\n'], `tripctrl-${normalize(t.name).replace(/[^a-z0-9]+/g, '-')}.ics`, { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ---------- Viajeros (menú ⋯) ----------

function openPeopleSheet() {
  const sheet = openSheet('people-sheet', 'Viajeros');
  const draw = () => {
    const docNames = Object.values(linkData?.people ?? {}).map((p) => p.name).filter((n) => !data.people.some((p) => normName(p.name) === normName(n)));
    sheet.innerHTML = `
      <h2 class="sheet-title">Viajeros</h2>
      <p class="muted small">Las personas con las que viajas. Si usas DocCTRL, ponles el mismo nombre que allí para comprobar sus documentos.</p>
      <div class="people-list">
        ${data.people.map((p) => `
          <div class="person-row" data-id="${esc(p.id)}">
            <input type="text" value="${esc(p.name)}" aria-label="Nombre" autocomplete="off">
            <span class="muted small">${data.trips.filter((t) => t.people.includes(p.id)).length}</span>
            <button type="button" class="alw-del" aria-label="Quitar">${icon('trash', 16)}</button>
          </div>`).join('')}
      </div>
      <div class="alw-add"><button class="text-btn" type="button" id="pp-add">${icon('plus', 16)} Añadir viajero</button></div>
      ${docNames.length ? `<button class="ghost-btn wide-btn" type="button" id="pp-doc">${icon('link', 16)} Traer de DocCTRL: ${esc(docNames.join(', '))}</button>` : ''}
      <div class="body-actions"><button class="done-btn" type="button" data-done>Listo</button></div>`;
    sheet.querySelectorAll('.person-row').forEach((row) => {
      const p = data.people.find((x) => x.id === row.dataset.id);
      row.querySelector('input').addEventListener('input', (e) => { if (e.target.value.trim()) { p.name = e.target.value.trim(); p.at = Date.now(); persist(); render(); } });
      row.querySelector('.alw-del').addEventListener('click', () => {
        const n = data.trips.filter((t) => t.people.includes(p.id)).length;
        if (n && !confirm(`${p.name} está en ${plural(n, 'viaje', 'viajes')}. Se quitará de ellos. ¿Continuar?`)) return;
        const now = Date.now();
        data.trips.forEach((t) => { if (t.people.includes(p.id)) { t.people = t.people.filter((x) => x !== p.id); t.at = now; } });
        data.people = data.people.filter((x) => x !== p);
        data.deleted[p.id] = now;
        persist(); render(); draw();
      });
    });
    sheet.querySelector('#pp-add').addEventListener('click', () => {
      const id = uid();
      data.people.push({ id, name: `Viajero ${data.people.length + 1}`, at: Date.now() });
      persist(); render(); draw();
      const input = sheet.querySelector(`.person-row[data-id="${id}"] input`);
      input.focus();
      input.select();
    });
    sheet.querySelector('#pp-doc')?.addEventListener('click', () => {
      docNames.forEach((name) => data.people.push({ id: uid(), name, at: Date.now() }));
      persist(); render(); draw();
      toast(`${plural(docNames.length, 'viajero añadido', 'viajeros añadidos')}`);
    });
    sheet.querySelector('[data-done]').addEventListener('click', closeSheet);
  };
  draw();
}

// ---------- Vínculo con DocCTRL (hoja) ----------

function openLinkSheet(backTo) {
  const sheet = openSheet('', 'Vincular con DocCTRL');
  const back = () => (backTo ? openTrip(backTo, 'docs') : closeSheet());
  const head = sheetHead('Vincular con DocCTRL', '', '', 'link');
  if (!sync) {
    sheet.innerHTML = `${head}
      <p class="muted small">TripCTRL lee de DocCTRL la caducidad del DNI, pasaporte, tarjeta sanitaria europea y carnet de conducir de cada viajero, y te avisa si alguno no llega al viaje.</p>
      <p class="muted small">Primero activa la <b>sincronización en la nube</b> aquí, con el mismo usuario que usas en DocCTRL.</p>
      <div class="body-actions"><button class="done-btn" type="button" data-go-sync>${icon('cloud', 17)} Ir a la nube</button></div>`;
    sheet.querySelector('[data-close]').addEventListener('click', back);
    sheet.querySelector('[data-go-sync]').addEventListener('click', openSyncSheet);
    return;
  }
  const names = Object.values(linkData?.people ?? {}).map((x) => x.name);
  sheet.innerHTML = `${head}
    ${link ? `
      <div class="notif-status ${linkError ? 'bad' : 'ok'}">${icon('link', 22)}<span><b>Vinculado como ${esc(link.username)}</b><small>${esc(linkError || (linkData?.at ? `Datos de DocCTRL del ${new Date(linkData.at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}` : 'Pendiente'))}</small></span></div>
      ${names.length ? `<p class="muted small">Personas en DocCTRL: ${names.map(esc).join(', ')}. Se emparejan por el nombre con los viajeros de TripCTRL.</p>` : ''}
      <p class="muted small">Solo se leen el tipo de documento y su caducidad: ni números ni fotos. Se actualiza solo al abrir la app.</p>
      <div class="row-btns">
        <button class="done-btn" type="button" data-now>${icon('refresh', 17)} Actualizar ahora</button>
        <button class="ghost-btn danger" type="button" data-off>Desvincular</button>
      </div>` : `
      <p class="muted small">Se usará la cuenta de la nube <b>${esc(sync.username)}</b>: introduce la contraseña de DocCTRL de ese mismo usuario. No se guarda: solo sirve para derivar aquí la clave que descifra tus datos de DocCTRL.</p>
      <label class="fld"><span>Contraseña de DocCTRL</span><input id="l-pass" type="password" autocomplete="current-password" maxlength="128"></label>
      <p class="form-error" id="l-err" role="alert"></p>
      <div class="body-actions"><button class="done-btn" type="button" data-go>Vincular</button></div>`}`;
  const q = (s) => sheet.querySelector(s);
  q('[data-close]').addEventListener('click', back);
  q('[data-now]')?.addEventListener('click', async () => { await refreshLink({ interactive: true }); openLinkSheet(backTo); });
  q('[data-off]')?.addEventListener('click', () => {
    link = null; linkData = null; linkError = '';
    try { localStorage.removeItem(LINK_KEY); localStorage.removeItem(LINK_DATA_KEY); } catch (_) {}
    render(); back();
    toast('Desvinculado de DocCTRL');
  });
  q('[data-go]')?.addEventListener('click', async () => {
    const pass = q('#l-pass').value;
    if (!pass) return void (q('#l-err').textContent = 'Introduce la contraseña.');
    const btn = q('[data-go]');
    btn.disabled = true;
    btn.textContent = 'Un momento…';
    link = await derivePeerAccount(sync.username, pass);
    if (await refreshLink()) {
      save(LINK_KEY, link);
      render(); back();
      toast('Vinculado con DocCTRL');
    } else {
      q('#l-err').textContent = linkError;
      link = load(LINK_KEY, null);
      btn.disabled = false;
      btn.textContent = 'Vincular';
    }
  });
  q('#l-pass')?.focus();
}

// ---------- Copia de seguridad (JSON) ----------

async function exportBackup() {
  const json = JSON.stringify({ app: 'TripCTRL', version: APP_VERSION, exported: new Date().toISOString(), data });
  const name = `tripctrl-copia-${todayISO()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  // En el móvil, el menú Compartir permite «Guardar en Archivos» o enviarlo
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Copia de TripCTRL' });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

$('import-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const obj = JSON.parse(await file.text());
    if (obj.app !== 'TripCTRL' || !obj.data) throw new Error('formato');
    const next = cleanData(obj.data);
    if (!confirm(`Se importarán ${plural(next.trips.length, 'viaje', 'viajes')} y se sustituirá todo lo guardado en este dispositivo. ¿Continuar?`)) return;
    const now = Date.now();
    next.trips.forEach((t) => { t.at = now; });
    next.people.forEach((pp) => { pp.at = now; });
    // Lo que había aquí y no está en la copia se marca como borrado (también en la nube)
    for (const x of [...data.trips, ...data.people]) if (!next.trips.some((y) => y.id === x.id) && !next.people.some((y) => y.id === x.id)) next.deleted[x.id] = now;
    data = next;
    persist();
    render();
    toast('Copia importada');
  } catch (_) {
    alert('El archivo no es una copia válida de TripCTRL.');
  }
});

// ---------- Sincronización en la nube (cifrada) ----------
// Igual que DocCTRL y TaskCTRL: usuario y contraseña derivan (PBKDF2) una clave para identificarse y
// otra, que nunca sale del dispositivo, para cifrar (AES-GCM). Sal propia («tripctrl-…»): mismo usuario
// que en las otras apps, cuenta distinta. Se fusiona viaje a viaje (gana el cambio más reciente y los
// borrados se respetan).
const SYNC_API = 'api/sync';
const SYNC_EVERY_MS = 3 * 60 * 1000; // sincronización periódica mientras la app está abierta
const PBKDF2_ITERATIONS = 310000;
const utf8 = new TextEncoder();

let sync = load(SYNC_KEY, null); // { username, user, auth, key, at }
const saveSync = () => { if (sync) save(SYNC_KEY, sync); else { try { localStorage.removeItem(SYNC_KEY); } catch (_) {} } };
let syncTimer = null;
let syncBusy = false;
let syncAgain = false;
let syncError = '';

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha256hex = async (text) => hex(await crypto.subtle.digest('SHA-256', utf8.encode(text)));
const toB64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (s) => Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0));

async function deriveAccount(username, password) {
  const u = username.trim().toLowerCase();
  const base = await crypto.subtle.importKey('raw', utf8.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = (salt) => crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: utf8.encode(salt), iterations: PBKDF2_ITERATIONS }, base, 256);
  const [auth, key] = await Promise.all([bits(`tripctrl-auth:${u}`), bits(`tripctrl-enc:${u}`)]);
  return { username: u, user: await sha256hex(`tripctrl-user:${u}`), auth: hex(auth), key: toB64(key) };
}

const aesKey = (account) => crypto.subtle.importKey('raw', fromB64(account.key), 'AES-GCM', false, ['encrypt', 'decrypt']);
async function encryptBytes(bytes, account = sync) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(account), bytes);
  return `${toB64(iv)}.${toB64(ct)}`;
}
async function decryptBytes(blob, account = sync) {
  const [iv, ct] = blob.split('.');
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, await aesKey(account), fromB64(ct));
}
const encryptData = (obj, account) => encryptBytes(utf8.encode(JSON.stringify(obj)), account);
const decryptData = async (blob, account) => JSON.parse(new TextDecoder().decode(await decryptBytes(blob, account)));

async function syncCall(action, extra = {}, account = sync) {
  const body = JSON.stringify({ action, user: account.user, auth: account.auth, ...extra });
  const res = await fetch(SYNC_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    // Al salir de la app, que la subida termine aunque se cierre (Safari lo limita a 64 KB)
    keepalive: document.hidden && body.length < 60000,
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(out.error || `http ${res.status}`), { status: res.status });
  return out;
}

const syncErrorText = (err) => ({
  auth: 'Usuario o contraseña incorrectos.',
  exists: 'Ese nombre de usuario ya existe. Elige otro o entra con tu cuenta.',
  'too-many': 'Demasiados intentos. Espera 15 minutos.',
  invite: 'La clave de registro no es correcta.',
  'not-configured': 'Falta conectar la base de datos en Vercel (Storage → Upstash Redis).',
  OperationError: 'No se han podido descifrar los datos de la nube.',
}[err.message || err.name] || 'No se pudo conectar con la nube. Se reintentará.');

// De cada viaje o viajero, la versión con el `at` más reciente; un borrado gana si es posterior
function mergeById(a, b, deleted) {
  const byId = new Map();
  for (const x of [...(a || []), ...(b || [])]) {
    const cur = byId.get(x.id);
    if (!cur || (x.at || 0) > (cur.at || 0)) byId.set(x.id, x);
  }
  return [...byId.values()].filter((x) => !(deleted[x.id] >= (x.at || 0)));
}
function mergeData(a, b) {
  const deleted = { ...(a.deleted || {}) };
  for (const [id, at] of Object.entries(b.deleted || {})) if (!(deleted[id] >= at)) deleted[id] = at;
  return { trips: mergeById(a.trips, b.trips, deleted), people: mergeById(a.people, b.people, deleted), deleted };
}
const cloudPart = (x) => ({ trips: x.trips, people: x.people, deleted: x.deleted });
const byIdSort = (arr) => (arr || []).slice().sort((p, q) => (p.id < q.id ? -1 : 1));
const syncSig = (x) => JSON.stringify([byIdSort(x.trips), byIdSort(x.people), Object.entries(x.deleted || {}).sort()]);

// Hay cambios locales: se suben en unos segundos (se agrupan)
function queueSync() {
  if (!sync) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncNow(), 1500);
}

async function syncNow({ interactive = false } = {}) {
  if (!sync) return false;
  if (syncBusy) { syncAgain = true; return false; }
  syncBusy = true;
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      const remote = await syncCall('pull');
      const cloud = remote.blob ? cleanData(await decryptData(remote.blob)) : null;
      const merged = cloud ? mergeData(data, cloud) : cloudPart(data);
      // Lo nuevo de la nube se aplica aquí
      if (syncSig(merged) !== syncSig(data)) {
        data = cleanData({ ...data, ...merged });
        save(STORAGE_KEY, data);
        render();
        redrawDetail();
      }
      // Y lo nuevo de aquí se sube
      if (cloud && syncSig(cloudPart(data)) === syncSig(cloud)) break;
      try {
        await syncCall('push', { blob: await encryptData(cloudPart(data)), baseRev: remote.rev });
        break;
      } catch (err) {
        if (err.status !== 409) throw err; // otro dispositivo subió justo antes: se vuelve a fusionar
      }
    }
    sync.at = Date.now();
    syncError = '';
    saveSync();
    return true;
  } catch (err) {
    console.warn(err);
    syncError = syncErrorText(err);
    if (interactive) toast(syncError);
    return false;
  } finally {
    syncBusy = false;
    if (syncAgain) { syncAgain = false; queueSync(); }
  }
}

function syncStatusText() {
  if (!sync) return 'Desactivada';
  if (syncError) return syncError;
  if (!sync.at) return 'Pendiente';
  const mins = Math.round((Date.now() - sync.at) / 60000);
  return `Al día · ${mins < 1 ? 'hace un momento' : mins < 60 ? `hace ${mins} min` : new Date(sync.at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}`;
}

function openSyncSheet() {
  const sheet = openSheet('tall', 'Sincronización en la nube');
  const head = sheetHead('Sincronización en la nube');

  const renderConnected = () => {
    sheet.innerHTML = `${head}
      <div class="notif-status ${syncError ? 'bad' : 'ok'}">${icon('cloud', 22)}<span><b>Conectado como ${esc(sync.username)}</b><small class="s-status">${esc(syncStatusText())}</small></span></div>
      <p class="muted small">Tus viajes se cifran en este dispositivo antes de subirse. Entra con el mismo usuario y contraseña en el móvil de quien viaja contigo, en tu tablet o en el ordenador para tenerlos también allí. Si cambiáis algo a la vez, se juntan los cambios.</p>
      <div class="row-btns">
        <button type="button" class="done-btn" data-now>${icon('refresh', 17)} Sincronizar ahora</button>
        <button type="button" class="ghost-btn" data-link>${icon('link', 17)} DocCTRL</button>
        <button type="button" class="ghost-btn danger" data-logout>${icon('logout', 17)} Desconectar</button>
      </div>`;
  };

  const renderForm = (mode = 'login') => {
    sheet.innerHTML = `${head}
      <p class="muted small">Para tener tus viajes en varios dispositivos, compartirlos con quien viaja contigo y vincular DocCTRL. Se cifran aquí con tu contraseña antes de subirse: nadie más puede leerlos, ni siquiera el servidor. <b>Si olvidas la contraseña no se pueden recuperar.</b></p>
      <div class="seg" role="group" aria-label="Cuenta">
        <button type="button" data-mode="login" class="${mode === 'login' ? 'on' : ''}">Ya tengo cuenta</button>
        <button type="button" data-mode="create" class="${mode === 'create' ? 'on' : ''}">Crear cuenta</button>
      </div>
      <label class="fld"><span>Usuario</span><input id="s-user" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="40" placeholder="El mismo que en DocCTRL" /></label>
      <label class="fld"><span>Contraseña</span><input id="s-pass" type="password" autocomplete="${mode === 'create' ? 'new-password' : 'current-password'}" maxlength="128" /></label>
      ${mode === 'create' ? `
      <label class="fld"><span>Repite la contraseña</span><input id="s-pass2" type="password" autocomplete="new-password" maxlength="128" /></label>
      <label class="fld"><span>Clave de registro</span><input id="s-invite" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="64" placeholder="Clave administrador" /></label>` : ''}
      <p class="form-error" id="s-error" role="alert"></p>
      <div class="body-actions"><button type="button" class="done-btn" id="s-go">${mode === 'create' ? 'Crear cuenta' : 'Entrar'}</button></div>`;
    const q = (sel) => sheet.querySelector(sel);
    q('#s-go').addEventListener('click', async () => {
      const err = q('#s-error');
      const username = q('#s-user').value.trim();
      const password = q('#s-pass').value;
      if (username.length < 3) return void (err.textContent = 'El usuario debe tener al menos 3 caracteres.');
      if (password.length < 8) return void (err.textContent = 'La contraseña debe tener al menos 8 caracteres.');
      if (mode === 'create' && password !== q('#s-pass2').value) return void (err.textContent = 'Las contraseñas no coinciden.');
      if (mode === 'create' && !q('#s-invite').value.trim()) return void (err.textContent = 'Introduce la clave de registro.');
      const btn = q('#s-go');
      btn.disabled = true;
      btn.textContent = 'Un momento…';
      err.textContent = '';
      try {
        const account = await deriveAccount(username, password);
        if (mode === 'create') await syncCall('register', { invite: q('#s-invite').value.trim() }, account);
        else await syncCall('pull', {}, account); // comprueba usuario y contraseña
        sync = { ...account, at: null };
        saveSync();
        const ok = await syncNow({ interactive: true });
        if (ok) toast(mode === 'create' ? 'Cuenta creada. Tus viajes ya están en la nube' : 'Conectado. Viajes sincronizados');
        renderConnected();
      } catch (e) {
        console.warn(e);
        err.textContent = syncErrorText(e);
        btn.disabled = false;
        btn.textContent = mode === 'create' ? 'Crear cuenta' : 'Entrar';
      }
    });
    q('#s-user').focus();
  };

  sheet.addEventListener('click', async (e) => {
    if (e.target.closest('[data-close]')) return closeSheet();
    const m = e.target.closest('[data-mode]');
    if (m) return renderForm(m.dataset.mode);
    if (e.target.closest('[data-link]')) return openLinkSheet();
    if (e.target.closest('[data-now]')) {
      sheet.querySelector('.s-status').textContent = 'Sincronizando…';
      await syncNow({ interactive: true });
      renderConnected();
    }
    if (e.target.closest('[data-logout]')) {
      if (!confirm('¿Desconectar este dispositivo? Los viajes se quedan en él, pero dejarán de sincronizarse (y el vínculo con DocCTRL dejará de actualizarse).')) return;
      sync = null;
      saveSync();
      renderForm();
      toast('Sincronización desactivada en este dispositivo');
    }
  });
  if (sync) renderConnected();
  else renderForm();
}

// Mientras la app está abierta, trae cada poco lo cambiado en otros dispositivos
setInterval(() => { if (!document.hidden) syncNow(); }, SYNC_EVERY_MS);

// ---------- Menú ⋯ ----------

const MENU = [
  { label: 'Viajeros', icon: 'people', run: () => openPeopleSheet() },
  { label: 'Vínculo con DocCTRL', icon: 'link', run: () => openLinkSheet() },
  { label: 'Sincronización en la nube', icon: 'cloud', run: () => openSyncSheet() },
  { label: 'Opciones de visualización', icon: 'palette', run: () => openDisplaySheet() },
  { label: 'Exportar copia', icon: 'download', run: () => exportBackup() },
  { label: 'Importar copia', icon: 'upload', run: () => $('import-input').click() },
];

function openMenu() {
  const menu = $('menu');
  menu.innerHTML = MENU.map((m, i) =>
    `<button class="menu-item" role="menuitem" data-i="${i}">${icon(m.icon, 20)}<span>${m.label}</span></button>`).join('');
  menu.querySelectorAll('.menu-item').forEach((b) => b.addEventListener('click', () => {
    closeMenu();
    trackLabel(MENU[b.dataset.i].label);
    MENU[b.dataset.i].run();
  }));
  const r = $('menu-btn').getBoundingClientRect();
  menu.style.top = `${r.bottom + 6}px`;
  menu.style.right = `${Math.max(8, window.innerWidth - r.right)}px`;
  menu.hidden = false;
  $('menu-btn').setAttribute('aria-expanded', 'true');
}
function closeMenu() {
  $('menu').hidden = true;
  $('menu-btn').setAttribute('aria-expanded', 'false');
}
$('menu-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  if ($('menu').hidden) openMenu();
  else closeMenu();
});
document.addEventListener('click', (e) => {
  if (!$('menu').hidden && !e.target.closest('#menu')) closeMenu();
});
window.addEventListener('resize', closeMenu);

// ---------- Opciones de visualización (modo y fondo) ----------

const WALLS = {
  coral: { name: 'Coral', c: ['251 113 133', '254 205 211', '251 146 60', '225 29 72'] },
  laguna: { name: 'Laguna', c: ['45 212 191', '153 246 228', '56 189 248', '13 148 136'] },
  atardecer: { name: 'Atardecer', c: ['251 146 60', '253 186 116', '244 114 182', '190 24 93'] },
  noche: { name: 'Noche', c: ['129 140 248', '165 180 252', '96 165 250', '67 56 202'] },
};
const lightQuery = matchMedia('(prefers-color-scheme: light)');
let display = { theme: 'auto', wall: 'coral', ...load(DISPLAY_KEY, {}) };
if (!WALLS[display.wall]) display.wall = 'coral';

function applyDisplay() {
  const light = display.theme === 'light' || (display.theme === 'auto' && lightQuery.matches);
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  document.documentElement.dataset.wall = display.wall;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', light ? '#fdf3f5' : '#120a0c');
}
lightQuery.addEventListener('change', () => { if (display.theme === 'auto') applyDisplay(); });

function wallPreview(key) {
  const [c1, c2, c3, c4] = WALLS[key].c;
  const light = document.documentElement.dataset.theme === 'light';
  const a = light ? 0.4 : 0.5;
  const base = light ? '#fdf3f5' : '#120a0c';
  return `radial-gradient(70% 60% at 15% 10%, rgb(${c1} / ${a}), transparent 70%), radial-gradient(60% 55% at 90% 25%, rgb(${c2} / ${a * 0.8}), transparent 72%),
    radial-gradient(70% 60% at 75% 95%, rgb(${c3} / ${a * 0.85}), transparent 70%), radial-gradient(60% 55% at 5% 85%, rgb(${c4} / ${a * 0.8}), transparent 72%), ${base}`;
}

function openDisplaySheet() {
  const sheet = openSheet('', 'Opciones de visualización');
  const draw = () => {
    sheet.innerHTML = `
      <h2 class="sheet-title">Opciones de visualización</h2>
      <p class="opt-label">Modo</p>
      <div class="seg" role="group" aria-label="Modo">
        ${[['dark', 'Oscuro'], ['light', 'Claro'], ['auto', 'Automático']].map(([v, l]) =>
          `<button type="button" data-theme-opt="${v}" class="${display.theme === v ? 'on' : ''}" aria-pressed="${display.theme === v}">${l}</button>`).join('')}
      </div>
      <p class="muted small">${display.theme === 'auto' ? 'Sigue el modo claro u oscuro del sistema.' : '&nbsp;'}</p>
      <p class="opt-label">Fondo</p>
      <div class="walls">
        ${Object.entries(WALLS).map(([k, w]) =>
          `<button type="button" class="wall ${display.wall === k ? 'on' : ''}" data-wall-opt="${k}" style="background:${wallPreview(k)}" aria-pressed="${display.wall === k}">${w.name}</button>`).join('')}
      </div>
      <div class="body-actions"><button class="done-btn" type="button" data-done>Listo</button></div>`;
    sheet.querySelectorAll('[data-theme-opt]').forEach((b) => b.addEventListener('click', () => {
      display.theme = b.dataset.themeOpt;
      save(DISPLAY_KEY, display);
      applyDisplay();
      draw();
    }));
    sheet.querySelectorAll('[data-wall-opt]').forEach((b) => b.addEventListener('click', () => {
      display.wall = b.dataset.wallOpt;
      save(DISPLAY_KEY, display);
      applyDisplay();
      draw();
    }));
    sheet.querySelector('[data-done]').addEventListener('click', closeSheet);
  };
  draw();
}

// ---------- Viaje de ejemplo ----------

function addDemoTrip() {
  const s = addDays(todayISO(), 24);
  const d = (n) => addDays(s, n);
  const pid = data.people[0]?.id;
  const trip = cleanTrip({
    id: uid(), name: 'Roma', region: 'eu', start: s, end: d(3), people: pid ? [pid] : [], budget: '1200',
    notes: 'Reservar la cena del sábado con antelación.',
    plan: [
      { id: uid(), kind: 'flight', date: s, time: '08:10', title: 'IB3250 Madrid → Roma', place: 'T4 · Barajas', ref: 'K7Q2XL', cost: '186' },
      { id: uid(), kind: 'hotel', date: s, time: '14:00', until: d(3), title: 'Hotel Santa Maria', place: 'Vicolo del Piede 2, Roma', ref: '4471902', cost: '520' },
      { id: uid(), kind: 'activity', date: d(1), time: '10:00', title: 'Museos Vaticanos y Capilla Sixtina', place: 'Viale Vaticano, Roma', cost: '34' },
      { id: uid(), kind: 'food', date: d(1), time: '21:00', title: 'Da Enzo al 29', place: 'Trastevere' },
      { id: uid(), kind: 'activity', date: d(2), time: '09:30', title: 'Coliseo y Foro Romano', place: 'Piazza del Colosseo', cost: '24' },
      { id: uid(), kind: 'flight', date: d(3), time: '19:40', title: 'IB3251 Roma → Madrid', place: 'Fiumicino T1', ref: 'K7Q2XL' },
    ],
    expenses: [{ id: uid(), concept: 'Tren al aeropuerto', amount: '14', cat: 'transport', date: s }],
    pack: PACK_BASE.slice(0, 6).map((text, i) => ({ id: uid(), text, done: i < 2 })),
    at: Date.now(),
  });
  data.trips.push(trip);
  filter = 'next';
  persist();
  render();
  openTrip(trip.id, 'plan');
}

// ---------- Eventos de la pantalla principal ----------

$('add-btn').addEventListener('click', () => openTripEditor());
$('search').addEventListener('input', (e) => { query = e.target.value; renderList(); });
$('people-row').addEventListener('click', (e) => {
  const b = e.target.closest('[data-filter]');
  if (!b) return;
  filter = b.dataset.filter;
  render();
});
document.querySelector('main').addEventListener('click', (e) => {
  const open = e.target.closest('[data-open]');
  if (open) return openTrip(open.dataset.open);
  if (e.target.closest('[data-add]')) return openTripEditor();
  if (e.target.closest('[data-demo]')) addDemoTrip();
});

// ---------- Pantalla de inicio ----------

// Sin botón Entrar: el logo aparece (el arco se dibuja), se ve un instante y se pasa sola a la app
// con la transición de cristal, como en ChatCTRL.
const SPLASH_HOLD_MS = 1700;
const SPLASH_OUT_MS = 1200;
function enterApp() {
  const body = document.body;
  if (!$('splash') || body.classList.contains('entering')) return;
  body.classList.add('entering');
  setTimeout(() => {
    $('splash').remove();
    body.classList.remove('booting', 'entering');
    maybeShowInstallHint();
  }, SPLASH_OUT_MS);
}
setTimeout(enterApp, SPLASH_HOLD_MS);

// ---------- Aviso: añadir a la pantalla de inicio (solo móvil y tablet) ----------

const ua = navigator.userAgent;
// El iPad con iPadOS se identifica como Mac, pero tiene pantalla táctil
const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

const HINT_ICONS = {
  share: '<path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M7 10.5H6a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1"/>',
  more: '<circle cx="12" cy="5.5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="18.5" r="1.5" fill="currentColor"/>',
  add: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};
const hintIcon = (name) =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${HINT_ICONS[name]}</svg>`;

function maybeShowInstallHint() {
  if (!(isIOS || isAndroid) || isStandalone()) return;
  if (load(INSTALL_HINT_KEY, null) === 'off') return;
  const steps = isIOS
    ? [
        ['share', 'Pulsa el botón <b>Compartir</b> de Safari (abajo en el iPhone, arriba en el iPad).'],
        ['add', 'Desliza hacia abajo y elige <b>Añadir a pantalla de inicio</b>.'],
        ['check', 'Pulsa <b>Añadir</b>. El icono de TripCTRL aparecerá junto a tus apps.'],
      ]
    : [
        ['more', 'Pulsa el menú <b>⋮</b> de Chrome, arriba a la derecha.'],
        ['add', 'Elige <b>Añadir a pantalla de inicio</b> o <b>Instalar aplicación</b>.'],
        ['check', 'Confirma con <b>Instalar</b>. El icono de TripCTRL aparecerá junto a tus apps.'],
      ];
  closeSheet();
  const back = document.createElement('div');
  back.className = 'sheet-backdrop center';
  back.innerHTML = `
    <div class="sheet install-sheet" role="dialog" aria-modal="true" aria-labelledby="install-title">
      <span class="install-logo">${logoSVG(56)}</span>
      <h2 class="sheet-title" id="install-title">Añade TripCTRL a tu pantalla de inicio</h2>
      <p class="muted small">Así la abrirás como una app más, a pantalla completa y con un solo toque.</p>
      <ol class="install-steps">
        ${steps.map(([ic, text]) => `<li><span class="step-icon">${hintIcon(ic)}</span><span>${text}</span></li>`).join('')}
      </ol>
      <div class="install-footer">
        <label class="no-more"><input type="checkbox" id="install-no-more" /> No mostrar más</label>
        <button class="done-btn" type="button" id="install-ok">Aceptar</button>
      </div>
    </div>`;
  document.body.append(back);
  back.querySelector('#install-ok').addEventListener('click', () => {
    if (back.querySelector('#install-no-more').checked) save(INSTALL_HINT_KEY, 'off');
    closeSheet();
  });
}

// ---------- Siempre en vertical y sin zoom ----------

try { screen.orientation?.lock?.('portrait').catch(() => {}); } catch (_) { /* no compatible */ }
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

navigator.storage?.persist?.().catch(() => {});

// ---------- Difuminado del contenido sobre el botón de abajo (como en UnderCTRL y Up to 40%) ----------
function updateFade() {
  const barTop = $('add-btn').getBoundingClientRect().top - 10;
  for (const el of document.querySelectorAll('main > *')) {
    el.style.setProperty('--fade-b', `${Math.round(barTop - el.getBoundingClientRect().top)}px`);
  }
}
window.addEventListener('scroll', updateFade, { passive: true });
window.addEventListener('resize', updateFade);
new ResizeObserver(updateFade).observe(document.querySelector('main'));

applyDisplay();
render();

// La fecha cambia a medianoche y con la app en segundo plano: se repinta al volver
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  render();
  redrawDetail();
  syncNow();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

syncNow().then(() => refreshLink());
