const { Telegraf, Markup } = require('telegraf');

const token = process.env.BOT_TOKEN;

// ✅ UPDATED DETAILS
const ADMIN_ID = 5265106993; 
const CHANNEL_LINK = "https://t.me/navyaastra"; 

const bot = new Telegraf(token || 'TOKEN_MISSING');

// --- DATABASE (Temporary Memory) ---
// Note: In Vercel (Serverless), this resets on redeploy. 
// For permanent storage, we usually need a database like MongoDB.
let userList = new Set(); 
let waitlist = new Set(); 

// --- MIDDLEWARE ---
bot.use((ctx, next) => {
    if (ctx.from) userList.add(ctx.from.id);
    return next();
});

// --- ADMIN COMMANDS ---

// 1. BROADCAST (To send updates to everyone)
bot.command('broadcast', async (ctx) => {
    if (ctx.from.id != ADMIN_ID) return ctx.reply("❌ Access Denied.");
    
    const message = ctx.message.text.split(' ').slice(1).join(' ');
    if (!message) return ctx.reply("⚠️ Format: `/broadcast We are launching soon!`");
    
    let count = 0;
    ctx.reply(`📢 Sending Updates to ${userList.size} users...`);
    
    for (const userId of userList) {
        try {
            await bot.telegram.sendMessage(userId, `📢 *Navya Astra Update:*\n\n${message}`, { parse_mode: 'Markdown' });
            count++;
        } catch (error) {}
    }
    ctx.reply(`✅ Update Sent to ${count} users.`);
});

// 2. REPLY (To reply to a specific user)
bot.command('reply', (ctx) => {
    if (ctx.from.id != ADMIN_ID) return;
    
    const parts = ctx.message.text.split(' ');
    if (parts.length < 3) return ctx.reply("⚠️ Format: `/reply UserID Message`");
    
    const userId = parts[1];
    const msg = parts.slice(2).join(' ');
    
    bot.telegram.sendMessage(userId, `👨‍💻 *Message from Founder:*\n\n${msg}`, { parse_mode: 'Markdown' })
        .then(() => ctx.reply("✅ Sent!"))
        .catch(() => ctx.reply("❌ Failed. ID might be wrong."));
});

// --- MAIN MENU ---
const showMainMenu = (ctx) => {
    const welcomeText = `🚀 *Welcome to Navya Astra Development*\n\nWe are building the Future.\n\nWe are developing Next-Gen **Social Media Platforms** & **Utility Apps**.\n\n⚠️ Status: *Currently in Development (Processing)*\n\n👇 Explore our Vision:`;
    
    const mainKeyboard = Markup.inlineKeyboard([
        // Row 1: Vision & Projects
        [Markup.button.callback('🌐 Our Upcoming Projects', 'menu_projects'), Markup.button.callback('🗺️ Roadmap / Progress', 'menu_roadmap')],
        // Row 2: Waitlist & Community
        [Markup.button.callback('⏳ Join Waitlist (Early Access)', 'btn_waitlist'), Markup.button.callback('📢 Join Community', 'btn_community')],
        // Row 3: Collaboration & Contact
        [Markup.button.callback('🤝 Partner / Invest', 'menu_partner'), Markup.button.callback('🗣️ Talk to Founder', 'menu_contact')]
    ]);

    if (ctx.callbackQuery) {
        ctx.editMessageText(welcomeText, { parse_mode: 'Markdown', ...mainKeyboard }).catch(e=>{});
    } else {
        ctx.replyWithMarkdown(welcomeText, mainKeyboard).catch(e=>{});
    }
};

bot.start((ctx) => showMainMenu(ctx));

// --- SECTIONS ---

// 1. PROJECTS SHOWCASE
bot.action('menu_projects', (ctx) => {
    ctx.editMessageText(`🌐 *Navya Astra Projects (In Pipeline)*\n\n1️⃣ **Project "SocialX" (Name TBD)**\nℹ️ *Concept:* A decentralized social platform focused on privacy and real connections.\n🛠 *Status:* 40% Completed (Backend Development).\n\n2️⃣ **Project "Fan-Utility"**\nℹ️ *Concept:* Tools for Creators to manage fanbase and monetization.\n🛠 *Status:* Planning Phase.\n\n👇 Click 'Join Waitlist' to be the first to test!`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('⏳ Join Beta Waitlist', 'btn_waitlist')],
            [Markup.button.callback('🔙 Back', 'btn_back')]
        ])
    });
});

// 2. ROADMAP (Progress)
bot.action('menu_roadmap', (ctx) => {
    ctx.editMessageText(`🗺️ *Development Roadmap 2026*\n\n✅ **Q1 (Jan-Mar):** Core Architecture Design.\n🔄 **Q2 (Apr-Jun):** Alpha Testing (Internal Team).\n🔜 **Q3 (Jul-Sep):** Public Beta Launch (Waitlist Users).\n🔜 **Q4 (Oct-Dec):** Global Launch 🚀\n\nWe are currently in *Phase 1*.`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Back', 'btn_back')]])
    });
});

// 3. WAITLIST SYSTEM
bot.action('btn_waitlist', (ctx) => {
    const user = ctx.from;
    
    if (waitlist.has(user.id)) {
        return ctx.reply("✅ You are already on the list! We will notify you at launch.");
    }
    
    waitlist.add(user.id);
    
    // Notify Admin
    bot.telegram.sendMessage(ADMIN_ID, `🎉 *New Waitlist Sign-up!*\n👤 ${user.first_name} (@${user.username})\n🆔 \`${user.id}\``, { parse_mode: 'Markdown' });
    
    ctx.replyWithMarkdown(`🎉 *Congratulations!*\n\nYou have been added to the **Navya Astra Exclusive Waitlist**.\nYou will get **Early Access** to our Social Media App before anyone else! 🚀`);
});

// 4. PARTNER / INVEST
bot.action('menu_partner', (ctx) => {
    ctx.editMessageText(`🤝 *Collaboration*\n\nNavya Astra is open for:\n- **Developers:** React/Node.js experts.\n- **Investors:** Seed funding opportunities.\n\nIf you want to contribute, please contact the Founder.`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🗣️ Contact Founder', 'menu_contact')],
            [Markup.button.callback('🔙 Back', 'btn_back')]
        ])
    });
});

// 5. CONTACT & COMMUNITY
bot.action('menu_contact', (ctx) => {
    ctx.reply("📞 **Founder Contact:**\n\nDirect Message: @Raj_Tiwari_Official\nEmail: contact@navyaastra.com\n\n(Projects are in processing, please be patient!)");
});

bot.action('btn_community', (ctx) => {
    ctx.reply(`📢 *Join Official Channel:*\n\nGet latest updates here:\n${CHANNEL_LINK}`);
});

bot.action('btn_back', (ctx) => showMainMenu(ctx));

// --- SERVER SETUP ---
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } else {
            res.status(200).send('Navya Astra Development Bot 🟢');
        }
    } catch (e) {
        res.status(500).send('Error');
    }
};
