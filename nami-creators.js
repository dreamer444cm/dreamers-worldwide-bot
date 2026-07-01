// ============================================================
//  nami-creators.js  —  Creator Self-Service & Tracking
//  Activated automatically from index.js when this file exists
//  -----------------------------------------------------------
//   1. Link/unlink Discord accounts to creator profiles
//   2. /checkin + /checkout — track days active & hours live
//   3. /mystats — creator views their own private progress
//   4. Daily at-risk DMs — warn creators falling behind
//   5. Requirements celebration — 12 days + 35 hrs
//      → DM the creator + alert your locked channel
//   6. Weekly report — every Friday 8 AM Eastern
//      → full breakdown posted to your locked channel
// ============================================================

const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

// ----------------------- CONFIG -----------------------------
const CONFIG = {
  // Your private locked channel (admin alerts go here)
  adminChannelId: '1521453282067877929',

  // Monthly requirements
  requiredDays: 12,
  requiredHours: 35,

  // Weekly report: Friday = 5, 8 AM Eastern
  weeklyReportDay: 5,
  weeklyReportHour: 8,
  weeklyReportMinute: 0,
  weeklyReportTimezone: 'America/New_York',

  // Daily at-risk check time: 9 AM Eastern
  dailyCheckHour: 9,
  dailyCheckMinute: 0,
  dailyCheckTimezone: 'America/New_York',

  dataFile: '/data/nami-creators.json',
  brandColor: 0xff2d9b,
};
// ------------------------------------------------------------

let data = { creators: {} };
// Shape:
// data.creators[discordUserId] = {
//   discordId: "123456",
//   name: "Maya",
//   tiktok: "@mayacreates",
//   linkedAt: timestamp,
//   months: {
//     "2026-07": {
//       days: ["2026-07-01", "2026-07-03"],  // unique days with checkin
//       sessions: [
//         { checkin: timestamp, checkout: timestamp, hours: 2.5 }
//       ],
//       totalHours: 12.5,
//       requirementsMet: false,
//       requirementsMetDate: null,
//     }
//   }
// }

function loadData() {
  try {
    if (fs.existsSync(CONFIG.dataFile)) {
      data = JSON.parse(fs.readFileSync(CONFIG.dataFile, 'utf8')) || { creators: {} };
    }
  } catch (e) { console.warn('[Nami Creators] Could not read data:', e.message); }
}

function saveData() {
  try { fs.writeFileSync(CONFIG.dataFile, JSON.stringify(data)); }
  catch (e) { console.warn('[Nami Creators] No volume — data resets on redeploy.'); }
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function daysLeftInMonth() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

function nowInZone(tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'long',
  }).formatToParts(new Date());
  const g = t => parts.find(p => p.type === t)?.value;
  let hour = +g('hour'); if (hour === 24) hour = 0;
  const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return {
    date: `${g('year')}-${g('month')}-${g('day')}`,
    hour,
    minute: +g('minute'),
    weekday: weekdays.indexOf(g('weekday')),
  };
}

function getOrCreateMonth(creator, monthKey) {
  if (!creator.months) creator.months = {};
  if (!creator.months[monthKey]) {
    creator.months[monthKey] = {
      days: [],
      sessions: [],
      totalHours: 0,
      requirementsMet: false,
      requirementsMetDate: null,
    };
  }
  return creator.months[monthKey];
}

// ── Public API ───────────────────────────────────────────────

function linkCreator(discordId, name, tiktok) {
  if (data.creators[discordId]) return { already: true, creator: data.creators[discordId] };
  data.creators[discordId] = {
    discordId,
    name: name.trim(),
    tiktok: tiktok?.trim() || '',
    linkedAt: Date.now(),
    months: {},
    activeSession: null,
  };
  saveData();
  return { already: false, creator: data.creators[discordId] };
}

function unlinkCreator(discordId) {
  if (!data.creators[discordId]) return false;
  delete data.creators[discordId];
  saveData();
  return true;
}

function getCreator(discordId) {
  return data.creators[discordId] || null;
}

function checkin(discordId) {
  const creator = data.creators[discordId];
  if (!creator) return { error: 'not_linked' };
  if (creator.activeSession) return { error: 'already_checked_in', since: creator.activeSession.checkin };

  creator.activeSession = { checkin: Date.now() };
  saveData();

  const monthKey = currentMonthKey();
  const month = getOrCreateMonth(creator, monthKey);
  const today = todayKey();
  if (!month.days.includes(today)) {
    month.days.push(today);
  }
  saveData();

  return { ok: true, creator };
}

function checkout(discordId) {
  const creator = data.creators[discordId];
  if (!creator) return { error: 'not_linked' };
  if (!creator.activeSession) return { error: 'not_checked_in' };

  const checkinTime = creator.activeSession.checkin;
  const checkoutTime = Date.now();
  const hours = Math.round((checkoutTime - checkinTime) / 3600000 * 10) / 10;

  const monthKey = currentMonthKey();
  const month = getOrCreateMonth(creator, monthKey);
  month.sessions.push({ checkin: checkinTime, checkout: checkoutTime, hours });
  month.totalHours = Math.round((month.totalHours + hours) * 10) / 10;
  creator.activeSession = null;
  saveData();

  return { ok: true, hours, creator, month };
}

function getStats(discordId) {
  const creator = data.creators[discordId];
  if (!creator) return null;
  const monthKey = currentMonthKey();
  const month = getOrCreateMonth(creator, monthKey);
  return {
    name: creator.name,
    tiktok: creator.tiktok,
    days: month.days.length,
    hours: month.totalHours,
    requirementsMet: month.requirementsMet,
    daysNeeded: Math.max(0, CONFIG.requiredDays - month.days.length),
    hoursNeeded: Math.max(0, CONFIG.requiredHours - month.totalHours),
    activeSession: creator.activeSession,
  };
}

function getAllCreatorStats() {
  const monthKey = currentMonthKey();
  return Object.values(data.creators).map(creator => {
    const month = creator.months?.[monthKey] || { days: [], totalHours: 0, requirementsMet: false };
    return {
      discordId: creator.discordId,
      name: creator.name,
      tiktok: creator.tiktok,
      days: month.days.length,
      hours: month.totalHours,
      requirementsMet: month.requirementsMet,
      active: month.days.length > 0,
    };
  }).sort((a, b) => b.days - a.days);
}

// ── Scheduled Tasks ──────────────────────────────────────────

async function sendAdminAlert(client, embed) {
  try {
    const ch = await client.channels.fetch(CONFIG.adminChannelId);
    await ch.send({ embeds: [embed] });
  } catch (e) { console.error('[Nami Creators] Admin alert failed:', e.message); }
}

async function dmCreator(client, discordId, embed) {
  try {
    const user = await client.users.fetch(discordId);
    await user.send({ embeds: [embed] });
  } catch (e) { console.warn(`[Nami Creators] Could not DM ${discordId}:`, e.message); }
}

async function runDailyCheck(client) {
  const monthKey = currentMonthKey();
  const daysLeft = daysLeftInMonth();

  for (const creator of Object.values(data.creators)) {
    const month = creator.months?.[monthKey] || { days: [], totalHours: 0, requirementsMet: false };
    if (month.requirementsMet) continue;
    if (month.days.length === 0) continue; // only warn active creators

    const daysStillNeeded = CONFIG.requiredDays - month.days.length;
    const hoursStillNeeded = CONFIG.requiredHours - month.totalHours;

    // At risk: not enough days left to hit requirement
    const atRisk = daysStillNeeded > 0 && daysLeft <= daysStillNeeded + 2;

    if (atRisk) {
      const embed = new EmbedBuilder()
        .setColor(CONFIG.brandColor)
        .setTitle('⏰ Heads Up, Dreamer! / Perhatian, Dreamer!')
        .setDescription(
          `You still need **${daysStillNeeded} more day(s)** and **${Math.max(0, hoursStillNeeded).toFixed(1)} more hour(s)** to meet this month's requirements — and there are only **${daysLeft} day(s)** left!\n\nGo LIVE and use \`/checkin\` when you start! 🔴\n\n` +
          `🇮🇩 Kamu masih butuh **${daysStillNeeded} hari lagi** dan **${Math.max(0, hoursStillNeeded).toFixed(1)} jam lagi** untuk memenuhi persyaratan bulan ini — tinggal **${daysLeft} hari** tersisa!\n\nYuk LIVE dan gunakan \`/checkin\` saat mulai! 🔴`
        )
        .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' });

      await dmCreator(client, creator.discordId, embed);
    }
  }
}

async function runWeeklyReport(client) {
  const stats = getAllCreatorStats();
  if (!stats.length) return;

  const lines = stats.map(c => {
    const status = c.requirementsMet ? '🏆 Met' : c.active ? (
      (CONFIG.requiredDays - c.days <= daysLeftInMonth() + 2) ? '✅ On track' : '⚠️ At risk'
    ) : '😴 Inactive';
    return `**${c.name}** (${c.tiktok || 'no TikTok'}) — ${c.days} days | ${c.hours} hrs | ${status}`;
  });

  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const embed = new EmbedBuilder()
    .setColor(CONFIG.brandColor)
    .setTitle(`📊 Weekly Creator Report — ${monthName}`)
    .setDescription(lines.join('\n'))
    .addFields(
      { name: 'Requirements', value: `${CONFIG.requiredDays} days + ${CONFIG.requiredHours} hrs per month`, inline: true },
      { name: 'Days Left', value: `${daysLeftInMonth()} day(s)`, inline: true },
    )
    .setFooter({ text: 'Dreamers Worldwide Bot 🌐' })
    .setTimestamp();

  await sendAdminAlert(client, embed);
}

async function checkRequirementsMet(client, creator, month) {
  if (month.requirementsMet) return;
  if (month.days.length >= CONFIG.requiredDays && month.totalHours >= CONFIG.requiredHours) {
    month.requirementsMet = true;
    month.requirementsMetDate = Date.now();
    saveData();

    // DM the creator
    const creatorEmbed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🏆 Requirements Met! / Persyaratan Terpenuhi!')
      .setDescription(
        `Congratulations **${creator.name}**! You've hit **${month.days.length} days** and **${month.totalHours} hours** this month — requirements complete! 🎉\n\nYour agent has been notified. Keep going! 💪\n\n` +
        `🇮🇩 Selamat **${creator.name}**! Kamu sudah mencapai **${month.days.length} hari** dan **${month.totalHours} jam** bulan ini — persyaratan selesai! 🎉\n\nAgenmu telah diberitahu. Terus semangat! 💪`
      )
      .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' });

    await dmCreator(client, creator.discordId, creatorEmbed);

    // Alert admin
    const adminEmbed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🏆 Creator Hit Requirements!')
      .addFields(
        { name: 'Creator', value: creator.name, inline: true },
        { name: 'TikTok', value: creator.tiktok || 'N/A', inline: true },
        { name: 'Days', value: `${month.days.length}`, inline: true },
        { name: 'Hours', value: `${month.totalHours}`, inline: true },
      )
      .setFooter({ text: 'Dreamers Worldwide Bot 🌐' })
      .setTimestamp();

    await sendAdminAlert(client, adminEmbed);
  }
}

function setupCreators(client) {
  loadData();

  setInterval(async () => {
    // Daily at-risk check
    const daily = nowInZone(CONFIG.dailyCheckTimezone);
    if (daily.hour === CONFIG.dailyCheckHour && daily.minute === CONFIG.dailyCheckMinute) {
      const key = `daily-${daily.date}`;
      if (!data._lastDaily || data._lastDaily !== key) {
        data._lastDaily = key;
        saveData();
        await runDailyCheck(client);
      }
    }

    // Weekly report — Friday 8 AM Eastern
    const weekly = nowInZone(CONFIG.weeklyReportTimezone);
    if (
      weekly.weekday === CONFIG.weeklyReportDay &&
      weekly.hour === CONFIG.weeklyReportHour &&
      weekly.minute === CONFIG.weeklyReportMinute
    ) {
      const key = `weekly-${weekly.date}`;
      if (!data._lastWeekly || data._lastWeekly !== key) {
        data._lastWeekly = key;
        saveData();
        await runWeeklyReport(client);
      }
    }
  }, 60 * 1000);

  console.log('[Nami] Creator self-service is live.');
}

module.exports = {
  setupCreators,
  linkCreator,
  unlinkCreator,
  getCreator,
  checkin,
  checkout,
  getStats,
  checkRequirementsMet,
  CONFIG,
};
