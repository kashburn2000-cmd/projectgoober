import ratesJson from '../data/rates.json';
import heating from '../data/appliances/heating.json';
import cooling from '../data/appliances/cooling.json';
import kitchen from '../data/appliances/kitchen.json';
import laundry from '../data/appliances/laundry.json';
import water from '../data/appliances/water.json';
import entertainment from '../data/appliances/entertainment.json';
import computing from '../data/appliances/computing.json';
import lighting from '../data/appliances/lighting.json';
import outdoor from '../data/appliances/outdoor.json';
import personal from '../data/appliances/personal.json';
import household from '../data/appliances/household.json';
import comparisonsJson from '../data/comparisons.json';

export interface UsageHours { t: 'h'; h: number }
export interface UsageCycles { t: 'c'; kwh: number; cpw: number }
export type Usage = UsageHours | UsageCycles;

export interface Appliance {
  slug: string;
  name: string;
  cat: string;
  tier: number;
  watts: number;
  low?: number;
  high?: number;
  standby?: number;
  use: Usage;
  season?: 'winter' | 'summer';
  blurb: string;
  tips?: string[];
}

export interface StateRate {
  abbr: string;
  name: string;
  region: string;
  cents: number;
  prev: number;
}

export interface Comparison {
  a: string;
  b: string;
  intro: string;
  verdict: string;
}

export const rates = ratesJson as {
  period: string;
  periodLabel: string;
  source: string;
  sourceUrl: string;
  national: { cents: number; prev: number };
  states: StateRate[];
};

export const appliances: Appliance[] = [
  ...heating, ...cooling, ...kitchen, ...laundry, ...water,
  ...entertainment, ...computing, ...lighting, ...outdoor, ...personal, ...household,
] as Appliance[];

export const comparisons = comparisonsJson as Comparison[];

export const CATEGORIES: Record<string, { label: string; icon: string }> = {
  heating: { label: 'Heating', icon: '🔥' },
  cooling: { label: 'Cooling & Air', icon: '❄️' },
  kitchen: { label: 'Kitchen', icon: '🍳' },
  laundry: { label: 'Laundry', icon: '🧺' },
  water: { label: 'Water, Pool & Spa', icon: '💧' },
  entertainment: { label: 'TV & Entertainment', icon: '📺' },
  computing: { label: 'Computers & Office', icon: '💻' },
  lighting: { label: 'Lighting', icon: '💡' },
  outdoor: { label: 'Outdoor, Garage & EV', icon: '🚗' },
  personal: { label: 'Personal Care & Health', icon: '🩺' },
  household: { label: 'Household', icon: '🏠' },
};

const bySlug = new Map(appliances.map((a) => [a.slug, a]));
const stateByAbbr = new Map(rates.states.map((s) => [s.abbr, s]));

export function getAppliance(slug: string): Appliance {
  const a = bySlug.get(slug);
  if (!a) throw new Error(`Unknown appliance slug: ${slug}`);
  return a;
}

export function getState(abbr: string): StateRate {
  const s = stateByAbbr.get(abbr.toUpperCase());
  if (!s) throw new Error(`Unknown state: ${abbr}`);
  return s;
}

/** Lowercase URL segment for a state, e.g. "north-carolina". */
export function stateSlug(s: StateRate): string {
  return s.name.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, '-');
}

const stateBySlug = new Map(rates.states.map((s) => [stateSlug(s), s]));
export function getStateBySlug(slug: string): StateRate {
  const s = stateBySlug.get(slug);
  if (!s) throw new Error(`Unknown state slug: ${slug}`);
  return s;
}

export const tier1 = appliances.filter((a) => a.tier === 1);

export const statesByRate = [...rates.states].sort((a, b) => a.cents - b.cents);

/** 1 = cheapest electricity. */
export function stateRank(abbr: string): number {
  return statesByRate.findIndex((s) => s.abbr === abbr) + 1;
}

export function regionAverage(region: string): number {
  const rs = rates.states.filter((s) => s.region === region);
  return rs.reduce((sum, s) => sum + s.cents, 0) / rs.length;
}

export function applianceEmoji(a: Appliance): string {
  return CATEGORIES[a.cat]?.icon ?? '🔌';
}
