const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logDiamonds, announceMilestone, formatNumber } = require('./nami-diamonds.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logdiamonds')
    .setDescription('Log diamonds earned by a creator this month / Catat diamond creator bulan ini')
    .addStringOption(opt =>
      opt.setName('creator').setDescription('Creator name / Nama creator').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('amount').setDescription('Diamonds to add / Jumlah diamond').setRequired(true).setMinValue(1))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const name = interaction.options.getString('creator');
    const amount = interaction.options.getInteger('amount');

    const { monthData, newlyHit } = logDiamonds(name, amount);

    const embed = new EmbedBuilder()
      .setColor(0xff2d9b)
      .setTitle('💎 Diamonds Logged')
      .addFields(
        { name: 'Creator', value: name, inline: true },
        { name: 'Added', value: `+${formatNumber(amount)} 💎`, inline: true },
        { name: 'Month Total', value: `${formatNumber(monthData.total)} 💎`, inline: true },
      )
      .setFooter({ text: 'Dreamers Worldwide Bot 🌐' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Celebrate any newly crossed milestones
    for (const m of newlyHit) {
      await announceMilestone(client, name, m);
    }
  },
};
