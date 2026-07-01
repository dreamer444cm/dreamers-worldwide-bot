const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkin, getCreator, checkRequirementsMet, getStats } = require('./nami-creators.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkin')
    .setDescription('Log that you are going LIVE / Catat bahwa kamu sedang LIVE'),

  async execute(interaction, client) {
    const result = checkin(interaction.user.id);

    if (result.error === 'not_linked') {
      return interaction.reply({
        content: '❌ You\'re not linked yet! Run `/linkcreator` first.\n🇮🇩 Kamu belum terhubung! Jalankan `/linkcreator` dulu.',
        ephemeral: true,
      });
    }

    if (result.error === 'already_checked_in') {
      const since = new Date(result.since);
      return interaction.reply({
        content: `❌ You're already checked in (since <t:${Math.floor(result.since / 1000)}:R>). Use \`/checkout\` when you finish.\n🇮🇩 Kamu sudah check-in (sejak <t:${Math.floor(result.since / 1000)}:R>). Gunakan \`/checkout\` saat selesai.`,
        ephemeral: true,
      });
    }

    const stats = getStats(interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0xff2d9b)
      .setTitle('🔴 You\'re LIVE! / Kamu LIVE!')
      .setDescription(
        `Go get it, **${result.creator.name}**! Use \`/checkout\` when you finish your stream. 💪\n\n` +
        `🇮🇩 Semangat, **${result.creator.name}**! Gunakan \`/checkout\` saat selesai stream. 💪`
      )
      .addFields(
        { name: 'Days This Month / Hari Bulan Ini', value: `${stats.days} / ${12}`, inline: true },
        { name: 'Hours / Jam', value: `${stats.hours} / ${35}`, inline: true },
      )
      .setFooter({ text: 'Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
