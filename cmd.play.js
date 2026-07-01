const { SlashCommandBuilder } = require('discord.js');
const { t, COLORS } = require('./lang.js');
const { language } = require('./config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song / Putar lagu')
    .addStringOption(opt =>
      opt.setName('query').setDescription('Song name or YouTube URL / Nama lagu atau URL YouTube').setRequired(true)),

  async execute(interaction, client) {
    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: t('music_not_in_voice', language), ephemeral: true });
    }

    await interaction.deferReply();

    try {
      await client.distube.play(voiceChannel, query, {
        member: interaction.member,
        textChannel: interaction.channel,
        interaction,
      });
      await interaction.editReply({ content: t('music_searching', language, query) });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: t('music_error', language, err.message) });
    }
  },
};
