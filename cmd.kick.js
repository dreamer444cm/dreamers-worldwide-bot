const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { t, COLORS } = require('./lang.js');
const { language } = require('./config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member / Keluarkan member')
    .addUserOption(opt =>
      opt.setName('target').setDescription('Member to kick / Member yang dikeluarkan').setRequired(true))
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason / Alasan'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') ?? t('mod_no_reason', language);

    if (!target) return interaction.reply({ content: t('member_not_found', language), ephemeral: true });
    if (!target.kickable) return interaction.reply({ content: t('cannot_kick', language), ephemeral: true });

    await target.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(COLORS.gold)
      .setTitle(t('kick_title', language))
      .addFields(
        { name: t('mod_user', language), value: `${target.user.tag}`, inline: true },
        { name: t('mod_moderator', language), value: `${interaction.user.tag}`, inline: true },
        { name: t('mod_reason', language), value: reason }
      )
      .setFooter({ text: 'Dreamers Worldwide Bot 🌐' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
