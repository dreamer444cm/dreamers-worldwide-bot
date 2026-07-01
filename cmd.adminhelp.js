const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { COLORS } = require('./lang.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adminhelp')
    .setDescription('Post the admin command reference embed')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.gold)
      .setTitle('👑 Nami — Admin Command Reference')
      .setDescription('*All commands below are admin-only. Responses are private unless noted.*')
      .addFields(
        {
          name: '💎 Diamond Tracking',
          value: [
            '`/logdiamonds creator: amount:` — Log a creator\'s diamonds for the month',
            '`/diamonds creator:` — Check any creator\'s diamond progress & next milestone',
            '`/milestones` — See all creators close to their next diamond tier',
          ].join('\n'),
        },
        {
          name: '👥 Creator Management',
          value: [
            '`/linkcreator name: tiktok: user:` — Link a creator\'s Discord to their profile',
            '`/unlinkcreator user:` — Remove a creator from the system (admin only)',
          ].join('\n'),
        },
        {
          name: '🛡️ Moderation',
          value: [
            '`/kick target: reason:` — Kick a member from the server',
            '`/ban target: reason: days:` — Ban a member (optionally delete messages)',
            '`/timeout target: minutes: reason:` — Mute a member temporarily',
          ].join('\n'),
        },
        {
          name: '📋 Recruiter Tracking *(coming soon)*',
          value: [
            '`/linkrecruiter` — Link a recruiter profile',
            '`/unlinkrecruiter` — Remove a recruiter',
            '`/logref recruiter: creator:` — Log a new referral',
            '`/ineligible name: reason:` — Flag an ineligible account',
            '`/recruiterboard` — View top recruiters leaderboard',
          ].join('\n'),
        },
        {
          name: '⚙️ General',
          value: [
            '`/ping` — Check bot and API latency',
            '`/adminhelp` — Post this embed',
            '`/creatorhelp` — Post the creator command reference',
          ].join('\n'),
        },
        {
          name: '🤖 Automatic (no command needed)',
          value: [
            '• Daily at-risk DMs to creators falling behind on days',
            '• Weekly report every Friday 8 AM Eastern (your locked channel)',
            '• Requirements alert when creator hits 12 days + 35 hours',
            '• Milestone celebration when creator crosses a diamond tier',
            '• Auto-link creators from intro channel or DM follow-up',
            '• 1-hour + 48-hour DM nudges to new members who haven\'t introduced',
          ].join('\n'),
        },
      )
      .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
