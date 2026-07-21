import { useMemo, useState } from 'preact/hooks';
import { money, kwh } from '../lib/calc';

export interface StateOption {
  abbr: string;
  name: string;
  cents: number;
}

interface Props {
  states: StateOption[];
  nationalCents: number;
  mode?: 'continuous' | 'cycle';
  initialWatts?: number;
  initialHours?: number;
  initialKwhPerUse?: number;
  initialUsesPerWeek?: number;
  initialState?: string;
  /** Compact = embedded on appliance pages; full = /calculator/ page. */
  compact?: boolean;
}

const DAYS_PER_MONTH = 30.4;

export default function CostCalculator({
  states,
  nationalCents,
  mode: initialMode = 'continuous',
  initialWatts = 100,
  initialHours = 4,
  initialKwhPerUse = 1,
  initialUsesPerWeek = 5,
  initialState = '',
  compact = false,
}: Props) {
  const [mode, setMode] = useState(initialMode);
  const [watts, setWatts] = useState(initialWatts);
  const [hours, setHours] = useState(initialHours);
  const [kwhUse, setKwhUse] = useState(initialKwhPerUse);
  const [uses, setUses] = useState(initialUsesPerWeek);
  const [stateAbbr, setStateAbbr] = useState(initialState);

  const cents = useMemo(() => {
    const s = states.find((x) => x.abbr === stateAbbr);
    return s ? s.cents : nationalCents;
  }, [stateAbbr, states, nationalCents]);

  const kwhDay = mode === 'continuous' ? (watts * hours) / 1000 : (kwhUse * uses) / 7;
  const rate = cents / 100;
  const perHour = (watts / 1000) * rate;
  const perUse = kwhUse * rate;
  const day = kwhDay * rate;
  const month = day * DAYS_PER_MONTH;
  const year = day * 365;

  const inputCls =
    'w-full rounded-lg border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm text-ink-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-brand-500';
  const labelCls = 'block text-xs font-medium text-ink-600 dark:text-ink-400 mb-1';

  return (
    <div class="rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 sm:p-6">
      {!compact && (
        <div class="flex gap-1 mb-5 p-1 rounded-lg bg-ink-100 dark:bg-ink-800 w-fit" role="tablist">
          {(['continuous', 'cycle'] as const).map((m) => (
            <button
              type="button"
              role="tab"
              aria-selected={mode === m}
              class={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-100 shadow-sm'
                  : 'text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'
              }`}
              onClick={() => setMode(m)}
            >
              {m === 'continuous' ? 'By wattage & hours' : 'By use (cycles)'}
            </button>
          ))}
        </div>
      )}

      <div class="grid gap-4 sm:grid-cols-3">
        {mode === 'continuous' ? (
          <>
            <div>
              <label class={labelCls} for="calc-watts">Power (watts)</label>
              <input id="calc-watts" class={inputCls} type="number" min="1" max="30000" value={watts}
                onInput={(e) => setWatts(Math.max(0, Number((e.target as HTMLInputElement).value)))} />
              <input class="w-full mt-2 accent-brand-600" type="range" min="1" max="5000" step="1" value={Math.min(watts, 5000)}
                aria-label="Watts slider"
                onInput={(e) => setWatts(Number((e.target as HTMLInputElement).value))} />
            </div>
            <div>
              <label class={labelCls} for="calc-hours">Hours per day</label>
              <input id="calc-hours" class={inputCls} type="number" min="0" max="24" step="0.5" value={hours}
                onInput={(e) => setHours(Math.min(24, Math.max(0, Number((e.target as HTMLInputElement).value))))} />
              <input class="w-full mt-2 accent-brand-600" type="range" min="0" max="24" step="0.5" value={hours}
                aria-label="Hours slider"
                onInput={(e) => setHours(Number((e.target as HTMLInputElement).value))} />
            </div>
          </>
        ) : (
          <>
            <div>
              <label class={labelCls} for="calc-kwh">Energy per use (kWh)</label>
              <input id="calc-kwh" class={inputCls} type="number" min="0" step="0.1" value={kwhUse}
                onInput={(e) => setKwhUse(Math.max(0, Number((e.target as HTMLInputElement).value)))} />
            </div>
            <div>
              <label class={labelCls} for="calc-uses">Uses per week</label>
              <input id="calc-uses" class={inputCls} type="number" min="0" max="100" value={uses}
                onInput={(e) => setUses(Math.max(0, Number((e.target as HTMLInputElement).value)))} />
            </div>
          </>
        )}
        <div>
          <label class={labelCls} for="calc-state">Your state</label>
          <select id="calc-state" class={inputCls} value={stateAbbr}
            onChange={(e) => setStateAbbr((e.target as HTMLSelectElement).value)}>
            <option value="">U.S. average ({nationalCents.toFixed(1)}¢/kWh)</option>
            {states.map((s) => (
              <option value={s.abbr}>{s.name} ({s.cents.toFixed(1)}¢)</option>
            ))}
          </select>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Result label={mode === 'continuous' ? 'Per hour' : 'Per use'} value={money(mode === 'continuous' ? perHour : perUse)} />
        <Result label="Per day" value={money(day)} />
        <Result label="Per month" value={money(month)} accent />
        <Result label="Per year" value={money(year)} />
      </div>
      <p class="mt-4 text-xs text-ink-500 dark:text-ink-400">
        Uses {kwh(kwhDay * DAYS_PER_MONTH)} kWh/month at {cents.toFixed(1)}¢ per kWh.
      </p>
    </div>
  );
}

function Result({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div class={`rounded-xl px-4 py-3 ${accent ? 'bg-brand-50 dark:bg-brand-900/25 border border-brand-200 dark:border-brand-800' : 'bg-ink-100/70 dark:bg-ink-800/60'}`}>
      <p class="text-[11px] font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</p>
      <p class={`text-xl font-bold tabular ${accent ? 'text-brand-800 dark:text-brand-300' : 'text-ink-900 dark:text-ink-100'}`}>{value}</p>
    </div>
  );
}
