const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { t, COLORS } = require('./lang.js');
const { language } = require('./config.js');

module.exports = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Show music queue / Tampilkan antrian musik'),
  async execute(interaction, client) {
    const q = client.distube.getQueue(interaction.guild);
    if (!q) return interaction.reply({ content: t('music_queue_empty', language), ephemeral: true });

    const tracks = q.songs.slice(0, 10).map((s, i) =>
      `**${i === 0 ? '▶️' : i + '.'}** [${s.name}](${s.url}) — \`${s.formattedDuration}\``
    ).join('\n');

    const embed = new EmbedBuilder()
      .setColor(COLORS.cyan)
      .setTitle(t('music_queue_title', language))
      .setDescription(tracks)
      .setFooter({ text: `Dreamers Worldwide 🌐 | ${t('music_queue_footer', language, q.songs.length, q.volume)}` });

    await interaction.reply({ embeds: [embed] });
  },
};
