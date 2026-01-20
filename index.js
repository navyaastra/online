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
    ctx.reply("📸 Apna Payment QR Code (Photo) bhejein.");
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
    const welcomeText = `Namaste Boss! 🙏\nWelcome to *Navya Astra*.\n\nHum Innovative Tech Solutions aur Automation provide karte hain. 🚀\nSelect an option:`;
    
    // Agency hata diya, ab sirf Tech aur Business hai
    const mainKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🚀 Tech Services', 'menu_services'), Markup.button.callback('📈 Trading Hub', 'menu_trading')],
        [Markup.button.callback('📝 Get Quote', 'menu_quote'), Markup.button.callback('💰 Pay Now / QR', 'menu_pay')],
        [Markup.button.callback('⭐ Client Reviews', 'menu_reviews'), Markup.button.callback('📄 Company Profile', 'menu_more')],
        [Markup.button.callback('📞 Contact Support', 'menu_support')]
    ]);

    if (ctx.callbackQuery) {
        ctx.editMessageText(welcomeText, { parse_mode: 'Markdown', ...mainKeyboard }).catch(e=>console.log(e));
    } else {
        ctx.replyWithMarkdown(welcomeText, mainKeyboard).catch(e=>console.log(e));
    }
};

bot.start((ctx) => showMainMenu(ctx));

// --- SUB-MENUS ---

// A. TECH SERVICES
bot.action('menu_services', (ctx) => {
    ctx.editMessageText(`🛠 *Navya Astra Services:*\n\nHigh-quality coding solutions:`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('📱 App Dev', 'srv_app'), Markup.button.callback('💻 Web Dev', 'srv_web')],
            [Markup.button.callback('🤖 Telegram Bots', 'srv_bot'), Markup.button.callback('🎨 AI Graphics', 'srv_gfx')],
            [Markup.button.callback('🔙 Back', 'btn_back')]
        ])
    });
});

// B. TRADING HUB (FinTech)
bot.action('menu_trading', (ctx) => {
    ctx.editMessageText(`📈 *Trading & Finance Hub*\n\nStock Market tools powered by Navya Astra:`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('📊 Intraday Tips', 'trd_tips'), Markup.button.callback('🤖 Algo Trading Bot', 'trd_bot')],
            [Markup.button.callback('🏦 Open Demat Acc', 'trd_demat'), Markup.button.callback('🔙 Back', 'btn_back')]
        ])
    });
});

// C. PAYMENT (QR)
bot.action('menu_pay', (ctx) => {
    if (qrFileId) {
        ctx.replyWithPhoto(qrFileId, { caption: `💰 *Scan to Pay*\n\nPayment karke screenshot bhejein.` , parse_mode: 'Markdown'});
    } else {
        ctx.reply(`⚠️ Admin ne abhi tak QR Code set nahi kiya hai.`);
    }
});

// D. REVIEWS (Pure Tech Reviews)
bot.action('menu_reviews', (ctx) => {
    const reviewText = `⭐ *Client Reviews:*\n\n👤 *Rahul S.* (Business Owner)\n"Navya Astra ne meri E-commerce website 3 din mein live kar di. Great work!" ⭐⭐⭐⭐⭐\n\n👤 *Amit V.* (Trader)\n"Inka Algo Bot mast kaam karta hai. Daily profit nikal raha hu." ⭐⭐⭐⭐⭐`;
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

// F. MORE INFO
bot.action('menu_more', (ctx) => {
    ctx.editMessageText(`🏢 *About Navya Astra:*\n\nHum ek Premium Tech Agency hain.\nFocus: Web3, AI, and Automation.\nFounder: Raj Tiwari`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Back', 'btn_back')]])
    });
});

// --- SMART QUOTE SYSTEM ---
bot.action('menu_quote', (ctx) => {
    ctx.editMessageText(`🤖 *Project Estimate*\n\nApna **Budget** select karein:`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('₹5k - ₹15k', 'qt_bud_low'), Markup.button.callback('₹15k - ₹50k', 'qt_bud_mid')],
            [Markup.button.callback('₹50k+', 'qt_bud_high'), Markup.button.callback('🔙 Cancel', 'btn_back')]
        ])
    });
});

const handleBudget = (ctx, budget) => {
    ctx.editMessageText(`✅ Budget: ${budget}\n\n**Deadline kya hai?**`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('Urgent (3 Days)', `qt_time_urg_${budget}`)],
            [Markup.button.callback('Flexible (1-2 Weeks)', `qt_time_flx_${budget}`)],
        ])
    });
};

bot.action('qt_bud_low', (ctx) => handleBudget(ctx, 'Low (5-15k)'));
bot.action('qt_bud_mid', (ctx) => handleBudget(ctx, 'Mid (15-50k)'));
bot.action('qt_bud_high', (ctx) => handleBudget(ctx, 'High (50k+)'));

bot.action(/qt_time_(.+)/, async (ctx) => {
    const data = ctx.match[1].split('_');
    const urgency = data[0] === 'urg' ? 'Urgent' : 'Flexible';
    const budget = data[1]; 
    const user = ctx.from.first_name;
    const handle = ctx.from.username ? `@${ctx.from.username}` : "No Username";

    await ctx.editMessageText(`✅ **Request Sent!**\nHumari technical team jald hi contact karegi.`);
    
    if (ADMIN_ID) {
        bot.telegram.sendMessage(ADMIN_ID, `🔔 *New Tech Project Lead*\n\n👤 *Client:* ${user} (${handle})\n💰 *Budget:* ${budget}\n⏳ *Timeline:* ${urgency}`, { parse_mode: 'Markdown' });
    }
});

// --- DETAILS & HANDLERS ---
bot.action('srv_app', (ctx) => ctx.reply('📱 Android/iOS Apps starts @ ₹15,000'));
bot.action('srv_web', (ctx) => ctx.reply('💻 Websites starts @ ₹5,000'));
bot.action('srv_bot', (ctx) => ctx.reply('🤖 Automation Bots starts @ ₹2,000'));
bot.action('srv_gfx', (ctx) => ctx.reply('🎨 Logo & Branding starts @ ₹1,000'));
bot.action('trd_tips', (ctx) => ctx.reply('📊 Premium Tips Group join karne ke liye DM karein.'));
bot.action('cnt_chat', (ctx) => ctx.reply('Direct Message: @Raj_Tiwari_Official'));
bot.action('btn_back', (ctx) => showMainMenu(ctx));

bot.on('photo', (ctx) => {
    if (ctx.from.id == ADMIN_ID && adminState === 'WAITING_FOR_QR') {
        qrFileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        adminState = null;
        ctx.reply("✅ QR Code Set ho gaya!");
    }
});

bot.on('text', async (ctx) => {
    if (adminState) return;
    const userMsg = ctx.message.text;
    if (userMsg.startsWith('/')) return;

    if (ADMIN_ID) {
        bot.telegram.sendMessage(ADMIN_ID, `🔔 *Message:* ${userMsg}\n👤: ${ctx.from.first_name}`);
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
            res.status(200).send('Navya Astra Tech Bot 🟢');
        }
    } catch (e) {
        res.status(500).send('Error');
    }
};
