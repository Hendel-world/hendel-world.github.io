const express = require('express');
const mineflayer = require('mineflayer');

// 1. Веб-сервер для поддержания облака 24/7 (Koyeb / Render)
const app = express();
const PORT = process.env.PORT || 3000;
let botStatus = 'Инициализация...';

app.get('/', (req, res) => {
    res.send(`<h1>Hendel AFK Bot 24/7</h1><p>Статус: <b>${botStatus}</b></p><p>Сервер: hendelworld.falixsrv.me</p>`);
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

        // Регистрация и логин в плагине HendelCore
        setTimeout(() => {
            bot.chat(`/register ${MC_PASSWORD} ${MC_PASSWORD}`);
            setTimeout(() => {
                bot.chat(`/login ${MC_PASSWORD}`);
            }, 1500);
        }, 2000);

        // Анти-АФК: каждые 30 секунд двигаем головой и взмахиваем рукой
        startAntiAfk();
    });

    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        // Если просят логин
        if (message.toLowerCase().includes('/login') || message.toLowerCase().includes('авториз')) {
            bot.chat(`/login ${MC_PASSWORD}`);
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
            // Редкий прыжок
            if (Math.random() < 0.3) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 400);
            }
        } catch (e) {
            // игнорируем мелкие ошибки
        }
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

// Запуск
createBot();
