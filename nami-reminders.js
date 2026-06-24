// ============================================================
//  Nami — Reminders & Channel Alerts
//  Drop-in module for Dreamers Worldwide (discord.js v14)
//  -----------------------------------------------------------
//  Three things this adds:
//   1. Daily check-in reminder  (Nami pings you once a day)
//   2. Channel watch alerts      (Nami pings you the instant a
//                                 creator posts in your requests
//                                 or issues channels)
//   3. On-demand reminders       (type  !remind 3d <note>  in your
//                                 private channel)
// ============================================================

const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

// ----------------------- CONFIG -----------------------------
// Fill these four things in. To get an ID on your phone:
// Discord → Settings → Advanced → turn ON Developer Mode,
// then long-press a channel or your own name → Copy ID.

const CONFIG = {
  // Private channel where Nami sends YOU reminders & alerts.
  // Make a channel only you can see, then copy its ID here.
  alertsChannelId: 'PASTE_YOUR_PRIVATE_CHANNEL_ID',

  // Your own Discord user ID — lets Nami @mention you so your
  // phone actually buzzes. Long-press your name → Copy User ID.
  ownerUserId: 'PASTE_YOUR_USER_ID',

  // Channels Nami watches. The moment a creator posts in one of
  // these, you get pinged. Add as many as you like.
  watchedChannels: [
    { id: 'PASTE_REQUESTS_CHANNEL_ID', label: 'Request' },
    { id: 'PASTE_ISSUES_CHANNEL_ID',   label: 'Issue'   },
    // { id: 'ANOTHER_CHANNEL_ID',     label: 'Question' },
  ],

  // Daily check-in reminder
  dailyReminder: {
    enabled: true,
    hour: 9,        // 24-hour clock, in YOUR timezone (9 = 9am)
    minute: 0,
    timezone: 'America/New_York',   // <-- change to your timezone
  },

  // Where on-demand reminders are saved so they survive a redeploy.
  // This is a Railway Volume mount path. If you haven't added a
  // volume yet, everything else still works — only !remind forgets
  // after a redeploy. (Railway → your service → Volumes → mount at /data)
  dataFile: '/data/nami-reminders.json',

  brandColor: 0xff2d9b, // hot pink
};
// ------------------------------------------------------------


let pending = [];          // on-demand reminders waiting to fire
let canPersist = true;     // flips false if there's no volume
let lastDailyDate = null;  // guards against double-firing the daily

// ---------- save / load on-demand reminders -----------------
function loadReminders() {
  try {
    if (fs.existsSync(CONFIG.dataFile)) {
      pending = JSON.parse(fs.readFileSync(CONFIG.dataFile, 'utf8')) || [];
      console.log(`[Nami] Loaded ${pending.length} saved reminder(s).`);
    }
  } catch (e) {
    console.warn('[Nami] Could not read saved reminders:', e.message);
  }
}
function saveReminders() {
  try {
    fs.writeFileSync(CONFIG.dataFile, JSON.stringify(pending));
  } catch (e) {
    if (canPersist) {
      canPersist = false;
      console.warn('[Nami] No volume found — reminders will work but reset on redeploy.');
    }
  }
}

// ---------- timezone-aware current time ---------------------
function nowInZone(tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date());
  const get = t => parts.find(p => p.type === t).value;
  let hour = +get('hour'); if (hour === 24) hour = 0; // midnight edge case
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour, minute: +get('minute') };
}

// ---------- helper: send to your private channel ------------
async function sendToAlerts(client, payload) {
  try {
    const ch = await client.channels.fetch(CONFIG.alertsChannelId);
    await ch.send(payload);
  } catch (e) {
    console.error('[Nami] Could not send to alerts channel:', e.message);
  }
}

// ---------- parse durations like 30m / 2h / 3d / 1w ---------
function parseDuration(str) {
  const m = /^(\d+)\s*([mhdw])$/i.exec(str.trim());
  if (!m) return null;
  const n = +m[1];
  const unit = { m: 60000, h: 3600000, d: 86400000, w: 604800000 }[m[2].toLowerCase()];
  return n * unit;
}

// ===========================================================
//   MAIN — call setupNami(client) once after you create client
// ===========================================================
function setupNami(client) {
  loadReminders();

  // ---- 1 & 3: the once-a-minute tick (daily + due reminders) ----
  setInterval(() => {
    // daily check-in
    if (CONFIG.dailyReminder.enabled) {
      const t = nowInZone(CONFIG.dailyReminder.timezone);
      if (t.hour === CONFIG.dailyReminder.hour &&
          t.minute === CONFIG.dailyReminder.minute &&
          lastDailyDate !== t.date) {
        lastDailyDate = t.date;
        const watchList = CONFIG.watchedChannels.map(w => `<#${w.id}>`).join(' · ');
        const embed = new EmbedBuilder()
          .setColor(CONFIG.brandColor)
          .setTitle('🔔 Daily check-in')
          .setDescription(
            'Time to sweep your Discord. Peek at new posts from creators' +
            (watchList ? ` — especially ${watchList}.` : '.')
          )
          .setFooter({ text: 'Dream Big · Go Live · Get Paid' });
        sendToAlerts(client, { content: `<@${CONFIG.ownerUserId}>`, embeds: [embed] });
      }
    }

    // due on-demand reminders
    const now = Date.now();
    const due = pending.filter(r => r.due <= now);
    if (due.length) {
      pending = pending.filter(r => r.due > now);
      saveReminders();
      for (const r of due) {
        const embed = new EmbedBuilder()
          .setColor(CONFIG.brandColor)
          .setTitle('⏰ Reminder')
          .setDescription(r.note);
        sendToAlerts(client, { content: `<@${CONFIG.ownerUserId}>`, embeds: [embed] });
      }
    }
  }, 60 * 1000);

  // ---- 2: channel watcher + !remind command ----
  client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    // ---- on-demand reminder command (only you, in your channel) ----
    if (msg.channel.id === CONFIG.alertsChannelId &&
        msg.author.id === CONFIG.ownerUserId &&
        msg.content.startsWith('!remind')) {

      const rest = msg.content.slice('!remind'.length).trim();

      if (rest === 'list') {
        if (!pending.length) return msg.reply('No reminders set.');
        const lines = pending
          .sort((a, b) => a.due - b.due)
          .map((r, i) => `**${i + 1}.** <t:${Math.floor(r.due / 1000)}:R> — ${r.note}`);
        return msg.reply(lines.join('\n'));
      }
      if (rest === 'clear') {
        pending = []; saveReminders();
        return msg.reply('Cleared all reminders.');
      }

      const sp = rest.indexOf(' ');
      const durStr = sp === -1 ? rest : rest.slice(0, sp);
      const note = sp === -1 ? '' : rest.slice(sp + 1).trim();
      const ms = parseDuration(durStr);
      if (!ms || !note) {
        return msg.reply('Try: `!remind 3d Check Maya\'s payout`  (units: m, h, d, w). Also `!remind list` and `!remind clear`.');
      }
      const due = Date.now() + ms;
      pending.push({ due, note });
      saveReminders();
      return msg.reply(`Got it — I'll remind you <t:${Math.floor(due / 1000)}:R>.`);
    }

    // ---- watched-channel alert ----
    const watched = CONFIG.watchedChannels.find(w => w.id === msg.channel.id);
    if (!watched) return;

    const text = msg.content && msg.content.length
      ? (msg.content.length > 400 ? msg.content.slice(0, 400) + '…' : msg.content)
      : '_(no text — likely an image or attachment)_';
    const link = msg.guild
      ? `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`
      : '';

    const embed = new EmbedBuilder()
      .setColor(CONFIG.brandColor)
      .setAuthor({
        name: msg.member?.displayName || msg.author.username,
        iconURL: msg.author.displayAvatarURL(),
      })
      .setTitle(`🆕 New ${watched.label} in #${msg.channel.name}`)
      .setDescription(text)
      .setTimestamp(msg.createdTimestamp);
    if (link) embed.setURL(link);

    sendToAlerts(client, { content: `<@${CONFIG.ownerUserId}>`, embeds: [embed] });
  });

  console.log('[Nami] Reminders & channel alerts are live.');
}

module.exports = { setupNami };
