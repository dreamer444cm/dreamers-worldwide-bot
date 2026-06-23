const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { t, COLORS } = require('./lang.js');
const { language } = require('./config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency / Cek latensi bot'),

  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.cyan)
      .setTitle(t('ping_title', language))
      .setDescription('> *Dream Big. Go Live. Get Paid.* 🌍👑')
      .addFields(
        { name: t('ping_latency', language), value: `${Date.now() - interaction.createdTimestamp}ms`, inline: true },
        { name: t('ping_api', language), value: `${Math.round(client.ws.ping)}ms`, inline: true }
      )
      .setFooter({ text: 'Dreamers Worldwide Bot 🌐' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
