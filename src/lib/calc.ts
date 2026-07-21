import type { Appliance, Usage } from './data';
import { DEFAULTS } from '../config.js';

export interface CostBreakdown {
  kwhDay: number;
  kwhMonth: number;
  kwhYear: number;
  hour: number | null; // $ per hour of active use (null for cycle-based)
  perUse: number | null; // $ per cycle (cycle-based only)
  day: number;
  month: number;
  year: number;
}

/** kWh consumed per day at the appliance's default usage pattern. */
export function kwhPerDay(watts: number, use: Usage, standby = 0): number {
  if (use.t === 'h') {
    const active = (watts * use.h) / 1000;
    const idle = (standby * Math.max(0, 24 - use.h)) / 1000;
    return active + idle;
  }
  return (use.kwh * use.cpw) / 7;
}

/** Full cost breakdown at a rate given in cents per kWh. */
export function costs(a: Appliance, cents: number): CostBreakdown {
  const dollarsPerKwh = cents / 100;
  const kwhDay = kwhPerDay(a.watts, a.use, a.standby ?? 0);
  const kwhMonth = kwhDay * DEFAULTS.daysPerMonth;
  return {
    kwhDay,
    kwhMonth,
    kwhYear: kwhDay * 365,
    hour: a.use.t === 'h' ? (a.watts / 1000) * dollarsPerKwh : null,
    perUse: a.use.t === 'c' ? a.use.kwh * dollarsPerKwh : null,
    day: kwhDay * dollarsPerKwh,
    month: kwhMonth * dollarsPerKwh,
    year: kwhDay * 365 * dollarsPerKwh,
  };
}

/** "$1.23" for normal amounts, "8.4¢" below a dime, "$1,234" for large ones. */
export function money(v: number): string {
  if (v < 0.095) return `${(v * 100).toFixed(1)}¢`;
  if (v < 100) return `$${v.toFixed(2)}`;
  return `$${Math.round(v).toLocaleString('en-US')}`;
}

/** Rounded, human kWh: "0.4", "12", "1,240". */
export function kwh(v: number): string {
  if (v < 10) return v.toFixed(1);
  return Math.round(v).toLocaleString('en-US');
}

export function wattsLabel(a: Appliance): string {
  if (a.low && a.high && a.low !== a.high) {
    return `${a.low.toLocaleString('en-US')}–${a.high.toLocaleString('en-US')} W`;
  }
  return `${a.watts.toLocaleString('en-US')} W`;
}

export function usageLabel(use: Usage): string {
  if (use.t === 'h') {
    return use.h >= 24 ? '24 hours/day (always on)' : `${use.h} hour${use.h === 1 ? '' : 's'}/day`;
  }
  return `${use.cpw} use${use.cpw === 1 ? '' : 's'}/week at ${use.kwh} kWh each`;
}
