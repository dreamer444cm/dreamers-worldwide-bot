const { EmbedBuilder } = require('discord.js');
const { welcomeChannelId, autoRoleId, language } = require('./config.js');
const { t, COLORS } = require('./lang.js');

// #introduce-yourself channel — change this ID if you ever move the channel
const introChannelId = '1518941229818183781';

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    // Auto Role
    if (autoRoleId) {
      const role = member.guild.roles.cache.get(autoRoleId);
      if (role) await member.roles.add(role).catch(console.error);
    }

    // 1) Welcome channel — short, warm greeting
    if (welcomeChannelId) {
      const channel = member.guild.channels.cache.get(welcomeChannelId);
      if (channel) {
        const welcomeEmbed = new EmbedBuilder()
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

        try {
          await channel.send({ embeds: [welcomeEmbed] });
        } catch (err) {
          console.error('[welcome] Could not send welcome message:', err.message);
        }
      } else {
        console.error('[welcome] Welcome channel not found for ID:', welcomeChannelId);
      }
    }

    // 2) Introduce Yourself channel — tag the new member and ask the 3 questions
    const introChannel = member.guild.channels.cache.get(introChannelId);
    if (introChannel) {
      const introEmbed = new EmbedBuilder()
        .setColor(COLORS.cyan)
        .setTitle(t('intro_title', language))
        .setDescription(t('intro_desc', language))
        .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' });

      try {
        await introChannel.send({ content: t('intro_ping', language, member), embeds: [introEmbed] });
      } catch (err) {
        console.error('[intro] Could not send intro prompt:', err.message);
      }
    } else {
      console.error('[intro] Intro channel not found for ID:', introChannelId);
    }
  },
};

