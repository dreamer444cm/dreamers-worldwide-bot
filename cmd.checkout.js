const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkout, getCreator, checkRequirementsMet } = require('./nami-creators.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkout')
    .setDescription('End your LIVE session / Akhiri sesi LIVE-mu'),

  async execute(interaction, client) {
    const result = checkout(interaction.user.id);

    if (result.error === 'not_linked') {
      return interaction.reply({
        content: '❌ You\'re not linked yet! Run `/linkcreator` first.\n🇮🇩 Kamu belum terhubung! Jalankan `/linkcreator` dulu.',
        ephemeral: true,
      });
    }

    if (result.error === 'not_checked_in') {
      return interaction.reply({
        content: '❌ You haven\'t checked in yet! Use `/checkin` when you go LIVE.\n🇮🇩 Kamu belum check-in! Gunakan `/checkin` saat mulai LIVE.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x00e5ff)
      .setTitle('✅ Session Ended! / Sesi Selesai!')
      .setDescription(
        `Great session, **${result.creator.name}**! 🎉\n\n` +
        `🇮🇩 Sesi yang bagus, **${result.creator.name}**! 🎉`
      )
      .addFields(
        { name: 'Session Duration / Durasi Sesi', value: `${result.hours} hour(s) / jam`, inline: true },
        { name: 'Total Days / Total Hari', value: `${result.month.days.length} / 12`, inline: true },
        { name: 'Total Hours / Total Jam', value: `${result.month.totalHours} / 35`, inline: true },
      )
      .setFooter({ text: 'Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    // Check if requirements are now met
    await checkRequirementsMet(client, result.creator, result.month);
  },
};
