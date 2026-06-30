// ============================================================
//  nami-diamonds.js  —  Creator Diamond & Milestone Tracker
//  Switched on from index.js with:  setupDiamonds(client);
//  -----------------------------------------------------------
//   1. Log monthly diamonds per creator via /logdiamonds
//   2. Check a creator's current month total + next milestone
//   3. See who's close to their next tier (within a threshold)
//   4. Auto-alert in a channel when a creator crosses a
//      milestone for the first time that month
//   5. Totals reset automatically each new calendar month,
//      but past months stay in history for records
// ============================================================

const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

// ----------------------- CONFIG -----------------------------
const CONFIG = {
  // Where milestone-crossed celebrations get posted (set to your alerts/announcements channel)
  alertsChannelId: '1519491630380355604',

  // Diamond milestone tiers (cumulative, in diamonds for the month)
  milestones: [10000, 30000, 50000, 100000, 200000, 500000, 1000000],

  dataFile: '/data/nami-diamonds.json',
  brandColor: 0xff2d9b,
};
// ------------------------------------------------------------

let data = { creators: {} };
// Shape:
// data.creators[creatorKey] = {
//   name: "Maya",
//   months: {
//     "2026-06": { total: 42000, milestonesHit: [10000, 30000] }
//   }
// }

function loadData() {
  try {
    if (fs.existsSync(CONFIG.dataFile)) {
      data = JSON.parse(fs.readFileSync(CONFIG.dataFile, 'utf8')) || { creators: {} };
    }
  } catch (e) { console.warn('[Nami Diamonds] Could not read data:', e.message); }
}
function saveData() {
  try { fs.writeFileSync(CONFIG.dataFile, JSON.stringify(data)); }
  catch (e) { console.warn('[Nami Diamonds] No volume — data resets on redeploy.'); }
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getCreatorKey(name) {
  return name.trim().toLowerCase();
}

function getOrCreateCreator(name) {
  const key = getCreatorKey(name);
  if (!data.creators[key]) {
    data.creators[key] = { name: name.trim(), months: {} };
  }
  return data.creators[key];
}

function getOrCreateMonth(creator, monthKey) {
  if (!creator.months[monthKey]) {
    creator.months[monthKey] = { total: 0, milestonesHit: [] };
  }
  return creator.months[monthKey];
}

function nextMilestone(total) {
  return CONFIG.milestones.find(m => m > total) || null;
}

function formatNumber(n) {
  return n.toLocaleString('en-US');
}

// Adds diamonds to a creator's current month total.
// Returns { creator, monthData, newlyHitMilestones }
function logDiamonds(name, amount) {
  const monthKey = currentMonthKey();
  const creator = getOrCreateCreator(name);
  const monthData = getOrCreateMonth(creator, monthKey);

  const before = monthData.total;
  monthData.total += amount;
  const after = monthData.total;

  const newlyHit = CONFIG.milestones.filter(
    m => before < m && after >= m && !monthData.milestonesHit.includes(m)
  );
  newlyHit.forEach(m => monthData.milestonesHit.push(m));

  saveData();
  return { creator, monthData, newlyHit };
}

function getCreatorStatus(name) {
  const key = getCreatorKey(name);
  const creator = data.creators[key];
  if (!creator) return null;
  const monthKey = currentMonthKey();
  const monthData = creator.months[monthKey] || { total: 0, milestonesHit: [] };
  return {
    name: creator.name,
    total: monthData.total,
    next: nextMilestone(monthData.total),
    milestonesHit: monthData.milestonesHit,
  };
}

// Returns all creators sorted by how close they are to their next milestone
function getCloseToMilestone(withinPercent = 20) {
  const monthKey = currentMonthKey();
  const results = [];
  for (const key in data.creators) {
    const creator = data.creators[key];
    const monthData = creator.months[monthKey];
    if (!monthData) continue;
    const next = nextMilestone(monthData.total);
    if (!next) continue;
    const prevMilestone = [...CONFIG.milestones].reverse().find(m => m <= monthData.total) || 0;
    const range = next - prevMilestone;
    const progress = monthData.total - prevMilestone;
    const percentRemaining = ((next - monthData.total) / range) * 100;
    if (percentRemaining <= withinPercent) {
      results.push({
        name: creator.name,
        total: monthData.total,
        next,
        remaining: next - monthData.total,
        percentRemaining: Math.round(percentRemaining),
      });
    }
  }
  return results.sort((a, b) => a.remaining - b.remaining);
}

async function announceMilestone(client, creatorName, milestone) {
  try {
    const ch = await client.channels.fetch(CONFIG.alertsChannelId);
    const embed = new EmbedBuilder()
      .setColor(CONFIG.brandColor)
      .setTitle('🎉 Milestone Reached!')
      .setDescription(`**${creatorName}** just crossed **${formatNumber(milestone)} 💎** this month!\n\n🇮🇩 **${creatorName}** baru saja mencapai **${formatNumber(milestone)} 💎** bulan ini!`)
      .setFooter({ text: 'Dream Big · Go Live · Get Paid' })
      .setTimestamp();
    await ch.send({ embeds: [embed] });
  } catch (e) { console.error('[Nami Diamonds] Announce failed:', e.message); }
}

function setupDiamonds(client) {
  loadData();
  console.log('[Nami] Diamond & milestone tracker is live.');
}

module.exports = {
  setupDiamonds,
  logDiamonds,
  getCreatorStatus,
  getCloseToMilestone,
  announceMilestone,
  formatNumber,
  currentMonthKey,
  CONFIG,
};
