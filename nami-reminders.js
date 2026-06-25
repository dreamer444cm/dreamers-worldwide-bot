// ============================================================
//  nami-reminders.js  —  Reminders & Channel Alerts
//  Switched on from index.js with:  setupNami(client);
//  -----------------------------------------------------------
//   1. Daily check-in nudges (Dreamers AM + Pinnacle PM)
//   2. Alert the moment a creator posts in a watched channel
//   3. On-demand:  !remind 3d <note>   in your private channel
// ============================================================

const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

// ----------------------- CONFIG -----------------------------
// Already filled in. To change a reminder time, edit hour/minute
// (24-hour clock: 8pm = 20, 9pm = 21).

const CONFIG = {
  alertsChannelId: '1519491630380355604',   // 🔒reminders⏰🔒 — where Nami pings you

  ownerUserId: '1278629963775606819',        // you

  watchedChannels: [
    { id: '1519214411972083713', label: 'Request' },  // requests channel
    { id: '1519504356574105760', label: 'Ban' },      // banned-pembatasan
  ],

  dailyReminders: [
    {
      label: 'Dreamers prime time',
      enabled: true,
      hour: 21, minute: 0,            // 9:00 PM Jakarta (≈ 10 AM your time)
      timezone: 'Asia/Jakarta',
      message: 'Dreamers are going LIVE right now — time to check in on your Indonesian creators.',
    },
    {
      label: 'Pinnacle / US prime time',
      enabled: true,
      hour: 20, minute: 0,            // 8:00 PM Eastern
      timezone: 'America/New_York',
      message: 'US prime time — sweep your channels and check on your Pinnacle creators.',
    },
  ],

  dataFile: '/data/nami-reminders.json',
  brandColor: 0xff2d9b,
};
// ------------------------------------------------------------

let started = false;
let pending = [];
let canPersist = true;

function loadReminders() {
  try {
    if (fs.existsSync(CONFIG.dataFile)) {
      pending = JSON.parse(fs.readFileSync(CONFIG.dataFile, 'utf8')) || [];
    }
  } catch (e) { console.warn('[Nami] Could not read reminders:', e.message); }
}
function saveReminders() {
  try { fs.writeFileSync(CONFIG.dataFile, JSON.stringify(pending)); }
  catch (e) {
    if (canPersist) { canPersist = false;
      console.warn('[Nami] No volume — reminders reset on redeploy.'); }
  }
}
function nowInZone(tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date());
  const g = t => parts.find(p => p.type === t).value;
  let hour = +g('hour'); if (hour === 24) hour = 0;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, hour, minute: +g('minute') };
}
function parseDuration(str) {
  const m = /^(\d+)\s*([mhdw])$/i.exec(str.trim());
  if (!m) return null;
  return +m[1] * { m: 60000, h: 3600000, d: 86400000, w: 604800000 }[m[2].toLowerCase()];
}
async function sendToAlerts(client, payload) {
  try {
    const ch = await client.channels.fetch(CONFIG.alertsChannelId);
    await ch.send(payload);
  } catch (e) { console.error('[Nami] Alert send failed:', e.message); }
}

function setupNami(client) {
  if (started) return;
  started = true;
  loadReminders();

  setInterval(() => {
    // ----- daily check-in nudges -----
    for (const r of CONFIG.dailyReminders) {
      if (!r.enabled) continue;
      const t = nowInZone(r.timezone);
      if (t.hour === r.hour && t.minute === r.minute && r._lastDate !== t.date) {
        r._lastDate = t.date;
        const list = CONFIG.watchedChannels.map(w => `<#${w.id}>`).join(' · ');
        const embed = new EmbedBuilder()
          .setColor(CONFIG.brandColor)
          .setTitle('🔔 ' + (r.label || 'Daily check-in'))
          .setDescription((r.message || 'Time to sweep your Discord.') + (list ? `\n\nPeek at ${list}.` : ''))
          .setFooter({ text: 'Dream Big · Go Live · Get Paid' });
        sendToAlerts(client, { content: `<@${CONFIG.ownerUserId}>`, embeds: [embed] });
      }
    }
    // ----- due on-demand reminders -----
    const now = Date.now();
    const due = pending.filter(r => r.due <= now);
    if (due.length) {
      pending = pending.filter(r => r.due > now);
      saveReminders();
      for (const r of due) {
        const embed = new EmbedBuilder()
          .setColor(CONFIG.brandColor).setTitle('⏰ Reminder').setDescription(r.note);
        sendToAlerts(client, { content: `<@${CONFIG.ownerUserId}>`, embeds: [embed] });
      }
    }
  }, 60 * 1000);

  // ----- creator-post watcher + !remind command -----
  client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    if (msg.channel.id === CONFIG.alertsChannelId &&
        msg.author.id === CONFIG.ownerUserId &&
        msg.content.startsWith('!remind')) {
      const rest = msg.content.slice('!remind'.length).trim();
      if (rest === 'list') {
        if (!pending.length) return msg.reply('No reminders set.');
        return msg.reply(pending.sort((a, b) => a.due - b.due)
          .map((r, i) => `**${i + 1}.** <t:${Math.floor(r.due / 1000)}:R> — ${r.note}`).join('\n'));
      }
      if (rest === 'clear') { pending = []; saveReminders(); return msg.reply('Cleared.'); }
      const sp = rest.indexOf(' ');
      const dur = sp === -1 ? rest : rest.slice(0, sp);
      const note = sp === -1 ? '' : rest.slice(sp + 1).trim();
      const ms = parseDuration(dur);
      if (!ms || !note) return msg.reply("Try: `!remind 3d Check Maya's payout` (units: m, h, d, w).");
      const dueAt = Date.now() + ms;
      pending.push({ due: dueAt, note }); saveReminders();
      return msg.reply(`Got it — I'll remind you <t:${Math.floor(dueAt / 1000)}:R>.`);
    }

    const watched = CONFIG.watchedChannels.find(w => w.id === msg.channel.id);
    if (!watched) return;
    const text = msg.content && msg.content.length
      ? (msg.content.length > 400 ? msg.content.slice(0, 400) + '…' : msg.content)
      : '_(no text — likely an image or attachment)_';
    const link = msg.guild
      ? `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}` : '';
    const embed = new EmbedBuilder()
      .setColor(CONFIG.brandColor)
      .setAuthor({ name: msg.member?.displayName || msg.author.username,
                   iconURL: msg.author.displayAvatarURL() })
      .setTitle(`🆕 New ${watched.label} in #${msg.channel.name}`)
      .setDescription(text)
      .setTimestamp(msg.createdTimestamp);
    if (link) embed.setURL(link);
    sendToAlerts(client, { content: `<@${CONFIG.ownerUserId}>`, embeds: [embed] });
  });

  console.log('[Nami] Reminders & creator alerts are live.');
}

module.exports = { setupNami };
