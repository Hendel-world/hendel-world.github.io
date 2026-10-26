const express = require('express');
const crypto = require('crypto');
const mineflayer = require('mineflayer');

// 1. Веб-сервер и приём платежей AnyPay
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
let botStatus = 'Инициализация...';

// Настройки AnyPay
const ANYPAY_PROJECT_ID = '18631';
const ANYPAY_SECRET = 'z6BJacQ0qBphXPd7vgKKmbmUgGcDl8AguxybVHX';

const ITEM_COMMANDS = {
    'rank_dream': 'setrank {nick} dream',
    'rank_rich': 'setrank {nick} rich',
    'rank_dragon': 'setrank {nick} dragon',
    'rank_hendel': 'setrank {nick} hendel',
    'rank_astra': 'setrank {nick} astra',
    'rank_infinity': 'setrank {nick} infinity',
    'case_donate': 'case give {nick} donate 1',
    'case_weapon': 'case give {nick} weapon 1',
    'coins_500k': 'eco give {nick} 500000',
    'coins_2500k': 'eco give {nick} 2500000'
};

app.get('/', (req, res) => {
    res.send(`<h1>Hendel World Gateway 24/7</h1><p>Бот: <b>${botStatus}</b></p><p>Платёжный шлюз: <b>Активен (AnyPay #18631)</b></p>`);
});

// URL оповещения AnyPay (Webhook)
app.all('/result', (req, res) => {
    const data = req.method === 'POST' ? req.body : req.query;
    console.log('[AnyPay Webhook]:', data);

    const { currency, amount, pay_id, merchant_id, status, sign, desc } = data;

    // Проверка подписи
    if (sign && currency && amount && pay_id && merchant_id && status) {
        const signStr = `${currency}:${amount}:${pay_id}:${merchant_id}:${status}:${ANYPAY_SECRET}`;
        const checkSign = crypto.createHash('md5').update(signStr).digest('hex');

        if (checkSign.toLowerCase() !== sign.toLowerCase()) {
            console.error('[AnyPay] Неверная подпись MD5!');
            return res.status(400).send('bad sign');
        }
    }

    // Если платёж успешен (paid)
    if (status === 'paid' || !status) {
        let nick = 'Player';
        let itemId = '';

        if (desc) {
            // desc вида: "Dream для Saanimaing (rank_dream)"
            const nickMatch = desc.match(/для\s+([A-Za-z0-9_]+)/i);
            if (nickMatch) nick = nickMatch[1];

            const itemMatch = desc.match(/\(([a-z0-9_]+)\)/i);
            if (itemMatch) itemId = itemMatch[1];
        }

        console.log(`[AnyPay] УСПЕШНАЯ ОПЛАТА! Ник: ${nick}, Товар: ${itemId}, Сумма: ${amount} руб.`);

        // Выдача через бота на сервере
        if (bot && bot.entity) {
            const cmdTemplate = ITEM_COMMANDS[itemId];
            if (cmdTemplate) {
                const cmd = cmdTemplate.replace('{nick}', nick);
                console.log(`[Server] Выполняю команду выдачи: /${cmd}`);
                bot.chat(`/${cmd}`);
                setTimeout(() => {
                    bot.chat(`/broadcast §6§l[HENDEL] §aИгрок §f${nick} §aприобрёл донат! Поздравляем!`);
                }, 1000);
            } else {
                console.log(`[Server] Выдаю по умолчанию ранг игроку ${nick}...`);
                bot.chat(`/setrank ${nick} dream`);
            }
        }

        // Отправка уведомления админу в Telegram
        try {
            const { notifyAdminPayment } = require('./tg-bot');
            if (notifyAdminPayment) {
                notifyAdminPayment(`💰 <b>НОВАЯ ПОКУПКА НА САЙТЕ!</b>\n\n👤 <b>Игрок:</b> ${nick}\n📦 <b>Товар:</b> ${itemId || desc}\n💵 <b>Сумма:</b> ${amount} ₽\n🆔 <b>Платёж:</b> #${pay_id}`);
            }
        } catch (e) {}

        return res.send('OK');
    }

    res.send('OK');
});

// Страницы успешной и неуспешной оплаты
app.get('/success', (req, res) => {
    res.send(`<h1>Оплата успешна!</h1><p>Спасибо за покупку. Донат уже выдается на сервере hendelworld.falixsrv.me</p><a href="https://hendel-world.github.io">Вернуться на сайт</a>`);
});
app.get('/fail', (req, res) => {
    res.send(`<h1>Оплата не завершена</h1><p>Вы можете попробовать снова на сайте.</p><a href="https://hendel-world.github.io">Вернуться на сайт</a>`);
});

app.listen(PORT, () => {
    console.log(`[Web] HTTP сервер и AnyPay Webhook слушают порт ${PORT}`);
});

// 2. Настройки подключения бота к Minecraft
const MC_HOST = process.env.MC_HOST || 'hendelworld.falixsrv.me';
const MC_PORT = parseInt(process.env.MC_PORT || '49662', 10);
const MC_USERNAME = process.env.MC_USERNAME || 'HendelBot_24_7';
const MC_PASSWORD = process.env.MC_PASSWORD || 'HendelAFK2026!';

let bot = null;
let reconnectTimer = null;

function createBot() {
    console.log(`[Bot] Подключение к ${MC_HOST}:${MC_PORT}...`);
    botStatus = `Подключается к ${MC_HOST}:${MC_PORT}...`;

    try {
        const botOptions = {
            host: MC_HOST,
            port: MC_PORT,
            username: MC_USERNAME,
            version: '1.21.4',
            hideErrors: false
        };
        
        bot = mineflayer.createBot(botOptions);
    } catch (e) {
        console.error('[Bot] Ошибка создания:', e.message);
        scheduleReconnect();
        return;
    }

    bot.once('spawn', () => {
        console.log('[Bot] Успешно зашёл в мир!');
        botStatus = 'В игре (Сервер активен 24/7)';

        // Анти-АФК
        startAntiAfk();
    });

    bot.on('message', (jsonMsg) => {
        const text = jsonMsg.toString();

        // Решение капчи: "X + Y" или "X - Y"
        const mathMatch = text.match(/(\d{1,2})\s*([\+\-])\s*(\d{1,2})/);
        if (mathMatch) {
            const num1 = parseInt(mathMatch[1], 10);
            const op = mathMatch[2];
            const num2 = parseInt(mathMatch[3], 10);
            const answer = op === '+' ? (num1 + num2) : (num1 - num2);
            console.log(`[Bot] Решаю капчу: ${num1} ${op} ${num2} = ${answer}`);
            setTimeout(() => {
                bot.chat(answer.toString());
            }, 800);
            return;
        }

        // Регистрация
        if (text.includes('/reg') || text.includes('Зарегистрируйтесь') || text.includes('регистрац')) {
            setTimeout(() => {
                bot.chat(`/register ${MC_PASSWORD} ${MC_PASSWORD}`);
            }, 1000);
        }

        // Авторизация
        if (text.includes('/login') || text.includes('Авторизуйтесь') || text.includes('авториз')) {
            setTimeout(() => {
                bot.chat(`/login ${MC_PASSWORD}`);
            }, 1000);
        }
    });

    bot.on('kicked', (reason) => {
        console.log('[Bot] Кикнут с сервера:', reason);
        botStatus = `Кикнут: ${typeof reason === 'string' ? reason : JSON.stringify(reason)}`;
        scheduleReconnect();
    });

    bot.on('end', () => {
        console.log('[Bot] Соединение разорвано.');
        botStatus = 'Отключён, ожидание перезахода...';
        scheduleReconnect();
    });

    bot.on('error', (err) => {
        console.error('[Bot] Ошибка сети:', err.message);
        botStatus = `Ошибка сети: ${err.message}`;
    });
}

let antiAfkInterval = null;
function startAntiAfk() {
    if (antiAfkInterval) clearInterval(antiAfkInterval);
    antiAfkInterval = setInterval(() => {
        if (!bot || !bot.entity) return;
        try {
            const yaw = (Math.random() * Math.PI) - (Math.PI / 2);
            const pitch = (Math.random() * Math.PI / 2) - (Math.PI / 4);
            bot.look(yaw, pitch, true);
            bot.swingArm('right');
            if (Math.random() < 0.25) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 350);
            }
        } catch (e) {}
    }, 25000);
}

function scheduleReconnect() {
    if (antiAfkInterval) {
        clearInterval(antiAfkInterval);
        antiAfkInterval = null;
    }
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        createBot();
    }, 20000);
}

// Запуск бота Minecraft
createBot();

// Запуск Telegram бота техподдержки 24/7
try {
    const { startBotPolling } = require('./tg-bot');
    startBotPolling();
} catch (err) {
    console.error('[TG Bot] Ошибка запуска:', err.message);
}
