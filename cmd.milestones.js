const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getCloseToMilestone, formatNumber } = require('./nami-diamonds.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('milestones')
    .setDescription("See who's close to their next milestone / Lihat siapa yang mendekati milestone")
    .addIntegerOption(opt =>
      opt.setName('within').setDescription('Show creators within this % of their next milestone (default 20)').setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const within = interaction.options.getInteger('within') ?? 20;
    const results = getCloseToMilestone(within);

    if (!results.length) {
      return interaction.reply({
        content: `No creators are within ${within}% of their next milestone right now.\n🇮🇩 Tidak ada creator yang mendekati milestone berikutnya saat ini.`,
        ephemeral: true,
      });
    }

    const lines = results.map((r, i) =>
      `**${i + 1}. ${r.name}** — ${formatNumber(r.total)} 💎 → next: ${formatNumber(r.next)} 💎 (${formatNumber(r.remaining)} to go, ${r.percentRemaining}% left)`
    );

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(`🔥 Close to a Milestone (within ${within}%)`)
      .setDescription(lines.join('\n'))
      .setFooter({ text: 'Dreamers Worldwide Bot 🌐' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
