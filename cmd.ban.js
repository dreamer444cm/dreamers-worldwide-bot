const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { t, COLORS } = require('./lang.js');
const { language } = require('./config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member / Blokir member')
    .addUserOption(opt =>
      opt.setName('target').setDescription('Member to ban / Member yang diblokir').setRequired(true))
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason / Alasan'))
    .addIntegerOption(opt =>
      opt.setName('days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') ?? t('mod_no_reason', language);
    const days = interaction.options.getInteger('days') ?? 0;

    if (!target) return interaction.reply({ content: t('member_not_found', language), ephemeral: true });
    if (!target.bannable) return interaction.reply({ content: t('cannot_ban', language), ephemeral: true });

    await target.ban({ deleteMessageDays: days, reason });

    const embed = new EmbedBuilder()
      .setColor(COLORS.red)
      .setTitle(t('ban_title', language))
      .addFields(
        { name: t('mod_user', language), value: `${target.user.tag}`, inline: true },
        { name: t('mod_moderator', language), value: `${interaction.user.tag}`, inline: true },
        { name: t('mod_reason', language), value: reason },
        { name: t('mod_messages_deleted', language), value: t('mod_days', language, days), inline: true }
      )
      .setFooter({ text: 'Dreamers Worldwide Bot 🌐' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
