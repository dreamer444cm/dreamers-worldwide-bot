require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
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

client.commands = new Collection();

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js'));

// Music commands require DisTube — skip until music is enabled
const musicCommands = ['cmd.play.js','cmd.skip.js','cmd.stop.js','cmd.pause.js','cmd.resume.js','cmd.queue.js'];

// Auto-load all cmd.*.js files (except music for now)
const commandData = [];
for (const file of files.filter(f => f.startsWith('cmd.') && !musicCommands.includes(f))) {
  const command = require(path.join(__dirname, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    commandData.push(command.data.toJSON());
  }
}

// Auto-load all evt.*.js files
for (const file of files.filter(f => f.startsWith('evt.'))) {
  const event = require(path.join(__dirname, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

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

// ── Core systems ─────────────────────────────────────────────
setupNami(client);      // Reminders, alerts & handled-tracker
setupDiamonds(client);  // Diamond & milestone tracker

// ── Package 1: Creator self-service ──────────────────────────
// Activates automatically once nami-creators.js is uploaded
if (fs.existsSync(path.join(__dirname, 'nami-creators.js'))) {
  const { setupCreators } = require('./nami-creators');
  setupCreators(client);
  console.log('[Nami] ✅ Creator self-service is live.');
}

// ── Package 2: Recruiter tracking ────────────────────────────
// Activates automatically once nami-recruiters.js is uploaded
if (fs.existsSync(path.join(__dirname, 'nami-recruiters.js'))) {
  const { setupRecruiters } = require('./nami-recruiters');
  setupRecruiters(client);
  console.log('[Nami] ✅ Recruiter tracking is live.');
}

// ── Start ─────────────────────────────────────────────────────
registerCommands().then(() => {
  client.login(token);
});
