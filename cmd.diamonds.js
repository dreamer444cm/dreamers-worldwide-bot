const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCreatorStatus, formatNumber } = require('./nami-diamonds.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('diamonds')
    .setDescription("Check a creator's diamond progress / Cek progres diamond creator")
    .addStringOption(opt =>
      opt.setName('creator').setDescription('Creator name / Nama creator').setRequired(true)),

  async execute(interaction) {
    const name = interaction.options.getString('creator');
    const status = getCreatorStatus(name);

    if (!status) {
      return interaction.reply({
        content: `❌ No diamonds logged for **${name}** yet this month.\n🇮🇩 Belum ada diamond tercatat untuk **${name}** bulan ini.`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x00e5ff)
      .setTitle(`💎 ${status.name}'s Diamond Progress`)
      .addFields(
        { name: 'This Month', value: `${formatNumber(status.total)} 💎`, inline: true },
        {
          name: 'Next Milestone',
          value: status.next ? `${formatNumber(status.next)} 💎 (${formatNumber(status.next - status.total)} to go)` : '🏆 All milestones reached!',
          inline: true,
        },
        {
          name: 'Milestones Hit',
          value: status.milestonesHit.length ? status.milestonesHit.map(formatNumber).join(', ') : 'None yet',
        }
      )
      .setFooter({ text: 'Dreamers Worldwide Bot 🌐' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
