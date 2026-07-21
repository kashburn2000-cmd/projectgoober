import { useMemo, useState } from 'preact/hooks';
import { money } from '../lib/calc';
import type { StateOption } from './CostCalculator';

export interface AnalyzerItem {
  slug: string;
  name: string;
  watts: number;
  /** hours/day for continuous items; for cycle items, kWh/day equivalent baked into `kwhDay`. */
  hours?: number;
  kwhDay: number;
  /** default quantity in a typical home */
  preset?: number;
}

interface Props {
  states: StateOption[];
  nationalCents: number;
  items: AnalyzerItem[];
  /** average US home monthly consumption, kWh */
  avgHomeKwh: number;
}

interface Row {
  slug: string;
  qty: number;
  scale: number; // usage multiplier 0.25–3
}

const DAYS = 30.4;

export default function BillAnalyzer({ states, nationalCents, items, avgHomeKwh }: Props) {
  const bySlug = useMemo(() => new Map(items.map((i) => [i.slug, i])), [items]);
  const [stateAbbr, setStateAbbr] = useState('');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Row[]>(
    items.filter((i) => i.preset).map((i) => ({ slug: i.slug, qty: i.preset!, scale: 1 })),
  );

  const cents = states.find((s) => s.abbr === stateAbbr)?.cents ?? nationalCents;
  const rate = cents / 100;

  const computed = rows
    .map((r) => {
      const item = bySlug.get(r.slug)!;
      const kwhMonth = item.kwhDay * r.scale * r.qty * DAYS;
      return { ...r, item, kwhMonth, cost: kwhMonth * rate };
    })
    .sort((a, b) => b.cost - a.cost);

  const totalKwh = computed.reduce((s, r) => s + r.kwhMonth, 0);
  const totalCost = totalKwh * rate;
  const maxCost = computed[0]?.cost ?? 1;
  const avgBill = avgHomeKwh * rate;

  const available = items.filter(
    (i) => !rows.some((r) => r.slug === i.slug) && i.name.toLowerCase().includes(query.toLowerCase()),
  );

  const update = (slug: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.slug === slug ? { ...r, ...patch } : r)));

  return (
    <div class="rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-sm overflow-hidden">
      <div class="p-5 sm:p-6 border-b border-ink-200 dark:border-ink-800 flex flex-col sm:flex-row sm:items-end gap-4">
        <div class="flex-1">
          <label class="block text-xs font-medium text-ink-600 dark:text-ink-400 mb-1" for="an-state">Your state</label>
          <select
            id="an-state"
            class="w-full rounded-lg border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-950 px-3 py-2 text-sm text-ink-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={stateAbbr}
            onChange={(e) => setStateAbbr((e.target as HTMLSelectElement).value)}
          >
            <option value="">U.S. average ({nationalCents.toFixed(1)}¢/kWh)</option>
            {states.map((s) => (
              <option value={s.abbr}>{s.name} ({s.cents.toFixed(1)}¢/kWh)</option>
            ))}
          </select>
        </div>
        <div class="text-right shrink-0">
          <p class="text-[11px] font-medium uppercase tracking-wide text-ink-500">Estimated appliance total</p>
          <p class="text-3xl font-bold tabular text-brand-700 dark:text-brand-400">{money(totalCost)}<span class="text-base font-medium text-ink-500">/mo</span></p>
          <p class="text-xs text-ink-500 tabular">{Math.round(totalKwh).toLocaleString('en-US')} kWh · typical home in your state ≈ {money(avgBill)}</p>
        </div>
      </div>

      <ul class="divide-y divide-ink-100 dark:divide-ink-800 max-h-[26rem] overflow-y-auto">
        {computed.map((r) => (
          <li key={r.slug} class="px-5 sm:px-6 py-3">
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <a href={`/appliance/${r.slug}/`} class="text-sm font-medium text-ink-900 dark:text-ink-100 hover:text-brand-700 dark:hover:text-brand-400 truncate block">{r.item.name}{r.qty > 1 ? ` ×${r.qty}` : ''}</a>
                <div class="mt-1.5 h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden max-w-64" aria-hidden="true">
                  <div class="h-full rounded-full bg-brand-600" style={`width:${Math.max(2, (r.cost / maxCost) * 100)}%`}></div>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-sm font-semibold tabular text-ink-900 dark:text-ink-100 w-16 text-right">{money(r.cost)}</span>
                <div class="flex items-center rounded-lg border border-ink-200 dark:border-ink-700">
                  <button type="button" aria-label={`Less ${r.item.name} usage`} class="px-2 py-1 text-ink-500 hover:text-ink-900 dark:hover:text-ink-100" onClick={() => update(r.slug, { scale: Math.max(0.25, r.scale - 0.25) })}>−</button>
                  <span class="text-[11px] tabular text-ink-500 w-9 text-center" title="Usage vs. typical">{Math.round(r.scale * 100)}%</span>
                  <button type="button" aria-label={`More ${r.item.name} usage`} class="px-2 py-1 text-ink-500 hover:text-ink-900 dark:hover:text-ink-100" onClick={() => update(r.slug, { scale: Math.min(3, r.scale + 0.25) })}>+</button>
                </div>
                <button type="button" aria-label={`Remove ${r.item.name}`} class="p-1 text-ink-400 hover:text-red-600" onClick={() => setRows((rs) => rs.filter((x) => x.slug !== r.slug))}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div class="p-5 sm:p-6 border-t border-ink-200 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-950/40">
        <label class="block text-xs font-medium text-ink-600 dark:text-ink-400 mb-1" for="an-add">Add an appliance</label>
        <input
          id="an-add"
          type="search"
          placeholder="Search: dryer, pool pump, space heater…"
          class="w-full rounded-lg border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-950 px-3 py-2 text-sm text-ink-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
        />
        {query && (
          <ul class="mt-2 max-h-40 overflow-y-auto rounded-lg border border-ink-200 dark:border-ink-700 divide-y divide-ink-100 dark:divide-ink-800 bg-white dark:bg-ink-900">
            {available.slice(0, 8).map((i) => (
              <li key={i.slug}>
                <button
                  type="button"
                  class="w-full text-left px-3 py-2 text-sm text-ink-700 dark:text-ink-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 flex justify-between"
                  onClick={() => { setRows((rs) => [...rs, { slug: i.slug, qty: 1, scale: 1 }]); setQuery(''); }}
                >
                  <span>{i.name}</span>
                  <span class="tabular text-ink-400">{money(i.kwhDay * DAYS * rate)}/mo</span>
                </button>
              </li>
            ))}
            {available.length === 0 && <li class="px-3 py-2 text-sm text-ink-400">No matches</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
