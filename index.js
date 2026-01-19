const { Telegraf, Markup } = require('telegraf');

// Token check
const token = process.env.BOT_TOKEN;
if (!token) {
    console.error("ERROR: Bot Token missing in Vercel Settings");
}

const bot = new Telegraf(token || 'TOKEN_MISSING');

// --- BOT LOGIC ---
bot.start((ctx) => {
    const name = ctx.from.first_name || "User";
    const welcomeMsg = `Namaste ${name}! 🙏\nWelcome to *Navya Astra* (Root Version).\n\nHum aapke liye kya kar sakte hain?`;
    
    const buttons = Markup.inlineKeyboard([
        [Markup.button.callback('🚀 Services', 'btn_services'), Markup.button.callback('📞 Contact', 'btn_contact')],
        [Markup.button.callback('🏢 About Us', 'btn_about')]
    ]);
    
    ctx.replyWithMarkdown(welcomeMsg, buttons).catch(err => console.log(err));
});

bot.action('btn_services', (ctx) => {
    ctx.editMessageText(`🛠 *Services:*\n\n1. App Development\n2. Web Development\n3. Marketing`, { parse_mode: 'Markdown' }).catch(e=>console.log(e));
});

bot.action('btn_contact', (ctx) => {
    ctx.editMessageText(`📞 *Contact:*\n\nEmail: contact@navyaastra.com`, { parse_mode: 'Markdown' }).catch(e=>console.log(e));
});

bot.action('btn_about', (ctx) => {
    ctx.editMessageText(`ℹ️ *About:*\n\nNavya Astra Tech Solutions.`, { parse_mode: 'Markdown' }).catch(e=>console.log(e));
});

// --- SERVER HANDLER ---
module.exports = async (req, res) => {
    try {
        // Agar browser se khola
        if (req.method === 'GET') {
            return res.status(200).send('Navya Astra Bot is Running (Root)! 🟢');
        }

        // Agar Telegram se message aaya
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body);
            return res.status(200).send('OK');
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error');
    }
};
