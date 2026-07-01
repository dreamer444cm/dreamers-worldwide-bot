require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { token, clientId, guildId } = require('./config.js');
const { setupNami } = require('./nami-reminders');
const { setupDiamonds } = require('./nami-diamonds');
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

// DisTube music engine
client.distube = new DisTube(client, {
  plugins: [new YtDlpPlugin()],
});

client.commands = new Collection();

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js'));

// Load commands: files named cmd.*.js
const commandData = [];
for (const file of files.filter(f => f.startsWith('cmd.'))) {
  const command = require(path.join(__dirname, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    commandData.push(command.data.toJSON());
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

// DisTube events
client.distube
  .on('playSong', (queue, song) => {
    queue.textChannel?.send(`▶️ Now playing / Memutar: **${song.name}** — \`${song.formattedDuration}\``);
  })
  .on('addSong', (queue, song) => {
    queue.textChannel?.send(`➕ Added to queue / Ditambahkan: **${song.name}**`);
  })
  .on('error', (channel, error) => {
    channel?.send(`❌ Music error: ${error.message}`);
    console.error('[DisTube]', error);
  });

// Auto-register slash commands on every startup
async function registerCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(token);
    console.log(`[Nami] Registering ${commandData.length} slash commands...`);
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commandData }
    );
    console.log('[Nami] ✅ Slash commands registered successfully!');
  } catch (error) {
    console.error('[Nami] ❌ Failed to register slash commands:', error);
  }
}

setupNami(client);
setupDiamonds(client);

registerCommands().then(() => {
  client.login(token);
});
