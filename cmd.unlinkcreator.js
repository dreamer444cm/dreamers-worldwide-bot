const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { unlinkCreator, getCreator } = require('./nami-creators.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlinkcreator')
    .setDescription('Hapus profil creator / (Admin only) Unlink a creator profile')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User yang dihapus / User to unlink').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const creator = getCreator(targetUser.id);

    if (!creator) {
      return interaction.reply({
        content: `❌ No creator profile found for <@${targetUser.id}>.\n🇮🇩 Tidak ada profil creator untuk <@${targetUser.id}>.`,
        ephemeral: true,
      });
    }

    unlinkCreator(targetUser.id);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🔓 Creator Unlinked / Creator Dihapus')
      .setDescription(`**${creator.name}** (${creator.tiktok}) has been unlinked from <@${targetUser.id}>.\n🇮🇩 **${creator.name}** (${creator.tiktok}) telah dihapus dari <@${targetUser.id}>.`)
      .setFooter({ text: 'Dreamers Worldwide Bot 🌐' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
