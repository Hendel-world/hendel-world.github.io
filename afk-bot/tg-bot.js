const fs = require('fs');
const path = require('path');

const BOT_TOKEN = '8936934453:AAEIkLylGUN_rLQPS9jwb72U1hSIuJA-eYw';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

const DATA_DIR = __dirname;
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// Загрузка данных
let tickets = [];
try {
    if (fs.existsSync(TICKETS_FILE)) {
        tickets = JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf8'));
    }
} catch (e) {
    tickets = [];
}

let adminChatId = null;
try {
    if (fs.existsSync(ADMIN_FILE)) {
        const d = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
        adminChatId = d.adminChatId || null;
    }
} catch (e) {}

function saveTickets() {
    try {
        fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
    } catch (e) {}
}

function saveAdmin() {
    try {
        fs.writeFileSync(ADMIN_FILE, JSON.stringify({ adminChatId }, null, 2));
    } catch (e) {}
}

async function tgRequest(method, body = {}) {
    try {
        const res = await fetch(`${API_URL}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

async function sendMessage(chatId, text, replyMarkup = null) {
    const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
    };
    if (replyMarkup) payload.reply_markup = replyMarkup;
    return await tgRequest('sendMessage', payload);
}

// Меню для администратора
const ADMIN_KEYBOARD = {
    keyboard: [
        [{ text: '📬 Почтовый ящик (Новые)' }, { text: '📋 Все тикеты' }],
        [{ text: '🗑 Очистить закрытые' }]
    ],
    resize_keyboard: true
};

async function handleMessage(msg) {
    const chatId = msg.chat.id;
    const text = (msg.text || '').trim();
    const fromUser = msg.from.username ? `@${msg.from.username}` : (msg.from.first_name || 'Игрок');

    // 1. Команда авторизации админа: /admin Sanimaing
    if (text === '/admin Sanimaing' || text === '/admin') {
        adminChatId = chatId;
        saveAdmin();
        const unreadCount = tickets.filter(t => t.status === 'NEW').length;
        await sendMessage(chatId, `👑 <b>Вы успешно авторизованы как Администратор (Sanimaing)!</b>\n\nВам не будут приходить назойливые уведомления. Все сообщения от игроков спокойно собираются во вкладке <b>📬 Почтовый ящик</b>.\n\nНовых писем сейчас: <b>${unreadCount}</b>`, ADMIN_KEYBOARD);
        return;
    }

    // 2. Если пишет АДМИНИСТРАТОР
    if (chatId === adminChatId) {
        if (text === '📬 Почтовый ящик (Новые)') {
            const unread = tickets.filter(t => t.status === 'NEW');
            if (unread.length === 0) {
                await sendMessage(chatId, '📭 <b>Почтовый ящик пуст!</b>\nНовых непрочитанных обращений нет.', ADMIN_KEYBOARD);
                return;
            }

            let response = `📬 <b>Новые обращения (${unread.length} шт.):</b>\n\n`;
            unread.forEach(t => {
                response += `━━━━━━━━━━━━━━\n`;
                response += `📌 <b>Тикет #${t.id}</b> от ${t.from}\n`;
                response += `🕒 <i>${t.date}</i>\n`;
                response += `💬 <b>Сообщение:</b> ${t.text}\n`;
                response += `👉 <i>Ответить: <code>/reply ${t.id} текст</code></i>\n\n`;
            });
            await sendMessage(chatId, response, ADMIN_KEYBOARD);
            return;
        }

        if (text === '📋 Все тикеты') {
            if (tickets.length === 0) {
                await sendMessage(chatId, 'Список обращений пуст.', ADMIN_KEYBOARD);
                return;
            }
            const last10 = tickets.slice(-10);
            let response = `📋 <b>Последние ${last10.length} обращений:</b>\n\n`;
            last10.forEach(t => {
                const statusIcon = t.status === 'NEW' ? '🔴 Новый' : '🟢 Отвечен';
                response += `#${t.id} [${statusIcon}] от ${t.from}: ${t.text.substring(0, 40)}...\n`;
            });
            await sendMessage(chatId, response, ADMIN_KEYBOARD);
            return;
        }

        if (text === '🗑 Очистить закрытые') {
            tickets = tickets.filter(t => t.status === 'NEW');
            saveTickets();
            await sendMessage(chatId, '✅ Архив закрытых тикетов очищен.', ADMIN_KEYBOARD);
            return;
        }

        // Команда ответа: /reply <id> <текст>
        if (text.startsWith('/reply')) {
            const parts = text.split(' ');
            if (parts.length < 3) {
                await sendMessage(chatId, 'Использование: <code>/reply 1 Ваш ответ игроку</code>', ADMIN_KEYBOARD);
                return;
            }
            const ticketId = parseInt(parts[1], 10);
            const replyText = parts.slice(2).join(' ');
            const ticket = tickets.find(t => t.id === ticketId);

            if (!ticket) {
                await sendMessage(chatId, `❌ Тикет #${ticketId} не найден!`, ADMIN_KEYBOARD);
                return;
            }

            ticket.status = 'ANSWERED';
            saveTickets();

            // Отправляем ответ игроку
            await sendMessage(ticket.chatId, `🛡️ <b>Ответ от техподдержки HENDEL WORLD:</b>\n\n${replyText}\n\n<i>Если у вас остались вопросы, просто напишите их в этот чат.</i>`);
            await sendMessage(chatId, `✅ Ответ успешно отправлен игроку по тикету #${ticketId}!`, ADMIN_KEYBOARD);
            return;
        }
    }

    // 3. Если пишет ИГРОК (Пользователь)
    if (text === '/start') {
        await sendMessage(chatId, `👋 <b>Добро пожаловать в техподдержку HENDEL WORLD!</b>\n\nЗдесь вы можете задать вопрос по донату, сообщить о баге или подать жалобу.\n\n✍️ <b>Просто напишите вашу проблему одним сообщением прямо сюда:</b>\n<i>(Укажите ваш никнейм на сервере и суть вопроса)</i>`);
        return;
    }

    // Сохраняем сообщение как тикет в почту
    if (text.length > 0) {
        const newId = tickets.length > 0 ? (tickets[tickets.length - 1].id + 1) : 1;
        const now = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' });

        tickets.push({
            id: newId,
            chatId: chatId,
            from: fromUser,
            date: now,
            text: text,
            status: 'NEW'
        });
        saveTickets();

        await sendMessage(chatId, `✅ <b>Ваше сообщение принято в обработку (Тикет #${newId})!</b>\n\nАдминистрация ответит вам прямо в этот чат в ближайшее время.`);
        console.log(`[TG Bot] Новое письмо от ${fromUser} (Тикет #${newId})`);
    }
}

// Long-polling loop
let offset = 0;
async function startBotPolling() {
    console.log('[TG Bot] Запущен Telegram-бот техподдержки @hendel_support_bot 24/7');
    while (true) {
        try {
            const res = await tgRequest('getUpdates', {
                offset: offset,
                timeout: 25,
                allowed_updates: ['message']
            });

            if (res.ok && Array.isArray(res.result)) {
                for (const update of res.result) {
                    offset = update.update_id + 1;
                    if (update.message) {
                        await handleMessage(update.message);
                    }
                }
            }
        } catch (e) {
            console.error('[TG Bot] Ошибка polling:', e.message);
        }
        await new Promise(r => setTimeout(r, 1000));
    }
}

module.exports = { startBotPolling };
