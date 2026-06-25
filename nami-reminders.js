// ============================================================
//  nami-reminders.js  —  Reminders, Alerts & Handled-Tracker
//  Switched on from index.js with:  setupNami(client);
//  -----------------------------------------------------------
//   1. Daily check-in nudges (Dreamers AM + Pinnacle PM)
//   2. Alert the moment a creator posts in a watched channel
//      → each alert gets a ✅ button. Tap it when handled.
//   3. Open-items safety net: a daily recap of anything not yet
//      ✅'d, plus type "open" anytime for an instant list.
//   4. On-demand:  remind 3d <note>  (with or without "!")
// ============================================================

const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

// ----------------------- CONFIG -----------------------------
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

  // Morning recap of anything still open (not yet ✅'d)
  openItemsDigest: {
    enabled: true,
    hour: 9, minute: 0,               // 9:00 AM Eastern
    timezone: 'America/New_York',
  },

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
// returns the sent message (so we can react to it)
async function sendToAlerts(client, payload) {
  try {
    const ch = await client.channels.fetch(CONFIG.alertsChannelId);
    return await ch.send(payload);
  } catch (e) { console.error('[Nami] Alert send failed:', e.message); return null; }
}

// ----- the handled-tracker: Discord reactions ARE the memory -----
async function getOpenItems(client) {
  const ch = await client.channels.fetch(CONFIG.alertsChannelId);
  const msgs = await ch.messages.fetch({ limit: 50 });
  const open = [];
  for (const [, m] of msgs) {
    if (m.author.id !== client.user.id) continue;            // only Nami's messages
    const title = m.embeds[0]?.title || '';
    if (!title.startsWith('🆕')) continue;                   // only creator-post alerts
    const react = m.reactions.cache.find(r => r.emoji.name === '✅');
    let handled = false;
    if (react && react.count > 1) {                          // someone besides Nami reacted
      try { const users = await react.users.fetch(); handled = users.has(CONFIG.ownerUserId); }
      catch (e) { /* ignore */ }
    }
    if (!handled) open.push(m);
  }
  return open.reverse(); // oldest first
}

async function postOpenDigest(client) {
  let open;
  try { open = await getOpenItems(client); }
  catch (e) { console.error('[Nami] Digest failed:', e.message); return; }
  const ch = await client.channels.fetch(CONFIG.alertsChannelId);
  if (!open.length) {
    const embed = new EmbedBuilder().setColor(CONFIG.brandColor)
      .setTitle('✨ All caught up')
      .setDescription("Nothing open right now — everything's been handled. 🦋");
    return ch.send({ embeds: [embed] });
  }
  const lines = open.map((m, i) => {
    const title = (m.embeds[0]?.title || 'Alert').replace(/^🆕\s*/, '');
    return `**${i + 1}.** ${title} — [open](${m.url})`;
  });
  const embed = new EmbedBuilder().setColor(CONFIG.brandColor)
    .setTitle(`📋 Still open (${open.length})`)
    .setDescription(lines.join('\n') + '\n\nTap ✅ on each alert once it\'s handled.');
  return ch.send({ content: `<@${CONFIG.ownerUserId}>`, embeds: [embed] });
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
    // ----- morning open-items recap -----
    const od = CONFIG.openItemsDigest;
    if (od && od.enabled) {
      const t = nowInZone(od.timezone);
      if (t.hour === od.hour && t.minute === od.minute && od._lastDate !== t.date) {
        od._lastDate = t.date;
        postOpenDigest(client);
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

  // ----- commands + creator-post watcher -----
  client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    // commands only from you, in your private channel
    if (msg.channel.id === CONFIG.alertsChannelId && msg.author.id === CONFIG.ownerUserId) {
      const body = msg.content.trim();

      // "open" — show what's still unhandled, right now
      if (/^open\b/i.test(body)) { await postOpenDigest(client); return; }

      // "remind 3d <note>" — forgiving: any case, ! optional
      if (/^!?\s*remind\b/i.test(body)) {
        const rest = body.replace(/^!?\s*remind/i, '').trim();
        if (/^list$/i.test(rest)) {
          if (!pending.length) return msg.reply('No reminders set.');
          return msg.reply(pending.sort((a, b) => a.due - b.due)
            .map((r, i) => `**${i + 1}.** <t:${Math.floor(r.due / 1000)}:R> — ${r.note}`).join('\n'));
        }
        if (/^clear$/i.test(rest)) { pending = []; saveReminders(); return msg.reply('Cleared.'); }
        const sp = rest.indexOf(' ');
        const dur = sp === -1 ? rest : rest.slice(0, sp);
        const note = sp === -1 ? '' : rest.slice(sp + 1).trim();
        const ms = parseDuration(dur);
        if (!ms || !note) return msg.reply("Try: `remind 3d Check Maya's payout` (units: m, h, d, w).");
        const dueAt = Date.now() + ms;
        pending.push({ due: dueAt, note }); saveReminders();
        return msg.reply(`Got it — I'll remind you <t:${Math.floor(dueAt / 1000)}:R>.`);
      }
    }

    // creator-post watcher
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
    const sent = await sendToAlerts(client, { content: `<@${CONFIG.ownerUserId}>`, embeds: [embed] });
    if (sent) sent.react('✅').catch(() => {});   // the tappable "handled" button
  });

  console.log('[Nami] Reminders, alerts & handled-tracker are live.');
}

module.exports = { setupNami };
