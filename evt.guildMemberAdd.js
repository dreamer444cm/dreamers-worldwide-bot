const { EmbedBuilder } = require('discord.js');
const { welcomeChannelId, autoRoleId, language } = require('./config.js');
const { t, COLORS } = require('./lang.js');

const introChannelId = '1518941229818183781';

// ── Helper: extract TikTok handle from free text ─────────────
function extractTikTok(text) {
  const match = text.match(/@[\w.]+/);
  return match ? match[0] : null;
}

// ── Helper: extract name from intro text ─────────────────────
function extractName(text) {
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

// ── Creator Guide Embed ───────────────────────────────────────
function creatorGuideEmbed(COLORS) {
  return new EmbedBuilder()
    .setColor(COLORS.pink)
    .setTitle('🌟 Panduan Nami untuk Creator / Nami Creator Guide')
    .setDescription(
      '*Semua pesan dari Nami bersifat pribadi — hanya kamu yang bisa melihatnya! 🔒*\n' +
      '*All Nami responses are private — only you can see them! 🔒*'
    )
    .addFields(
      {
        name: '🔗 Daftar Dulu / Register First',
        value: '`/linkcreator` — Hubungkan akun Discord-mu ke profil creator\n*(Wajib sekali sebelum pakai perintah lain / Must do once first)*',
      },
      {
        name: '🔴 Saat LIVE / When Going LIVE',
        value: '`/checkin` — Catat mulai LIVE / Log going live\n`/checkout` — Catat selesai LIVE / Log ending stream',
      },
      {
        name: '📊 Cek Progresmu / Check Your Progress',
        value: '`/mystats` — Lihat hari, jam, diamond & status persyaratanmu\n*(See your days, hours, diamonds & requirement status)*',
      },
      {
        name: '🏆 Persyaratan Bulanan / Monthly Requirements',
        value: '✅ **12 hari / days** LIVE per bulan / month\n✅ **35 jam / hours** LIVE per bulan / month\n\nNami akan mengingatkanmu jika tertinggal! / Nami will remind you if you fall behind! 💪',
      },
      {
        name: '💎 Diamond Milestones',
        value: 'Notifikasi pribadi saat mencapai / Private notification when you reach:\n**10K • 30K • 50K • 100K • 200K • 500K • 1M 💎**',
      },
    )
    .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' })
    .setTimestamp();
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

    // ── 3) Instant DM — welcome + creator guide ───────────────
    try {
      const welcomeDm = new EmbedBuilder()
        .setColor(COLORS.pink)
        .setTitle(`👋 Selamat datang di Dreamers Worldwide, ${member.displayName}!`)
        .setDescription(
          `Hei! Nami di sini — asisten digital Dreamers Worldwide. 🌟\n\nUntuk memulai, perkenalkan dirimu di <#${introChannelId}> ya!\n\n` +
          `Hey! I'm Nami — Dreamers Worldwide's digital assistant. 🌟\n\nTo get started, introduce yourself in <#${introChannelId}>!`
        )
        .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' });

      await member.send({ embeds: [welcomeDm] });
      await member.send({ embeds: [creatorGuideEmbed(COLORS)] });
    } catch (e) {
      console.warn('[DM guide] Could not DM new member:', e.message);
    }

    // ── 4) Watch intro channel for their reply (auto-link) ────
    const filter = m => m.author.id === member.id && m.channel.id === introChannelId;
    const collector = introChannel?.createMessageCollector({ filter, max: 1, time: 6 * 3600000 });

    if (collector) {
      collector.on('collect', async (msg) => {
        try {
          const fs = require('fs');
          const path = require('path');
          if (!fs.existsSync(path.join(__dirname, 'nami-creators.js'))) return;
          const { linkCreator, getCreator } = require('./nami-creators.js');
          if (getCreator(member.id)) return;

          const tiktok = extractTikTok(msg.content);
          const name = extractName(msg.content) || member.displayName;

          if (tiktok) {
            linkCreator(member.id, name, tiktok);
            const confirmEmbed = new EmbedBuilder()
              .setColor(COLORS.pink)
              .setTitle('✅ Kamu sudah terdaftar! / You\'re all set up!')
              .setDescription(
                `Hei **${name}**! Nami sudah mencatat kamu dalam sistem. Gunakan \`/mystats\` kapan saja untuk cek progresmu! 🌟\n\n` +
                `Hey **${name}**! You're now registered. Use \`/mystats\` anytime to check your progress! 🌟`
              )
              .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' });
            await member.send({ embeds: [confirmEmbed] }).catch(() => {});
          }
        } catch (e) { console.error('[auto-link]', e.message); }
      });
    }

    // ── 5) 1-hour nudge if not yet in intro ──────────────────
    setTimeout(async () => {
      try {
        const fs = require('fs');
        const path = require('path');
        if (!fs.existsSync(path.join(__dirname, 'nami-creators.js'))) return;
        const { getCreator } = require('./nami-creators.js');
        if (getCreator(member.id)) return;

        const msgs = await introChannel?.messages.fetch({ limit: 50 }).catch(() => null);
        const posted = msgs?.some(m => m.author.id === member.id);
        if (posted) return;

        const nudgeEmbed = new EmbedBuilder()
          .setColor(COLORS.cyan)
          .setTitle('👋 Hei! Jangan lupa perkenalkan dirimu!')
          .setDescription(
            `Kami masih menunggumu di <#${introChannelId}>! 🌟\n\nCeritakan:\n1️⃣ **Namamu**\n2️⃣ **Handle TikTok-mu** (@)\n3️⃣ **Apa yang kamu lakukan saat LIVE**\n\n` +
            `We're still waiting for you in <#${introChannelId}>! 🌟\n\nShare:\n1️⃣ **Your name**\n2️⃣ **Your TikTok handle** (@)\n3️⃣ **What you do on LIVE**`
          )
          .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' });

        await member.send({ embeds: [nudgeEmbed] }).catch(() => {});
      } catch (e) { console.error('[1hr nudge]', e.message); }
    }, 60 * 60 * 1000);

    // ── 6) 48-hour follow-up if still not linked ─────────────
    setTimeout(async () => {
      try {
        const fs = require('fs');
        const path = require('path');
        if (!fs.existsSync(path.join(__dirname, 'nami-creators.js'))) return;
        const { getCreator, linkCreator } = require('./nami-creators.js');
        if (getCreator(member.id)) return;

        const followUpEmbed = new EmbedBuilder()
          .setColor(COLORS.gold)
          .setTitle('⏰ Hei! Kami masih menunggumu / Hey! We\'re still waiting')
          .setDescription(
            `Hei **${member.displayName}**! Kami belum melihat perkenalanmu. 😊\n\nBalas pesan ini dengan **nama** dan **handle TikTok-mu** (@) dan Nami akan langsung mendaftarkanmu!\n\nAtau kunjungi <#${introChannelId}> dan perkenalkan dirimu di sana.\n\n` +
            `Hey **${member.displayName}**! We haven't seen your introduction yet. 😊\n\nReply with your **name** and **TikTok handle** (@) and Nami will register you right away!\n\nOr visit <#${introChannelId}> and introduce yourself there.`
          )
          .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' });

        const dmMsg = await member.send({ embeds: [followUpEmbed] }).catch(() => null);
        if (!dmMsg) return;

        const dmFilter = m => m.author.id === member.id;
        const dmCollector = dmMsg.channel.createMessageCollector({ filter: dmFilter, max: 1, time: 48 * 3600000 });

        dmCollector.on('collect', async (reply) => {
          const tiktok = extractTikTok(reply.content);
          const name = extractName(reply.content) || member.displayName;

          if (!tiktok) {
            await reply.reply(
              'Nami tidak menemukan handle TikTok-mu. Pastikan ada tanda @ ya! (contoh: @namahandle)\n\nNami couldn\'t find your TikTok handle. Make sure to include @ ! (example: @yourhandle)'
            ).catch(() => {});
            return;
          }

          linkCreator(member.id, name, tiktok);

          const doneEmbed = new EmbedBuilder()
            .setColor(COLORS.pink)
            .setTitle('✅ Terdaftar! / Registered!')
            .setDescription(
              `Yeay **${name}**! Kamu sudah terdaftar di sistem Dreamers Worldwide. Gunakan \`/mystats\` untuk cek progresmu! 🌟\n\n` +
              `Yay **${name}**! You're now registered. Use \`/mystats\` to check your progress! 🌟`
            )
            .setFooter({ text: '👑 Dream Big. Go Live. Get Paid. | Dreamers Worldwide 🌐' });

          await reply.reply({ embeds: [doneEmbed] }).catch(() => {});
        });

      } catch (e) { console.error('[48hr followup]', e.message); }
    }, 48 * 60 * 60 * 1000);
  },
};
