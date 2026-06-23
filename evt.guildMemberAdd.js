const { EmbedBuilder } = require('discord.js');
const { welcomeChannelId, autoRoleId, language } = require('./config.js');
const { t, COLORS } = require('./lang.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    // Auto Role
    if (autoRoleId) {
      const role = member.guild.roles.cache.get(autoRoleId);
      if (role) await member.roles.add(role).catch(console.error);
    }

    // Dreamers Worldwide Welcome Message
    if (!welcomeChannelId) return;
    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(COLORS.pink)
      .setTitle(t('welcome_title', language))
      .setDescription(t('welcome_desc', language, member, member.guild.name))
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: t('welcome_member_count', language),
          value: t('welcome_member_number', language, member.guild.memberCount),
          inline: true,
        },
        {
          name: t('welcome_account_created', language),
          value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
          inline: true,
        }
      )
      .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  },
};
