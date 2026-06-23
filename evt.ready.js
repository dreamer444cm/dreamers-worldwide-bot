const { REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as / Masuk sebagai: ${client.user.tag}`);
    client.user.setActivity('Dream Big. Go Live. Get Paid. 👑', { type: 3 });

    // Auto-register slash commands on startup
    try {
      const commands = [];
      client.commands.forEach(cmd => {
        if (cmd.data) commands.push(cmd.data.toJSON());
      });

      const rest = new REST({ version: '10' }).setToken(token);

      if (clientId && guildId) {
        await rest.put(
          Routes.applicationGuildCommands(clientId, guildId),
          { body: commands }
        );
        console.log(`✅ Registered ${commands.length} slash commands to your server.`);
      } else {
        console.log('⚠️ CLIENT_ID or GUILD_ID missing — slash commands not registered.');
      }
    } catch (err) {
      console.error('Slash command registration failed:', err);
    }
  },
};
