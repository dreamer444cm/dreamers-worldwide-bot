const { SlashCommandBuilder } = require('discord.js');
const { t } = require('./lang.js');
const { language } = require('./config.js');

module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip current song / Lewati lagu ini'),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guild);
    if (!queue) return interaction.reply({ content: t('music_nothing_playing', language), ephemeral: true });
    await queue.skip();
    await interaction.reply(t('music_skipped', language));
  },
};
