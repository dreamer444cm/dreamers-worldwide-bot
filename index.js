require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { token } = require('./config.js');
const { setupNami } = require('./nami-reminders');   // ← Nami reminders & alerts
const { setupDiamonds } = require('./nami-diamonds'); // ← Diamond & milestone tracker
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js'));

// Load commands: files named cmd.*.js
for (const file of files.filter(f => f.startsWith('cmd.'))) {
  const command = require(path.join(__dirname, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

// Load events: files named evt.*.js
for (const file of files.filter(f => f.startsWith('evt.'))) {
  const event = require(path.join(__dirname, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Switch on Nami's reminders & creator alerts
setupNami(client);

// Switch on the diamond & milestone tracker
setupDiamonds(client);

client.login(token);
