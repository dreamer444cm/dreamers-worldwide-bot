const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { linkCreator, getCreator } = require('./nami-creators.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('linkcreator')
    .setDescription('Link your Discord to your creator profile / Hubungkan Discord ke profil creator')
    .addStringOption(opt =>
      opt.setName('name').setDescription('Your name / Namamu').setRequired(true))
    .addStringOption(opt =>
      opt.setName('tiktok').setDescription('Your TikTok handle / Handle TikTok-mu (@)').setRequired(true))
    .addUserOption(opt =>
      opt.setName('user').setDescription('(Admin only) Link a different user / Hubungkan user lain')),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);

    // Only admins can link other users
    if (targetUser && !isAdmin) {
      return interaction.reply({
        content: '❌ Only admins can link other users. / Hanya admin yang bisa menghubungkan user lain.',
        ephemeral: true,
      });
    }

    const discordId = targetUser ? targetUser.id : interaction.user.id;
    const displayName = targetUser ? targetUser.username : interaction.user.username;
    const name = interaction.options.getString('name');
    const tiktok = interaction.options.getString('tiktok');

    const result = linkCreator(discordId, name, tiktok);

    if (result.already) {
      return interaction.reply({
        content: `❌ This account is already linked as **${result.creator.name}**. Contact an admin to make changes.\n🇮🇩 Akun ini sudah terhubung sebagai **${result.creator.name}**. Hubungi admin untuk perubahan.`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xff2d9b)
      .setTitle('✅ Creator Linked! / Creator Terhubung!')
      .addFields(
        { name: 'Discord', value: `<@${discordId}>`, inline: true },
        { name: 'Name / Nama', value: name, inline: true },
        { name: 'TikTok', value: tiktok, inline: true },
      )
      .setFooter({ text: 'Dreamers Worldwide Bot 🌐' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
