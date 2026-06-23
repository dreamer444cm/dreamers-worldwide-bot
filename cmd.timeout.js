const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { t, COLORS } = require('./lang.js');
const { language } = require('./config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member / Bungkam member')
    .addUserOption(opt =>
      opt.setName('target').setDescription('Member to timeout / Member yang dibungkam').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('minutes').setDescription('Duration in minutes / Durasi dalam menit').setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason / Alasan'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('target');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') ?? t('mod_no_reason', language);

    if (!target) return interaction.reply({ content: t('member_not_found', language), ephemeral: true });
    if (!target.moderatable) return interaction.reply({ content: t('cannot_timeout', language), ephemeral: true });

    await target.timeout(minutes * 60 * 1000, reason);

    const embed = new EmbedBuilder()
      .setColor(COLORS.pink)
      .setTitle(t('timeout_title', language))
      .addFields(
        { name: t('mod_user', language), value: `${target.user.tag}`, inline: true },
        { name: t('mod_moderator', language), value: `${interaction.user.tag}`, inline: true },
        { name: t('mod_duration', language), value: t('mod_minutes', language, minutes), inline: true },
        { name: t('mod_reason', language), value: reason }
      )
      .setFooter({ text: 'Dreamers Worldwide Bot 🌐' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
