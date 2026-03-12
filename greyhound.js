'use strict';
// ====== Greyhound Racing Module ======

const fs   = require('fs');
const path = require('path');

// ── File paths ────────────────────────────────────────────────────────────────
const BALANCE_PATH  = path.join(__dirname, 'greyhound-balances.json');
const SCHEDULE_PATH = path.join(__dirname, 'greyhound-schedule.json');
const BETS_PATH     = path.join(__dirname, 'greyhound-bets.json');

// ── Config ────────────────────────────────────────────────────────────────────
const STARTING_BALANCE   = 250;
const DAILY_CLAIM        = 50;
const RACES_PER_CARD     = 6;
const CARDS_PER_DAY      = 3;
const RACE_INTERVAL_MINS = 20;
const CARD_START_HOURS   = [10, 14, 19]; // UTC

// ── Tracks ────────────────────────────────────────────────────────────────────
const TRACKS = [
  { name: 'Romford',              short: 'ROM', distance: '400m' },
  { name: 'Swindon',              short: 'SWI', distance: '432m' },
  { name: 'Sheffield (Owlerton)', short: 'SHE', distance: '500m' },
  { name: 'Nottingham',           short: 'NOT', distance: '480m' },
  { name: 'Hove',                 short: 'HOV', distance: '515m' },
  { name: 'Newcastle',            short: 'NEW', distance: '480m' },
  { name: 'Crayford',             short: 'CRY', distance: '380m' },
  { name: 'Coventry',             short: 'COV', distance: '460m' },
  { name: 'Harlow',               short: 'HAR', distance: '380m' },
  { name: 'Monmore',              short: 'MON', distance: '480m' },
  { name: 'Yarmouth',             short: 'YAR', distance: '462m' },
  { name: 'Belle Vue',            short: 'BEL', distance: '463m' },
  { name: 'Perry Barr',           short: 'PER', distance: '480m' },
  { name: 'Towcester',            short: 'TOW', distance: '475m' },
];

// ── Dog pool ──────────────────────────────────────────────────────────────────
const DOG_POOL = [
  { id:  1, name: 'Ballyanne Jet',     gender: 'M', colour: 'Black',           rating: 82 },
  { id:  2, name: 'Droopys Star',      gender: 'M', colour: 'Blue',            rating: 88 },
  { id:  3, name: 'Malbay Lad',        gender: 'M', colour: 'Brindle',         rating: 75 },
  { id:  4, name: 'Swift Phantom',     gender: 'M', colour: 'White',           rating: 71 },
  { id:  5, name: 'Ballymac Vera',     gender: 'F', colour: 'Black & White',   rating: 85 },
  { id:  6, name: 'Priceless Journey', gender: 'F', colour: 'Fawn',            rating: 79 },
  { id:  7, name: 'Top Shelf',         gender: 'M', colour: 'Dark Brindle',    rating: 90 },
  { id:  8, name: 'Sonic Dreamer',     gender: 'F', colour: 'White & Black',   rating: 77 },
  { id:  9, name: 'Clonbrien Hero',    gender: 'M', colour: 'Black',           rating: 95 },
  { id: 10, name: 'Farloe Bella',      gender: 'F', colour: 'Fawn',            rating: 83 },
  { id: 11, name: 'Lenson Bocko',      gender: 'M', colour: 'Brindle',         rating: 78 },
  { id: 12, name: 'Ballymac Eske',     gender: 'M', colour: 'Black',           rating: 86 },
  { id: 13, name: 'Garnacanty Twist',  gender: 'F', colour: 'Blue & White',    rating: 72 },
  { id: 14, name: 'Droopys Buick',     gender: 'M', colour: 'Dark Brindle',    rating: 91 },
  { id: 15, name: 'Swift Iconic',      gender: 'F', colour: 'White',           rating: 74 },
  { id: 16, name: 'Romeo Recruit',     gender: 'M', colour: 'Black & White',   rating: 80 },
  { id: 17, name: 'Malbay Penny',      gender: 'F', colour: 'Fawn & White',    rating: 69 },
  { id: 18, name: 'Coolavanny Jap',    gender: 'M', colour: 'Brindle',         rating: 84 },
  { id: 19, name: 'Boom Time',         gender: 'M', colour: 'Black',           rating: 87 },
  { id: 20, name: 'Ballymac Vic',      gender: 'M', colour: 'Blue',            rating: 76 },
  { id: 21, name: 'Kilara Gold',       gender: 'F', colour: 'Fawn',            rating: 81 },
  { id: 22, name: 'Antigua Boys',      gender: 'M', colour: 'Brindle & White', rating: 73 },
  { id: 23, name: 'Cloughtaney Steve', gender: 'M', colour: 'Dark Brindle',    rating: 89 },
  { id: 24, name: 'Taylors Cruisin',   gender: 'F', colour: 'White & Brindle', rating: 70 },
  { id: 25, name: 'Slippy Blue',       gender: 'M', colour: 'Blue & White',    rating: 85 },
  { id: 26, name: 'Kata Clio',         gender: 'F', colour: 'Black',           rating: 93 },
  { id: 27, name: 'Antigua Jo',        gender: 'F', colour: 'Fawn',            rating: 77 },
  { id: 28, name: 'Clongulane Lad',    gender: 'M', colour: 'Brindle',         rating: 82 },
  { id: 29, name: 'Manna House Mel',   gender: 'M', colour: 'Black & White',   rating: 68 },
  { id: 30, name: 'Westmead Hawk',     gender: 'M', colour: 'Dark Brindle',    rating: 92 },
  { id: 31, name: 'Dinnigans Lad',     gender: 'M', colour: 'White',           rating: 75 },
  { id: 32, name: 'Pennys Princess',   gender: 'F', colour: 'Fawn & White',    rating: 78 },
  { id: 33, name: 'Sonic Rum',         gender: 'M', colour: 'Black',           rating: 83 },
  { id: 34, name: 'Kilmacud Slippy',   gender: 'M', colour: 'Blue',            rating: 86 },
  { id: 35, name: 'Tullymurry Tuck',   gender: 'F', colour: 'Black & Fawn',    rating: 71 },
  { id: 36, name: 'Bubbly Cristal',    gender: 'F', colour: 'White & Blue',    rating: 88 },
  { id: 37, name: 'Farloe Verdict',    gender: 'M', colour: 'Brindle',         rating: 79 },
  { id: 38, name: 'Highview Forty',    gender: 'M', colour: 'Dark Brindle',    rating: 74 },
  { id: 39, name: 'Bombastic Banta',   gender: 'M', colour: 'Black',           rating: 90 },
  { id: 40, name: 'Salacres Gem',      gender: 'F', colour: 'Fawn',            rating: 80 },
  { id: 41, name: 'Clear Range',       gender: 'M', colour: 'White & Black',   rating: 76 },
  { id: 42, name: 'Indian Shore',      gender: 'M', colour: 'Brindle & White', rating: 85 },
  { id: 43, name: 'Lady Flash',        gender: 'F', colour: 'Black',           rating: 72 },
  { id: 44, name: 'Magical Sprint',    gender: 'M', colour: 'Blue & White',    rating: 87 },
  { id: 45, name: 'Rathkeale Bono',    gender: 'M', colour: 'Dark Brindle',    rating: 81 },
  { id: 46, name: 'Storm Havana',      gender: 'F', colour: 'Fawn & White',    rating: 69 },
  { id: 47, name: 'Kinloch Brae',      gender: 'M', colour: 'Black',           rating: 94 },
  { id: 48, name: 'Oakfield Gunner',   gender: 'M', colour: 'Brindle',         rating: 77 },
  { id: 49, name: 'Coppice Flash',     gender: 'F', colour: 'White',           rating: 83 },
  { id: 50, name: 'Jaytee Jet',        gender: 'M', colour: 'Black & White',   rating: 91 },
  { id: 51, name: 'Rathore Hero',      gender: 'M', colour: 'Blue',            rating: 78 },
  { id: 52, name: 'Seomra Saoirse',    gender: 'F', colour: 'Fawn',            rating: 73 },
  { id: 53, name: 'Dapper Lad',        gender: 'M', colour: 'Dark Brindle',    rating: 86 },
  { id: 54, name: 'Pat C Wizi',        gender: 'M', colour: 'Brindle & White', rating: 84 },
  { id: 55, name: 'Liffeyside Amber',  gender: 'F', colour: 'Black & Brindle', rating: 70 },
  { id: 56, name: 'Ardnasool Mo',      gender: 'M', colour: 'White & Fawn',    rating: 88 },
  { id: 57, name: 'Tyrur Big Mike',    gender: 'M', colour: 'Black',           rating: 76 },
  { id: 58, name: 'Emers Express',     gender: 'F', colour: 'Blue & White',    rating: 82 },
  { id: 59, name: 'Priceless Missile', gender: 'M', colour: 'Brindle',         rating: 79 },
  { id: 60, name: 'Fair Dealer',       gender: 'M', colour: 'Dark Brindle',    rating: 92 },
];

// ── Standard odds table ───────────────────────────────────────────────────────
const STD_ODDS = [
  { dec: 1.25, frac: '1/4'  }, { dec: 1.33, frac: '1/3'  }, { dec: 1.5,  frac: '1/2'  },
  { dec: 2.0,  frac: 'EVS'  }, { dec: 2.25, frac: '5/4'  }, { dec: 2.5,  frac: '6/4'  },
  { dec: 2.75, frac: '7/4'  }, { dec: 3.0,  frac: '2/1'  }, { dec: 3.5,  frac: '5/2'  },
  { dec: 4.0,  frac: '3/1'  }, { dec: 4.5,  frac: '7/2'  }, { dec: 5.0,  frac: '4/1'  },
  { dec: 5.5,  frac: '9/2'  }, { dec: 6.0,  frac: '5/1'  }, { dec: 7.0,  frac: '6/1'  },
  { dec: 8.0,  frac: '7/1'  }, { dec: 9.0,  frac: '8/1'  }, { dec: 11.0, frac: '10/1' },
  { dec: 13.0, frac: '12/1' }, { dec: 15.0, frac: '14/1' }, { dec: 17.0, frac: '16/1' },
  { dec: 21.0, frac: '20/1' }, { dec: 26.0, frac: '25/1' }, { dec: 34.0, frac: '33/1' },
  { dec: 51.0, frac: '50/1' },
];

function snapOdds(raw) {
  let best = STD_ODDS[0], bestDiff = Math.abs(raw - STD_ODDS[0].dec);
  for (const o of STD_ODDS) {
    const diff = Math.abs(raw - o.dec);
    if (diff < bestDiff) { best = o; bestDiff = diff; }
  }
  return best;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().slice(0, 10); }

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Schedule ──────────────────────────────────────────────────────────────────
function generateSchedule() {
  const today  = todayStr();
  const tracks = shuffle(TRACKS).slice(0, CARDS_PER_DAY);

  const cards = CARD_START_HOURS.map((startHour, ci) => {
    const track = tracks[ci];
    const races = [];

    for (let ri = 0; ri < RACES_PER_CARD; ri++) {
      const raceDogs   = shuffle(DOG_POOL).slice(0, 6);
      const runnersRaw = raceDogs.map(dog => {
        const mod = (Math.random() * 0.3 - 0.15) * dog.rating;
        return { dog, adj: Math.max(1, dog.rating + mod) };
      });

      const total   = runnersRaw.reduce((s, r) => s + r.adj, 0);
      const runners = runnersRaw.map((r, i) => {
        const prob   = r.adj / total;
        const rawDec = (1 / prob) * 0.88; // bookmaker margin
        const odds   = snapOdds(rawDec);
        return { trap: i + 1, dog: r.dog, adj: r.adj, decimalOdds: odds.dec, fractionalOdds: odds.frac };
      });

      const raceDate = new Date(today + 'T00:00:00Z');
      raceDate.setUTCHours(startHour, ri * RACE_INTERVAL_MINS, 0, 0);

      races.push({
        raceNum: ri + 1,
        raceKey: `${ci + 1}-${ri + 1}`,
        startTime: raceDate.toISOString(),
        status: 'pending',
        runners,
        result: null,
      });
    }

    return { cardNum: ci + 1, track, races };
  });

  const schedule = { date: today, cards };
  fs.writeFileSync(SCHEDULE_PATH, JSON.stringify(schedule, null, 2));
  return schedule;
}

function getSchedule() {
  try {
    if (fs.existsSync(SCHEDULE_PATH)) {
      const data = JSON.parse(fs.readFileSync(SCHEDULE_PATH, 'utf8'));
      if (data.date === todayStr()) return data;
    }
  } catch {}
  return generateSchedule();
}

function getRace(cardNum, raceNum) {
  return getSchedule().cards[cardNum - 1]?.races[raceNum - 1] ?? null;
}

function saveSchedule(s) {
  fs.writeFileSync(SCHEDULE_PATH, JSON.stringify(s, null, 2));
}

function markRaceComplete(cardNum, raceNum, positions) {
  const s    = getSchedule();
  const race = s.cards[cardNum - 1].races[raceNum - 1];
  race.status = 'completed';
  race.result = { positions };
  saveSchedule(s);
  return race;
}

// ── Race simulation ───────────────────────────────────────────────────────────
function simulateRace(race) {
  const pool  = race.runners.map(r => ({ trap: r.trap, w: r.adj }));
  const order = [];
  while (pool.length) {
    const total = pool.reduce((s, r) => s + r.w, 0);
    let rand = Math.random() * total, i = 0;
    while (rand > pool[i].w) { rand -= pool[i].w; i++; }
    order.push(pool[i].trap);
    pool.splice(i, 1);
  }
  return order; // [1st_trap, 2nd_trap, 3rd_trap, ...]
}

// ── Balances ──────────────────────────────────────────────────────────────────
function loadBalances() {
  try { if (fs.existsSync(BALANCE_PATH)) return JSON.parse(fs.readFileSync(BALANCE_PATH, 'utf8')); } catch {}
  return {};
}
function saveBalances(d) { fs.writeFileSync(BALANCE_PATH, JSON.stringify(d, null, 2)); }

function getBalance(userId) {
  return loadBalances()[userId]?.balance ?? STARTING_BALANCE;
}

function adjustBalance(userId, delta) {
  const d = loadBalances();
  if (!d[userId]) d[userId] = { balance: STARTING_BALANCE, lastClaim: null };
  d[userId].balance = Math.max(0, d[userId].balance + delta);
  saveBalances(d);
  return d[userId].balance;
}

function claimDaily(userId) {
  const d     = loadBalances();
  const today = todayStr();
  if (!d[userId]) d[userId] = { balance: STARTING_BALANCE, lastClaim: null };
  if (d[userId].lastClaim === today)
    return { success: false, message: `You've already claimed your daily **£${DAILY_CLAIM}** today. Come back tomorrow!` };
  d[userId].balance += DAILY_CLAIM;
  d[userId].lastClaim = today;
  saveBalances(d);
  return { success: true, newBalance: d[userId].balance };
}

// ── Bets ──────────────────────────────────────────────────────────────────────
function loadBets() {
  try { if (fs.existsSync(BETS_PATH)) return JSON.parse(fs.readFileSync(BETS_PATH, 'utf8')); } catch {}
  return [];
}
function saveBets(b) { fs.writeFileSync(BETS_PATH, JSON.stringify(b, null, 2)); }

function placeBet(userId, username, cardNum, raceNum, trap, amount, betType, trap2 = null, trap3 = null) {
  const race = getRace(cardNum, raceNum);
  if (!race)                       return { success: false, message: 'Race not found.' };
  if (race.status === 'completed') return { success: false, message: 'This race has already finished.' };

  const raceTime = new Date(race.startTime).getTime();
  if (Date.now() >= raceTime - 2 * 60 * 1000)
    return { success: false, message: 'Betting is now closed for this race (closes 2 minutes before off).' };

  if (betType === 'forecast') {
    if (!trap2)         return { success: false, message: 'Forecast bets require a 2nd selection.' };
    if (trap === trap2) return { success: false, message: '1st and 2nd selections must be different dogs.' };
  }
  if (betType === 'tricast') {
    if (!trap2 || !trap3)                       return { success: false, message: 'Tricast bets require 2nd and 3rd selections.' };
    if (new Set([trap, trap2, trap3]).size < 3) return { success: false, message: 'All three selections must be different dogs.' };
  }

  const totalCost = betType === 'ew' ? amount * 2 : amount;
  const bal       = getBalance(userId);
  if (bal < totalCost)
    return { success: false, message: `Not enough funds. Balance: **£${bal}**, cost: **£${totalCost}**.` };

  adjustBalance(userId, -totalCost);

  const bet = {
    betId: `${userId}-${Date.now()}`,
    userId, username, cardNum, raceNum,
    raceKey: `${cardNum}-${raceNum}`,
    trap, trap2, trap3, amount, betType,
    totalStake: totalCost,
    status: 'pending', payout: null,
    placedAt: new Date().toISOString(),
  };
  const bets = loadBets();
  bets.push(bet);
  saveBets(bets);

  const runner = race.runners.find(r => r.trap === trap);
  return { success: true, bet, runner, newBalance: getBalance(userId) };
}

function settleBets(cardNum, raceNum, positions) {
  const race = getRace(cardNum, raceNum);
  if (!race) return [];

  const [first, second, third] = positions;
  const bets    = loadBets();
  const results = [];

  for (const bet of bets) {
    if (bet.cardNum !== cardNum || bet.raceNum !== raceNum || bet.status !== 'pending') continue;

    const r1 = race.runners.find(r => r.trap === bet.trap);
    const r2 = race.runners.find(r => r.trap === bet.trap2);
    const r3 = race.runners.find(r => r.trap === bet.trap3);
    const d1 = r1?.decimalOdds ?? 2.0;
    const d2 = r2?.decimalOdds ?? 2.0;
    const d3 = r3?.decimalOdds ?? 2.0;

    let payout = 0;
    if (bet.betType === 'win') {
      if (bet.trap === first) payout = Math.floor(bet.amount * d1);
    } else if (bet.betType === 'ew') {
      // Win part
      if (bet.trap === first) payout += Math.floor(bet.amount * d1);
      // Place part (1/4 odds, 1st or 2nd with 6 runners)
      if (bet.trap === first || bet.trap === second) payout += Math.floor(bet.amount * (1 + (d1 - 1) / 4));
    } else if (bet.betType === 'forecast') {
      if (bet.trap === first && bet.trap2 === second)
        payout = Math.floor(bet.amount * d1 * d2 * 0.75);
    } else if (bet.betType === 'tricast') {
      if (bet.trap === first && bet.trap2 === second && bet.trap3 === third)
        payout = Math.floor(bet.amount * d1 * d2 * d3 * 0.6);
    }

    bet.status = payout > 0 ? 'won' : 'lost';
    bet.payout = payout;
    if (payout > 0) adjustBalance(bet.userId, payout);
    results.push({ bet, payout, won: payout > 0 });
  }

  saveBets(bets);
  return results;
}

function getUserBets(userId, limit = 10) {
  return loadBets().filter(b => b.userId === userId).slice(-limit).reverse();
}

function getDogFormGuide(searchName) {
  const dog = DOG_POOL.find(d => d.name.toLowerCase().includes(searchName.toLowerCase()));
  if (!dog) return null;
  const history = [];
  try {
    const s = getSchedule();
    for (const card of s.cards) {
      for (const race of card.races) {
        if (race.status !== 'completed') continue;
        const ri = race.runners.findIndex(r => r.dog.id === dog.id);
        if (ri === -1) continue;
        const trap = race.runners[ri].trap;
        const pos  = race.result.positions.indexOf(trap) + 1;
        history.push({ track: card.track.name, raceKey: race.raceKey, pos, frac: race.runners[ri].fractionalOdds });
      }
    }
  } catch {}
  return { dog, history };
}

module.exports = {
  generateSchedule, getSchedule, getRace,
  simulateRace, markRaceComplete,
  getBalance, adjustBalance, claimDaily,
  placeBet, settleBets, getUserBets,
  getDogFormGuide,
  DOG_POOL, TRACKS, DAILY_CLAIM, STARTING_BALANCE,
  CARDS_PER_DAY, RACES_PER_CARD,
};
