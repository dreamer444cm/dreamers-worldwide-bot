require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID,
  autoRoleId: process.env.AUTO_ROLE_ID,
  language: process.env.LANGUAGE || 'en', // 'en' for English, 'id' for Indonesian
};
