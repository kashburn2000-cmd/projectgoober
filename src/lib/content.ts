import type { Appliance, StateRate } from './data';
import { rates, statesByRate, stateRank, getState } from './data';
import { costs, money, kwh, usageLabel } from './calc';

/** Average U.S. home consumption, kWh per month (EIA residential average). */
export const AVG_HOME_KWH = 885;

const CATEGORY_TIPS: Record<string, string[]> = {
  heating: [
    'Heat the person, not the house: electric blankets and heated throws deliver comfort for a tenth of a space heater’s draw.',
    'Every degree of thermostat setback saves roughly 1–3% on heating over an 8-hour stretch.',
    'Air sealing and insulation beat any heater upgrade — leaked heat is bought at full price.',
  ],
  cooling: [
    'Raise the setpoint and add air movement — a fan makes a room feel several degrees cooler for pennies.',
    'Clean filters and outdoor coils each season; restricted airflow raises wattage for the same cooling.',
    'Close blinds on sun-facing windows during the day — blocked solar gain is cooling you don’t pay for.',
  ],
  kitchen: [
    'Match the appliance to the portion: microwave and air fryer beat the big oven for anything small.',
    'Keep refrigerator coils clean and gaskets tight — it runs 24/7, so small inefficiencies compound.',
    'Run the dishwasher full and skip heated dry.',
  ],
  laundry: [
    'Wash cold — water heating is most of a warm load’s energy.',
    'Use high spin speeds so the dryer works less; the washer’s spin is far cheaper than the dryer’s heat.',
    'Clean the dryer’s lint filter every load and the duct every year.',
  ],
  water: [
    'Set water heaters to 120°F and fix dripping hot taps quickly — a drip is a slow leak of paid heat.',
    'Shorter showers and low-flow heads cut costs directly; hot water is usually a top-three energy use.',
    'Timers and covers transform pool, spa, and tank costs — stored heat and off-hours running are much cheaper.',
  ],
  entertainment: [
    'Disable instant-on standby modes — they can idle at 10–20 watts around the clock.',
    'Stream on a stick, not a console: the same show can use 10× less power.',
    'Turn down screen brightness or enable the ambient light sensor.',
  ],
  computing: [
    'Enable sleep after 15–20 minutes of idle — modern machines wake in seconds.',
    'Anything always-on (servers, mining, chargers on strips) deserves a smart plug and a schedule.',
    'Laptops do the same office work as desktops on a quarter of the power.',
  ],
  lighting: [
    'Replace remaining incandescent and halogen bulbs with LEDs — the payback is measured in months.',
    'Use motion sensors or timers for outdoor and hallway lighting.',
    'Dimming an LED saves nearly proportionally — 70% brightness ≈ 70% of the power.',
  ],
  outdoor: [
    'Charge vehicles and batteries overnight if your utility offers time-of-use rates.',
    'Standby draw hides in garages — openers, chargers, and old fridges add up around the clock.',
    'Electric yard tools cost pennies per session; the battery’s lifespan is the real economics.',
  ],
  personal: [
    'Heat-producing devices (dryers, irons, beds) dominate this category — minutes of use, not watts, drive cost.',
    'Medical devices that run all night or all day may qualify for utility medical-rate discounts — ask your provider.',
    'Chargers left plugged in draw almost nothing on modern hardware; focus on bigger loads.',
  ],
  household: [
    'Always-on devices are the quiet budget line: audit anything that runs 24/7.',
    'Auto modes with sensors (purifiers, dehumidifiers) cut runtime dramatically versus always-on.',
    'A smart plug with energy monitoring answers “what does this actually use?” for $10.',
  ],
};

export function tipsFor(a: Appliance): string[] {
  return a.tips ?? CATEGORY_TIPS[a.cat] ?? CATEGORY_TIPS.household;
}

export interface Faq { q: string; a: string }

const pct = (x: number) => `${Math.round(x)}%`;

export function applianceFaqs(a: Appliance): Faq[] {
  const nat = costs(a, rates.national.cents);
  const cheap = statesByRate[0];
  const dear = statesByRate[statesByRate.length - 1];
  const cheapCost = costs(a, cheap.cents);
  const dearCost = costs(a, dear.cents);
  const shareOfHome = (nat.kwhMonth / AVG_HOME_KWH) * 100;

  const faqs: Faq[] = [
    {
      q: `How much electricity does a ${a.name.toLowerCase()} use?`,
      a: a.use.t === 'h'
        ? `A typical ${a.name.toLowerCase()} draws about ${a.watts.toLocaleString('en-US')} watts in use. At ${usageLabel(a.use)}, that works out to roughly ${kwh(a.use.h * a.watts / 1000)} kWh per day, or ${kwh(nat.kwhMonth)} kWh per month.`
        : `A typical ${a.name.toLowerCase()} uses about ${a.use.kwh} kWh per use. At ${a.use.cpw} uses per week, that's roughly ${kwh(nat.kwhMonth)} kWh per month.`,
    },
    {
      q: a.use.t === 'h'
        ? `How much does it cost to run a ${a.name.toLowerCase()} for 1 hour?`
        : `How much does one use of a ${a.name.toLowerCase()} cost?`,
      a: a.use.t === 'h'
        ? `At the current U.S. average residential rate of ${rates.national.cents}¢/kWh, one hour costs about ${money(nat.hour!)}. In ${cheap.name} (${cheap.cents}¢/kWh) it's ${money(cheapCost.hour!)}, while in ${dear.name} (${dear.cents}¢/kWh) it's ${money(dearCost.hour!)}.`
        : `At the current U.S. average rate of ${rates.national.cents}¢/kWh, each use costs about ${money(nat.perUse!)}. That ranges from ${money(cheapCost.perUse!)} in ${cheap.name} to ${money(dearCost.perUse!)} in ${dear.name}.`,
    },
    {
      q: `How much does a ${a.name.toLowerCase()} cost to run per month?`,
      a: `With typical usage (${usageLabel(a.use)}), expect about ${money(nat.month)} per month at the U.S. average rate — from ${money(cheapCost.month)} in ${cheap.name} up to ${money(dearCost.month)} in ${dear.name}. Rates are as of ${rates.periodLabel}.`,
    },
    {
      q: `Does a ${a.name.toLowerCase()} use a lot of electricity?`,
      a: shareOfHome >= 10
        ? `Yes — at typical usage it accounts for roughly ${pct(shareOfHome)} of an average U.S. home's monthly consumption (${AVG_HOME_KWH} kWh), which makes it one of the larger loads in the house.`
        : shareOfHome >= 2
          ? `It's a moderate load: roughly ${pct(shareOfHome)} of an average U.S. home's monthly consumption at typical usage. Noticeable, but not a bill-driver on its own.`
          : `Not really — at typical usage it's under ${Math.max(1, Math.round(shareOfHome))}% of an average home's monthly consumption. Heating, cooling, hot water, and drying are the loads that move bills.`,
    },
  ];
  return faqs;
}

export function applianceStateFaqs(a: Appliance, s: StateRate): Faq[] {
  const here = costs(a, s.cents);
  const nat = costs(a, rates.national.cents);
  const diff = ((s.cents - rates.national.cents) / rates.national.cents) * 100;
  const rank = stateRank(s.abbr);
  return [
    {
      q: `How much does it cost to run a ${a.name.toLowerCase()} in ${s.name}?`,
      a: `At ${s.name}'s current average residential rate of ${s.cents}¢/kWh (${rates.periodLabel}), a ${a.name.toLowerCase()} with typical usage costs about ${money(here.day)} per day, ${money(here.month)} per month, or ${money(here.year)} per year.`,
    },
    {
      q: `Is running a ${a.name.toLowerCase()} in ${s.name} more expensive than average?`,
      a: diff >= 2
        ? `Yes. ${s.name}'s electricity costs about ${pct(Math.abs(diff))} more than the U.S. average, so the same usage costs ${money(here.month)} per month here versus ${money(nat.month)} nationally.`
        : diff <= -2
          ? `No — it's cheaper. ${s.name}'s rate is about ${pct(Math.abs(diff))} below the U.S. average: ${money(here.month)} per month here versus ${money(nat.month)} nationally.`
          : `It's almost exactly the U.S. average: ${money(here.month)} per month here versus ${money(nat.month)} nationally.`,
    },
    {
      q: `What does electricity cost in ${s.name} right now?`,
      a: `${s.name} residents pay an average of ${s.cents}¢ per kWh as of ${rates.periodLabel} — the ${ordinal(rank)} cheapest rate of the 51 U.S. jurisdictions we track.`,
    },
  ];
}

export function stateFaqs(s: StateRate): Faq[] {
  const rank = stateRank(s.abbr);
  const diff = ((s.cents - rates.national.cents) / rates.national.cents) * 100;
  const change = ((s.cents - s.prev) / s.prev) * 100;
  const bill = (AVG_HOME_KWH * s.cents) / 100;
  return [
    {
      q: `How much does electricity cost in ${s.name}?`,
      a: `The average residential electricity rate in ${s.name} is ${s.cents}¢ per kWh as of ${rates.periodLabel}. For a typical home using ${AVG_HOME_KWH} kWh per month, that's an electric bill of about ${money(bill)}.`,
    },
    {
      q: `Is electricity expensive in ${s.name}?`,
      a: diff >= 5
        ? `Yes, relatively — ${s.name} ranks ${ordinal(51 - rank + 1)} most expensive of 51 U.S. jurisdictions, about ${pct(Math.abs(diff))} above the national average of ${rates.national.cents}¢/kWh.`
        : diff <= -5
          ? `No — ${s.name} has the ${ordinal(rank)} cheapest electricity in the country, about ${pct(Math.abs(diff))} below the national average of ${rates.national.cents}¢/kWh.`
          : `${s.name} sits close to the national average of ${rates.national.cents}¢/kWh, ranking ${ordinal(rank)} cheapest of 51 jurisdictions.`,
    },
    {
      q: `Are electricity rates in ${s.name} going up?`,
      a: change >= 1
        ? `Yes — the average rate is up about ${pct(Math.abs(change))} versus a year ago (${s.prev}¢ → ${s.cents}¢ per kWh). Rising rates make high-consumption appliances like electric heat, dryers, and pool pumps more expensive to ignore.`
        : change <= -1
          ? `They've actually eased slightly — down about ${pct(Math.abs(change))} versus a year ago (${s.prev}¢ → ${s.cents}¢ per kWh).`
          : `They're roughly flat versus a year ago (${s.prev}¢ → ${s.cents}¢ per kWh).`,
    },
    {
      q: 'What uses the most electricity in a home?',
      a: 'Heating and cooling typically lead, followed by water heating, then the clothes dryer, refrigeration, and always-on electronics. Our bill analyzer breaks this down for your own set of appliances at your state’s rate.',
    },
  ];
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
