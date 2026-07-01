const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('./lang.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('creatorhelp')
    .setDescription('Tampilkan panduan perintah creator / Show creator command guide'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.pink)
      .setTitle('🌟 Panduan Perintah Nami / Nami Command Guide')
      .setDescription(
        '*Semua pesan dari Nami bersifat pribadi — hanya kamu yang bisa melihatnya! 🔒*\n' +
        '*All Nami responses are private — only you can see them! 🔒*'
      )
      .addFields(
        {
          name: '🔗 Daftar Dulu / Register First',
          value: [
            '`/linkcreator` — Hubungkan akun Discord-mu ke profil creator',
            '*(Wajib dilakukan sekali sebelum menggunakan perintah lain)*',
            '',
            '`/linkcreator` — Link your Discord account to your creator profile',
            '*(Must be done once before using other commands)*',
          ].join('\n'),
        },
        {
          name: '🔴 Saat LIVE / When Going LIVE',
          value: [
            '`/checkin` — Catat bahwa kamu mulai LIVE',
            '`/checkout` — Catat bahwa kamu selesai LIVE (Nami akan hitung jam-mu otomatis)',
            '',
            '`/checkin` — Log that you are starting your LIVE session',
            '`/checkout` — Log that you finished (Nami calculates your hours automatically)',
          ].join('\n'),
        },
        {
          name: '📊 Cek Progresmu / Check Your Progress',
          value: [
            '`/mystats` — Lihat hari aktif, jam, diamond, dan status persyaratanmu bulan ini',
            '',
            '`/mystats` — See your active days, hours, diamonds & requirement status this month',
          ].join('\n'),
        },
        {
          name: '🏆 Persyaratan Bulanan / Monthly Requirements',
          value: [
            '✅ **12 hari aktif** LIVE dalam sebulan / **12 active days** LIVE per month',
            '✅ **35 jam total** LIVE dalam sebulan / **35 total hours** LIVE per month',
            '',
            'Nami akan mengingatkanmu jika kamu mulai tertinggal! 💪',
            'Nami will remind you if you start falling behind! 💪',
          ].join('\n'),
        },
        {
          name: '💎 Milestone Diamond',
          value: [
            'Kamu akan dapat notifikasi pribadi dari Nami saat mencapai:',
            'You\'ll get a private notification from Nami when you reach:',
            '**10,000 • 30,000 • 50,000 • 100,000 • 200,000 • 500,000 • 1,000,000 💎**',
          ].join('\n'),
        },
        {
          name: '❓ Butuh Bantuan? / Need Help?',
          value: [
            'Hubungi agenmu langsung atau kirim pesan di channel yang sesuai.',
            'Contact your agent directly or message in the appropriate channel.',
          ].join('\n'),
        },
      )
      .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
