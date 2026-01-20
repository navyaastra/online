const { Telegraf, Markup } = require('telegraf');

const token = process.env.BOT_TOKEN;
// 🔴 IMP: Apna ID yahan dalein
const ADMIN_ID = 5265106993; 

const bot = new Telegraf(token || 'TOKEN_MISSING');

// --- VARIABLES ---
let userList = new Set();
let qrFileId = null;
let adminState = null;

// --- MIDDLEWARE ---
bot.use((ctx, next) => {
    if (ctx.from) userList.add(ctx.from.id);
    return next();
});

// --- ADMIN COMMANDS ---
bot.command('setqr', (ctx) => {
    if (ctx.from.id != ADMIN_ID) return ctx.reply("❌ Access Denied.");
    adminState = 'WAITING_FOR_QR';
    ctx.reply("📸 Please send your **Payment QR Code** (Photo).");
});

bot.command('broadcast', async (ctx) => {
    if (ctx.from.id != ADMIN_ID) return ctx.reply("❌ Access Denied.");
    const message = ctx.message.text.split(' ').slice(1).join(' ');
    if (!message) return ctx.reply("⚠️ Format: `/broadcast Your Message`");
    
    let count = 0;
    ctx.reply(`📢 Broadcasting...`);
    for (const userId of userList) {
        try {
            await bot.telegram.sendMessage(userId, `📢 *Announcement:*\n\n${message}`, { parse_mode: 'Markdown' });
            count++;
        } catch (error) {}
    }
    ctx.reply(`✅ Sent to ${count} users.`);
});

// --- MAIN MENU ---
const showMainMenu = (ctx) => {
    const welcomeText = `Hello Boss! 🙏\nWelcome to *Navya Astra*.\n\nWe build Software, Apps & AI Solutions for your Business. 🚀\n\nHow can we help you today?`;
    
    const mainKeyboard = Markup.inlineKeyboard([
        // Row 1: Services & Portfolio (Work Samples)
        [Markup.button.callback('🚀 Our Services', 'menu_services'), Markup.button.callback('📂 Our Work / Portfolio', 'menu_portfolio')],
        // Row 2: Quote (Leads) & Payment
        [Markup.button.callback('📝 Start a Project', 'menu_quote'), Markup.button.callback('💰 Pay Now / QR', 'menu_pay')],
        // Row 3: Info & Support
        [Markup.button.callback('⭐ Client Reviews', 'menu_reviews'), Markup.button.callback('📞 Contact Support', 'menu_support')]
    ]);

    if (ctx.callbackQuery) {
        ctx.editMessageText(welcomeText, { parse_mode: 'Markdown', ...mainKeyboard }).catch(e=>console.log(e));
    } else {
        ctx.replyWithMarkdown(welcomeText, mainKeyboard).catch(e=>console.log(e));
    }
};

bot.start((ctx) => showMainMenu(ctx));

// --- SUB-MENUS ---

// A. TECH SERVICES (Only Business Tech)
bot.action('menu_services', (ctx) => {
    ctx.editMessageText(`🛠 *Navya Astra Services:*\n\nWe specialize in:`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('📱 App Development', 'srv_app'), Markup.button.callback('💻 Web Development', 'srv_web')],
            [Markup.button.callback('🤖 Telegram Bots', 'srv_bot'), Markup.button.callback('🧠 AI & Automation', 'srv_ai')],
            [Markup.button.callback('🔙 Back', 'btn_back')]
        ])
    });
});

// B. PORTFOLIO (New Section - Replaces Trading)
bot.action('menu_portfolio', (ctx) => {
    ctx.editMessageText(`📂 *Our Recent Projects:*\n\n1. **E-commerce App:** Full Android/iOS Store for a Retail Brand.\n2. **Business Website:** SEO Optimized site for a Real Estate Agency.\n3. **Customer Support Bot:** Automated handling for 500+ users.\n\nWant to see demos? Contact us!`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('📝 Get a Similar Project', 'menu_quote')],
            [Markup.button.callback('🔙 Back', 'btn_back')]
        ])
    });
});

// C. PAYMENT (QR)
bot.action('menu_pay', (ctx) => {
    if (qrFileId) {
        ctx.replyWithPhoto(qrFileId, { caption: `💰 *Scan to Pay*\n\nSecure payment via Navya Astra Business Account.\nPlease send a screenshot after payment.` , parse_mode: 'Markdown'});
    } else {
        ctx.reply(`⚠️ Admin has not set the QR Code yet.`);
    }
});

// D. REVIEWS (Pure Tech Reviews)
bot.action('menu_reviews', (ctx) => {
    const reviewText = `⭐ *What Clients Say:*\n\n👤 *Rahul S. (CEO)*\n"Navya Astra built our company website in record time. Professional and clean code." ⭐⭐⭐⭐⭐\n\n👤 *Vikram J. (Startup Founder)*\n"Best App Developers! They understood my vision perfectly." ⭐⭐⭐⭐⭐`;
    ctx.editMessageText(reviewText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Back', 'btn_back')]]) });
});

// E. SUPPORT
bot.action('menu_support', (ctx) => {
    ctx.editMessageText(`📞 *Contact Support:*`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('💬 Chat with Admin', 'cnt_chat'), Markup.button.callback('📧 Email Us', 'cnt_email')],
            [Markup.button.callback('🔙 Back', 'btn_back')]
        ])
    });
});

// --- SMART QUOTE SYSTEM (LEAD GEN) ---
bot.action('menu_quote', (ctx) => {
    ctx.editMessageText(`🚀 *Start Your Project*\n\nLet's build something amazing. First, select your **Budget Range**:`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('₹5k - ₹15k', 'qt_bud_low'), Markup.button.callback('₹15k - ₹50k', 'qt_bud_mid')],
            [Markup.button.callback('₹50k+', 'qt_bud_high'), Markup.button.callback('🔙 Cancel', 'btn_back')]
        ])
    });
});

const handleBudget = (ctx, budget) => {
    ctx.editMessageText(`✅ Budget: ${budget}\n\n**When do you need this project delivered?**`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('Urgent (3-5 Days)', `qt_time_urg_${budget}`)],
            [Markup.button.callback('Standard (1-2 Weeks)', `qt_time_flx_${budget}`)],
        ])
    });
};

bot.action('qt_bud_low', (ctx) => handleBudget(ctx, 'Low (5-15k)'));
bot.action('qt_bud_mid', (ctx) => handleBudget(ctx, 'Mid (15-50k)'));
bot.action('qt_bud_high', (ctx) => handleBudget(ctx, 'High (50k+)'));

bot.action(/qt_time_(.+)/, async (ctx) => {
    const data = ctx.match[1].split('_');
    const urgency = data[0] === 'urg' ? 'Urgent' : 'Standard';
    const budget = data[1]; 
    const user = ctx.from.first_name;
    const handle = ctx.from.username ? `@${ctx.from.username}` : "No Username";

    await ctx.editMessageText(`✅ **Request Sent!**\nOur technical team will analyze your requirements and contact you shortly.`);
    
    if (ADMIN_ID) {
        bot.telegram.sendMessage(ADMIN_ID, `🔔 *New Project Lead (Tech)*\n\n👤 *Client:* ${user} (${handle})\n💰 *Budget:* ${budget}\n⏳ *Timeline:* ${urgency}`, { parse_mode: 'Markdown' });
    }
});

// --- DETAILS & HANDLERS ---
bot.action('srv_app', (ctx) => ctx.reply('📱 **App Development:**\nNative Android (Kotlin/Java) & iOS Apps.\nStarting @ ₹15,000.'));
bot.action('srv_web', (ctx) => ctx.reply('💻 **Web Development:**\nBusiness Websites, E-commerce, & Portfolios.\nStarting @ ₹5,000.'));
bot.action('srv_bot', (ctx) => ctx.reply('🤖 **Telegram Bots:**\nAutomation, Group Management, & Shop Bots.\nStarting @ ₹2,000.'));
bot.action('srv_ai', (ctx) => ctx.reply('🧠 **AI Solutions:**\nChatGPT Integration, Custom AI Tools.'));

bot.action('cnt_chat', (ctx) => ctx.reply('Direct Message: @Raj_Tiwari_Official'));
bot.action('cnt_email', (ctx) => ctx.reply('Email: contact@navyaastra.com'));
bot.action('btn_back', (ctx) => showMainMenu(ctx));

bot.on('photo', (ctx) => {
    if (ctx.from.id == ADMIN_ID && adminState === 'WAITING_FOR_QR') {
        qrFileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        adminState = null;
        ctx.reply("✅ QR Code Set Successfully!");
    }
});

bot.on('text', async (ctx) => {
    if (adminState) return;
    const userMsg = ctx.message.text;
    if (userMsg.startsWith('/')) return;

    if (ADMIN_ID) {
        bot.telegram.sendMessage(ADMIN_ID, `🔔 *New Message*\n👤: ${ctx.from.first_name}\n💬: ${userMsg}`);
        ctx.reply("Message received! We will reply shortly. ✅");
    }
});

// --- SERVER ---
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } else {
            res.status(200).send('Navya Astra Tech Bot is Live 🟢');
        }
    } catch (e) {
        res.status(500).send('Error');
    }
};
