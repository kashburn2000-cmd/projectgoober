/**
 * Refreshes src/data/rates.json with the latest EIA average residential
 * electricity price per state.
 *
 * Usage:  EIA_API_KEY=xxxx node scripts/fetch-rates.mjs
 * Get a free key at https://www.eia.gov/opendata/register.php
 *
 * Behavior:
 * - Without EIA_API_KEY: exits 0 and leaves the committed snapshot untouched,
 *   so builds never break.
 * - With a key: fetches the latest monthly residential price for every state,
 *   plus the same month one year earlier (for trend display), and rewrites
 *   rates.json keeping name/region metadata from the existing file.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RATES_PATH = join(__dirname, '..', 'src', 'data', 'rates.json');

const API_KEY = process.env.EIA_API_KEY;
if (!API_KEY) {
  console.log('EIA_API_KEY not set — keeping the committed rates snapshot.');
  process.exit(0);
}

const BASE = 'https://api.eia.gov/v2/electricity/retail-sales/data/';

async function fetchMonth({ start, end }) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    frequency: 'monthly',
    'data[0]': 'price',
    'facets[sectorid][]': 'RES',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    length: '5000',
  });
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`EIA API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.response?.data ?? [];
}

function monthShift(period, months) {
  const [y, m] = period.split('-').map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const current = JSON.parse(readFileSync(RATES_PATH, 'utf8'));
const meta = new Map(current.states.map((s) => [s.abbr, s]));

// Most recent data (EIA publishes with ~2 month lag); grab the last 4 months
// and use the latest period that has full state coverage.
const now = new Date();
const recentStart = `${now.getUTCFullYear() - 1}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
const rows = await fetchMonth({ start: recentStart });

const byPeriod = new Map();
for (const r of rows) {
  if (r.price == null) continue;
  if (!byPeriod.has(r.period)) byPeriod.set(r.period, new Map());
  byPeriod.get(r.period).set(r.stateid, Number(r.price));
}

const wanted = new Set([...meta.keys(), 'US']);
const periods = [...byPeriod.keys()].sort().reverse();
const latest = periods.find((p) => {
  const m = byPeriod.get(p);
  return [...wanted].every((id) => m.has(id));
});
if (!latest) {
  console.error('No recent period with full state coverage — keeping snapshot.');
  process.exit(0);
}

const prevPeriod = monthShift(latest, -12);
const latestMap = byPeriod.get(latest);
const prevMap = byPeriod.get(prevPeriod) ?? new Map();

const round1 = (n) => Math.round(n * 10) / 10;
const states = [...meta.values()].map((s) => ({
  abbr: s.abbr,
  name: s.name,
  region: s.region,
  cents: round1(latestMap.get(s.abbr)),
  prev: prevMap.has(s.abbr) ? round1(prevMap.get(s.abbr)) : s.prev,
}));

const [y, m] = latest.split('-').map(Number);
const out = {
  period: latest,
  periodLabel: `${MONTH_NAMES[m - 1]} ${y}`,
  source: current.source,
  sourceUrl: current.sourceUrl,
  national: {
    cents: round1(latestMap.get('US')),
    prev: prevMap.has('US') ? round1(prevMap.get('US')) : current.national.prev,
  },
  states,
};

writeFileSync(RATES_PATH, JSON.stringify(out, null, 2) + '\n');
console.log(`Updated rates.json to ${out.periodLabel} (national avg ${out.national.cents}¢/kWh).`);
