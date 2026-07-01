const { SlashCommandBuilder } = require('discord.js');
const { t } = require('./lang.js');
const { language } = require('./config.js');

module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Stop music / Hentikan musik'),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guild);
    if (!queue) return interaction.reply({ content: t('music_nothing_playing', language), ephemeral: true });
    await queue.stop();
    await interaction.reply(t('music_stopped', language));
  },
};
