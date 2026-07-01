const { SlashCommandBuilder } = require('discord.js');
const { t } = require('./lang.js');
const { language } = require('./config.js');

module.exports = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause music / Jeda musik'),
  async execute(interaction, client) {
    const q = client.distube.getQueue(interaction.guild);
    if (!q) return interaction.reply({ content: t('music_nothing_playing', language), ephemeral: true });
    q.pause();
    await interaction.reply(t('music_paused', language));
  },
};
