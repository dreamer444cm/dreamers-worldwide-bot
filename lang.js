// ============================================================
//  DREAMERS WORLDWIDE BOT
//  "Dream Big. Go Live. Get Paid."
//  Colors: Hot Pink #ff2d9b | Cyan #00e5ff | Gold #ffd700
// ============================================================

// Convert hex color to integer for Discord embeds
const COLORS = {
  pink: 0xff2d9b,
  cyan: 0x00e5ff,
  gold: 0xffd700,
  red:  0xff0000,
};

// Bilingual strings: English (en) and Indonesian (id)
const strings = {
  en: {
    // General
    ping_title: '🏓 Pong!',
    ping_latency: 'Bot Latency',
    ping_api: 'API Latency',

    // Welcome
    welcome_title: '✨ Welcome, Dreamer! ✨',
    welcome_desc: (member, guild) => `Hey ${member}, welcome to **${guild}** \u2014 so glad you\'re here! \ud83c\udf0d\ud83d\udc51\n\n\ud83d\udc49 Head over to <#1518941229818183781> to get started and tell us a little about you.`,
    welcome_member_count: 'Member Count',
    welcome_member_number: (count) => `You are member #${count}`,
    welcome_account_created: 'Account Created',

    // Introduce Yourself prompt
    intro_ping: (member) => `Hey ${member}! \ud83d\udc4b`,
    intro_title: '✨ Introduce Yourself, Dreamer! ✨',
    intro_desc: `Welcome to the **Dreamers Worldwide** family! \ud83c\udf0d\ud83d\udc51\n\nSo we can get to know you, drop a quick reply with these 3 things:\n\n1\ufe0f\u20e3 **Your name**\n2\ufe0f\u20e3 **Your TikTok handle** (@)\n3\ufe0f\u20e3 **What you create / go LIVE doing on TikTok**\n\nJust reply right here \u2014 we can\'t wait to meet you! \ud83d\udc96`,

    // Moderation
    member_not_found: '❌ Member not found.',
    cannot_kick: '❌ I cannot kick this member.',
    cannot_ban: '❌ I cannot ban this member.',
    cannot_timeout: '❌ I cannot timeout this member.',
    kick_title: '👢 Member Kicked',
    ban_title: '🔨 Member Banned',
    timeout_title: '🔇 Member Timed Out',
    mod_user: 'User',
    mod_moderator: 'Moderator',
    mod_reason: 'Reason',
    mod_no_reason: 'No reason provided',
    mod_messages_deleted: 'Messages Deleted',
    mod_days: (d) => `${d} day(s)`,
    mod_duration: 'Duration',
    mod_minutes: (m) => `${m} minute(s)`,

    // Music
    music_not_in_voice: '❌ You need to be in a voice channel!',
    music_searching: (q) => `🔍 Searching for **${q}**...`,
    music_nothing_playing: '❌ Nothing is playing!',
    music_queue_empty: '❌ The queue is empty!',
    music_skipped: '⏭️ Skipped!',
    music_stopped: '⏹️ Stopped and cleared the queue.',
    music_paused: '⏸️ Paused.',
    music_resumed: '▶️ Resumed.',
    music_queue_title: '🎵 Music Queue',
    music_queue_footer: (count, vol) => `${count} song(s) total | Volume: ${vol}%`,
    music_error: (e) => `❌ Error: ${e}`,

    // Error
    command_error: '❌ An error occurred while running this command.',
  },

  id: {
    // General
    ping_title: '🏓 Pong!',
    ping_latency: 'Latensi Bot',
    ping_api: 'Latensi API',

    // Welcome
    welcome_title: '✨ Selamat Datang, Dreamer! ✨',
    welcome_desc: (member, guild) => `Hei Dreamer ${member}, selamat datang di **${guild}** \u2014 senang kamu ada di sini! \ud83c\udf0d\ud83d\udc51\n\n\ud83d\udc49 Yuk langsung ke <#1518941229818183781> untuk memulai dan ceritakan sedikit tentang dirimu.`,
    welcome_member_count: 'Jumlah Member',
    welcome_member_number: (count) => `Kamu adalah member ke-#${count}`,
    welcome_account_created: 'Akun Dibuat',

    // Introduce Yourself prompt
    intro_ping: (member) => `Hei ${member}! \ud83d\udc4b`,
    intro_title: '✨ Kenalkan Dirimu, Dreamer! ✨',
    intro_desc: `Selamat datang di keluarga **Dreamers Worldwide**! \ud83c\udf0d\ud83d\udc51\n\nBiar kami bisa mengenalmu, balas pesan ini dengan 3 hal berikut:\n\n1\ufe0f\u20e3 **Namamu**\n2\ufe0f\u20e3 **Handle TikTok-mu** (@)\n3\ufe0f\u20e3 **Apa yang kamu buat / lakukan saat LIVE di TikTok**\n\nLangsung balas di sini ya \u2014 kami nggak sabar mengenalmu! \ud83d\udc96`,

    // Moderation
    member_not_found: '❌ Member tidak ditemukan.',
    cannot_kick: '❌ Saya tidak bisa mengeluarkan member ini.',
    cannot_ban: '❌ Saya tidak bisa memblokir member ini.',
    cannot_timeout: '❌ Saya tidak bisa membungkam member ini.',
    kick_title: '👢 Member Dikeluarkan',
    ban_title: '🔨 Member Diblokir',
    timeout_title: '🔇 Member Dibungkam',
    mod_user: 'Pengguna',
    mod_moderator: 'Moderator',
    mod_reason: 'Alasan',
    mod_no_reason: 'Tidak ada alasan',
    mod_messages_deleted: 'Pesan Dihapus',
    mod_days: (d) => `${d} hari`,
    mod_duration: 'Durasi',
    mod_minutes: (m) => `${m} menit`,

    // Music
    music_not_in_voice: '❌ Kamu harus berada di saluran suara!',
    music_searching: (q) => `🔍 Mencari **${q}**...`,
    music_nothing_playing: '❌ Tidak ada musik yang diputar!',
    music_queue_empty: '❌ Antrian kosong!',
    music_skipped: '⏭️ Dilewati!',
    music_stopped: '⏹️ Dihentikan dan antrian dikosongkan.',
    music_paused: '⏸️ Dijeda.',
    music_resumed: '▶️ Dilanjutkan.',
    music_queue_title: '🎵 Antrian Musik',
    music_queue_footer: (count, vol) => `${count} lagu total | Volume: ${vol}%`,
    music_error: (e) => `❌ Kesalahan: ${e}`,

    // Error
    command_error: '❌ Terjadi kesalahan saat menjalankan perintah ini.',
  },
};

// Default language — change to 'id' for Indonesian, 'en' for English
const DEFAULT_LANG = 'en';

function t(key, lang = DEFAULT_LANG, ...args) {
  const str = strings[lang]?.[key] ?? strings['en'][key];
  return typeof str === 'function' ? str(...args) : str;
}

module.exports = { t, DEFAULT_LANG, COLORS };
