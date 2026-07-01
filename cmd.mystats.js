const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getStats } = require('./nami-creators.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mystats')
    .setDescription('Cek progresmu bulan ini / Check your progress this month'),

  async execute(interaction) {
    const stats = getStats(interaction.user.id);

    if (!stats) {
      return interaction.reply({
        content: '❌ You\'re not linked yet! Run `/linkcreator` first.\n🇮🇩 Kamu belum terhubung! Jalankan `/linkcreator` dulu.',
        ephemeral: true,
      });
    }

    const daysColor = stats.days >= 12 ? '✅' : stats.daysNeeded <= 3 ? '⚠️' : '📅';
    const hoursColor = stats.hours >= 35 ? '✅' : stats.hoursNeeded <= 5 ? '⚠️' : '⏱️';
    const reqStatus = stats.requirementsMet ? '🏆 Requirements met! / Persyaratan terpenuhi!' : `Still needed: ${stats.daysNeeded} day(s) + ${stats.hoursNeeded.toFixed(1)} hr(s)\n🇮🇩 Masih butuh: ${stats.daysNeeded} hari + ${stats.hoursNeeded.toFixed(1)} jam`;

    const embed = new EmbedBuilder()
      .setColor(0xff2d9b)
      .setTitle(`💫 ${stats.name}'s Stats / Statistik ${stats.name}`)
      .setDescription(`TikTok: **${stats.tiktok || 'not set'}**`)
      .addFields(
        { name: `${daysColor} Days Active / Hari Aktif`, value: `${stats.days} / 12`, inline: true },
        { name: `${hoursColor} Hours Logged / Jam Tercatat`, value: `${stats.hours} / 35`, inline: true },
        { name: '📋 Status', value: reqStatus },
      )
      .setFooter({ text: 'Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' })
      .setTimestamp();

    if (stats.activeSession) {
      embed.addFields({ name: '🔴 Currently LIVE', value: `Started <t:${Math.floor(stats.activeSession.checkin / 1000)}:R>` });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
