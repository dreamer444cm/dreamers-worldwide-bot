const { EmbedBuilder } = require('discord.js');
const { welcomeChannelId, autoRoleId, language } = require('./config.js');
const { t, COLORS } = require('./lang.js');

const introChannelId = '1518941229818183781';

// ── Helper: extract TikTok handle from free text ─────────────
function extractTikTok(text) {
  const match = text.match(/@[\w.]+/);
  return match ? match[0] : null;
}

// ── Helper: extract name (first numbered item in intro) ───────
function extractName(text) {
  // Looks for patterns like "1. Maya" or "Nama: Maya" or just first word after greeting
  const patterns = [
    /(?:^|\n)\s*1[.)]\s*\*{0,2}([^*\n@]{2,30})\*{0,2}/m,
    /(?:nama|name)\s*[:\-]\s*([^\n@]{2,30})/im,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {

    // ── Auto Role ─────────────────────────────────────────────
    if (autoRoleId) {
      const role = member.guild.roles.cache.get(autoRoleId);
      if (role) await member.roles.add(role).catch(console.error);
    }

    // ── 1) Welcome channel ────────────────────────────────────
    if (welcomeChannelId) {
      const channel = member.guild.channels.cache.get(welcomeChannelId);
      if (channel) {
        const welcomeEmbed = new EmbedBuilder()
          .setColor(COLORS.pink)
          .setTitle(t('welcome_title', language))
          .setDescription(t('welcome_desc', language, member, member.guild.name))
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: t('welcome_member_count', language), value: t('welcome_member_number', language, member.guild.memberCount), inline: true },
            { name: t('welcome_account_created', language), value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
          )
          .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' })
          .setTimestamp();
        await channel.send({ embeds: [welcomeEmbed] }).catch(e => console.error('[welcome]', e.message));
      }
    }

    // ── 2) Intro channel prompt ───────────────────────────────
    const introChannel = member.guild.channels.cache.get(introChannelId);
    if (introChannel) {
      const introEmbed = new EmbedBuilder()
        .setColor(COLORS.cyan)
        .setTitle(t('intro_title', language))
        .setDescription(t('intro_desc', language))
        .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' });
      await introChannel.send({ content: t('intro_ping', language, member), embeds: [introEmbed] })
        .catch(e => console.error('[intro]', e.message));
    }

    // ── 3) Watch intro channel for their reply (auto-link) ────
    // Listen for their message in the intro channel for 6 hours
    const filter = m => m.author.id === member.id && m.channel.id === introChannelId;
    const collector = introChannel?.createMessageCollector({ filter, max: 1, time: 6 * 3600000 });

    if (collector) {
      collector.on('collect', async (msg) => {
        try {
          // Try to load nami-creators if available
          const fs = require('fs');
          const path = require('path');
          if (!fs.existsSync(path.join(__dirname, 'nami-creators.js'))) return;
          const { linkCreator, getCreator } = require('./nami-creators.js');

          if (getCreator(member.id)) return; // already linked

          const tiktok = extractTikTok(msg.content);
          const name = extractName(msg.content) || member.displayName;

          if (tiktok) {
            linkCreator(member.id, name, tiktok);
            // DM them confirmation
            const confirmEmbed = new EmbedBuilder()
              .setColor(COLORS.pink)
              .setTitle('✅ Kamu sudah terdaftar! / You\'re all set up!')
              .setDescription(
                `Hei **${name}**! Nami sudah mencatat kamu dalam sistem Dreamers Worldwide. Gunakan \`/mystats\` kapan saja untuk cek progresmu! 🌟\n\n` +
                `Hey **${name}**! Nami has registered you in the Dreamers Worldwide system. Use \`/mystats\` anytime to check your progress! 🌟`
              )
              .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' });
            await member.send({ embeds: [confirmEmbed] }).catch(() => {});
          }
        } catch (e) { console.error('[auto-link]', e.message); }
      });
    }

    // ── 4) 1-hour nudge DM if not yet in intro ───────────────
    setTimeout(async () => {
      try {
        const fs = require('fs');
        const path = require('path');
        if (!fs.existsSync(path.join(__dirname, 'nami-creators.js'))) return;
        const { getCreator } = require('./nami-creators.js');
        if (getCreator(member.id)) return; // already linked, skip

        // Check if they posted in intro
        const msgs = await introChannel?.messages.fetch({ limit: 50 }).catch(() => null);
        const posted = msgs?.some(m => m.author.id === member.id);
        if (posted) return;

        const nudgeEmbed = new EmbedBuilder()
          .setColor(COLORS.cyan)
          .setTitle('👋 Hei Dreamer!')
          .setDescription(
            `Jangan lupa perkenalkan dirimu di <#${introChannelId}> ya! 🌟\n\nCeritakan:\n1️⃣ **Namamu**\n2️⃣ **Handle TikTok-mu** (@)\n3️⃣ **Apa yang kamu lakukan saat LIVE**\n\n` +
            `Don't forget to introduce yourself in <#${introChannelId}>! 🌟\n\nShare:\n1️⃣ **Your name**\n2️⃣ **Your TikTok handle** (@)\n3️⃣ **What you do on LIVE**`
          )
          .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' });

        await member.send({ embeds: [nudgeEmbed] }).catch(() => {});
      } catch (e) { console.error('[1hr nudge]', e.message); }
    }, 60 * 60 * 1000); // 1 hour

    // ── 5) 48-hour follow-up DM if still not linked ──────────
    setTimeout(async () => {
      try {
        const fs = require('fs');
        const path = require('path');
        if (!fs.existsSync(path.join(__dirname, 'nami-creators.js'))) return;
        const { getCreator, linkCreator } = require('./nami-creators.js');
        if (getCreator(member.id)) return; // already linked, skip

        const followUpEmbed = new EmbedBuilder()
          .setColor(COLORS.gold)
          .setTitle('⏰ Hei! Kami masih menunggumu / Hey! We\'re still waiting for you')
          .setDescription(
            `Hei **${member.displayName}**! Kami belum melihat perkenalanmu. 😊\n\nBalas pesan ini dengan **nama** dan **handle TikTok-mu** (@) dan Nami akan langsung mendaftarkanmu!\n\nAtau kunjungi <#${introChannelId}> dan perkenalkan dirimu di sana.\n\n` +
            `Hey **${member.displayName}**! We haven't seen your introduction yet. 😊\n\nReply to this message with your **name** and **TikTok handle** (@) and Nami will register you right away!\n\nOr visit <#${introChannelId}> and introduce yourself there.`
          )
          .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' });

        const dmMsg = await member.send({ embeds: [followUpEmbed] }).catch(() => null);
        if (!dmMsg) return;

        // Listen for their DM reply
        const dmFilter = m => m.author.id === member.id;
        const dmCollector = dmMsg.channel.createMessageCollector({ filter: dmFilter, max: 1, time: 48 * 3600000 });

        dmCollector.on('collect', async (reply) => {
          const tiktok = extractTikTok(reply.content);
          const name = extractName(reply.content) || member.displayName;

          if (!tiktok) {
            await reply.reply(
              'Nami tidak menemukan handle TikTok-mu. Pastikan ada tanda @ ya! (contoh: @namahandle)\n\nNami couldn\'t find your TikTok handle. Make sure to include the @ symbol! (example: @yourhandle)'
            ).catch(() => {});
            return;
          }

          linkCreator(member.id, name, tiktok);

          const doneEmbed = new EmbedBuilder()
            .setColor(COLORS.pink)
            .setTitle('✅ Terdaftar! / Registered!')
            .setDescription(
              `Yeay **${name}**! Kamu sudah terdaftar di sistem Dreamers Worldwide. Gunakan \`/mystats\` untuk cek progresmu! 🌟\n\n` +
              `Yay **${name}**! You're now registered in the Dreamers Worldwide system. Use \`/mystats\` to check your progress! 🌟`
            )
            .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' });

          await reply.reply({ embeds: [doneEmbed] }).catch(() => {});
        });

      } catch (e) { console.error('[48hr followup]', e.message); }
    }, 48 * 60 * 60 * 1000); // 48 hours
  },
};
