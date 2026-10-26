const express = require('express');
const mineflayer = require('mineflayer');

// 1. Веб-сервер для поддержания облака 24/7 (Koyeb / Render)
const app = express();
const PORT = process.env.PORT || 3000;
let botStatus = 'Инициализация...';

app.get('/', (req, res) => {
    res.send(`<h1>Hendel AFK Bot 24/7</h1><p>Статус: <b>${botStatus}</b></p><p>Сервер: hendelworld.falixsrv.me:49662</p>`);
});

app.listen(PORT, () => {
    console.log(`[Web] HTTP сервер слушает порт ${PORT}`);
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

        // Анти-АФК: каждые 25 секунд двигаем головой и взмахиваем рукой
        startAntiAfk();
    });

    // Обработка сообщений (Капча и Авторизация)
    bot.on('message', (jsonMsg) => {
        const text = jsonMsg.toString();
        console.log('[Server Msg]:', text);

        // 1. Решение математической капчи HendelCore: "X + Y" или "X - Y"
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

        // 2. Регистрация
        if (text.includes('/reg') || text.includes('Зарегистрируйтесь') || text.includes('регистрац')) {
            console.log('[Bot] Отправляю /register...');
            setTimeout(() => {
                bot.chat(`/register ${MC_PASSWORD} ${MC_PASSWORD}`);
            }, 1000);
        }

        // 3. Авторизация
        if (text.includes('/login') || text.includes('Авторизуйтесь') || text.includes('авториз')) {
            console.log('[Bot] Отправляю /login...');
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
    console.log('[Bot] Переподключение через 20 секунд...');
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        createBot();
    }, 20000);
}

// Запуск Minecraft AFK бота
createBot();

// Запуск Telegram бота поддержки 24/7 с почтовым ящиком
try {
    const { startBotPolling } = require('./tg-bot');
    startBotPolling();
} catch (err) {
    console.error('[TG Bot] Ошибка инициализации:', err.message);
}
