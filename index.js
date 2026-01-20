const { Telegraf, Markup } = require('telegraf');

const token = process.env.BOT_TOKEN;
// 🔴 IMP: Apna ID yahan dalein
const ADMIN_ID = 5265106993; 

const bot = new Telegraf(token || 'TOKEN_MISSING');

// --- DATABASE VARIABLES (Memory me) ---
// Note: Vercel par ye restart hone par reset ho sakta hai.
// Permanent solution ke liye Database chahiye hota hai.
let userList = new Set(); // Users ko store karne ke liye (Broadcast ke liye)
let qrFileId = null; // QR Code ka ID store karne ke liye
let adminState = null; // Admin kya kar raha hai (e.g., setting QR)

// --- 1. MIDDLEWARE (User Tracker) ---
bot.use((ctx, next) => {
    if (ctx.from) {
        userList.add(ctx.from.id); // User ID save karein
    }
    return next();
});

// --- 2. ADMIN COMMANDS ---

// A. SET QR COMMAND
bot.command('setqr', (ctx) => {
    if (ctx.from.id != ADMIN_ID) return ctx.reply("❌ Access Denied.");
    adminState = 'WAITING_FOR_QR';
    ctx.reply("📸 Kripya apna **Payment QR Code** (Photo) bhejein.");
});

// B. BROADCAST COMMAND
bot.command('broadcast', async (ctx) => {
    if (ctx.from.id != ADMIN_ID) return ctx.reply("❌ Access Denied.");
    
    const message = ctx.message.text.split(' ').slice(1).join(' ');
    if (!message) return ctx.reply("⚠️ Format: `/broadcast Hello Everyone`");

    let count = 0;
    ctx.reply(`📢 Broadcasting to ${userList.size} users...`);
    
    for (const userId of userList) {
        try {
            await bot.telegram.sendMessage(userId, `📢 *Announcement:*\n\n${message}`, { parse_mode: 'Markdown' });
            count++;
        } catch (error) {
            console.log(`Failed to send to ${userId}`);
        }
    }
    ctx.reply(`✅ Broadcast Complete! Sent to ${count} users.`);
});

// --- 3. MAIN MENU ---
const showMainMenu = (ctx) => {
    const welcomeText = `Namaste Boss! 🙏\nWelcome to *Navya Astra*.\n\nTechnology, Marketing & Automation Hub. 🚀\nSelect an option:`;
    
    const mainKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🚀 Services', 'menu_services'), Markup.button.callback('🔥 Influencer Agency', 'menu_agency')],
        [Markup.button.callback('📝 Get Quote (Smart)', 'menu_quote'), Markup.button.callback('💰 Pay Now / QR', 'menu_pay')],
        [Markup.button.callback('⭐ Client Reviews', 'menu_reviews'), Markup.button.callback('📄 Brochure (PDF)', 'menu_brochure')],
        [Markup.button.callback('📞 Contact & FAQ', 'menu_support')]
    ]);

    if (ctx.callbackQuery) {
        ctx.editMessageText(welcomeText, { parse_mode: 'Markdown', ...mainKeyboard }).catch(e=>console.log(e));
    } else {
        ctx.replyWithMarkdown(welcomeText, mainKeyboard).catch(e=>console.log(e));
    }
};

bot.start((ctx) => showMainMenu(ctx));

// --- 4. SUB-MENUS & FEATURES ---

// A. SERVICES
bot.action('menu_services', (ctx) => {
    ctx.editMessageText(`🛠 *Our Services:*`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('📱 App Dev', 'srv_app'), Markup.button.callback('💻 Web Dev', 'srv_web')],
            [Markup.button.callback('🤖 Bot Dev', 'srv_bot'), Markup.button.callback('🔙 Back', 'btn_back')]
        ])
    });
});

// B. AGENCY
bot.action('menu_agency', (ctx) => {
    ctx.editMessageText(`🔥 *Influencer Agency:*`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🤝 Join as Creator', 'agy_join'), Markup.button.callback('💼 Hire Influencers', 'agy_hire')],
            [Markup.button.callback('🔙 Back', 'btn_back')]
        ])
    });
});

// C. PAYMENT (QR SYSTEM)
bot.action('menu_pay', (ctx) => {
    if (qrFileId) {
        ctx.replyWithPhoto(qrFileId, { caption: `💰 *Scan to Pay*\n\nPayment karke screenshot bhejein.` , parse_mode: 'Markdown'});
    } else {
        ctx.reply(`⚠️ Admin ne abhi tak QR Code set nahi kiya hai.\nKripya bank details maangein contact karke.`);
    }
});

// D. REVIEWS (TESTIMONIALS)
bot.action('menu_reviews', (ctx) => {
    const reviewText = `⭐ *Client Reviews:*\n\n👤 *Rahul S.* (Web Dev)\n"Navya Astra ne meri website 3 din mein bana di. Amazing work!" ⭐⭐⭐⭐⭐\n\n👤 *Priya K.* (Influencer)\n"Best agency for creators. Time par payment milti hai." ⭐⭐⭐⭐⭐`;
    ctx.editMessageText(reviewText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Back', 'btn_back')]]) });
});

// E. BROCHURE (PDF SENDER)
bot.action('menu_brochure', (ctx) => {
    ctx.replyWithChatAction('upload_document');
    // Yahan maine ek Sample PDF link dala hai. Aap apna link daal sakte hain.
    ctx.replyWithDocument('http://www.africau.edu/images/default/sample.pdf', { caption: '📄 Ye lijiye humara Company Brochure.' });
});

// F. SUPPORT
bot.action('menu_support', (ctx) => {
    ctx.editMessageText(`📞 *Contact Us:*`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('💬 Chat with Admin', 'cnt_chat')],
            [Markup.button.callback('🔙 Back', 'btn_back')]
        ])
    });
});

// --- 5. SMART QUOTE SYSTEM (LEAD GEN) ---
// Step 1: Budget
bot.action('menu_quote', (ctx) => {
    ctx.editMessageText(`🤖 *Smart Quote Generator*\n\nSabse pehle, apna **Budget** select karein:`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('₹5k - ₹15k', 'qt_bud_low'), Markup.button.callback('₹15k - ₹50k', 'qt_bud_mid')],
            [Markup.button.callback('₹50k+', 'qt_bud_high'), Markup.button.callback('🔙 Cancel', 'btn_back')]
        ])
    });
});

// Step 2: Deadline (Capture Budget & Ask Time)
const handleBudget = (ctx, budget) => {
    // Hum context me data store nahi kar sakte bina DB ke lambe samay tak, 
    // isliye hum seedha agla sawal puchenge aur final step me sab bhej denge.
    // Hack: Button ID me data pass karenge.
    ctx.editMessageText(`✅ Budget Note Hua: ${budget}\n\nAb batayein, **Project kab tak chahiye?**`, {
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

// Step 3: Final Submit
bot.action(/qt_time_(.+)/, async (ctx) => {
    const data = ctx.match[1].split('_'); // [urg, Low (5-15k)]
    const urgency = data[0] === 'urg' ? 'Urgent' : 'Flexible';
    const budget = data[1]; // Budget
    const user = ctx.from.first_name;
    const handle = ctx.from.username ? `@${ctx.from.username}` : "No Username";

    await ctx.editMessageText(`✅ **Quote Request Sent!**\n\nHumari team jald hi estimate ke saath aayegi.`);
    
    // Admin Alert
    if (ADMIN_ID) {
        bot.telegram.sendMessage(ADMIN_ID, `🔔 *New Quote Request*\n\n👤 *User:* ${user} (${handle})\n💰 *Budget:* ${budget}\n⏳ *Timeline:* ${urgency}`, { parse_mode: 'Markdown' });
    }
});


// --- 6. DETAILS & BACK BUTTON ---
bot.action('srv_app', (ctx) => ctx.reply('📱 App Dev Info: Native & Hybrid Apps.'));
bot.action('srv_web', (ctx) => ctx.reply('💻 Web Dev Info: React, Node, WordPress.'));
bot.action('cnt_chat', (ctx) => ctx.reply('Direct Message: @Raj_Tiwari_Official'));
bot.action('btn_back', (ctx) => showMainMenu(ctx));


// --- 7. PHOTO & TEXT HANDLER (QR & Leads) ---
bot.on('photo', (ctx) => {
    // Agar Admin QR set kar raha hai
    if (ctx.from.id == ADMIN_ID && adminState === 'WAITING_FOR_QR') {
        const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id; // Best quality
        qrFileId = fileId;
        adminState = null;
        ctx.reply("✅ **QR Code Successfully Set!**\nAb users 'Pay Now' button se ise dekh sakte hain.");
    }
});

bot.on('text', async (ctx) => {
    if (adminState) return; // Agar admin command mode me hai to ignore

    const userMsg = ctx.message.text;
    if (userMsg.startsWith('/')) return; // Commands ignore

    // Lead Forwarding
    if (ADMIN_ID) {
        bot.telegram.sendMessage(ADMIN_ID, `🔔 *New Message*\n👤: ${ctx.from.first_name}\n💬: ${userMsg}`);
        ctx.reply("Message received! ✅");
    }
});


// --- SERVER HANDLER ---
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } else {
            res.status(200).send('Navya Astra Ultimate Bot 🟢');
        }
    } catch (e) {
        console.error(e);
        res.status(500).send('Error');
    }
};
