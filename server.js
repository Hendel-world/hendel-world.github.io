/**
 * HENDEL WORLD — Автоматическая выдача доната через Webhook & RCON
 * 
 * Поддерживаемые платёжки:
 * - AnyPay (anypay.io)
 * - PayOK (payok.io)
 * - FreeKassa (freekassa.ru)
 * 
 * Запуск: node server.js
 */

const http = require('http');
const crypto = require('crypto');
const net = require('net');

const PORT = 3000;

// ==========================================
// НАСТРОЙКИ ПЛАТЁЖНЫХ СИСТЕМ
// ==========================================
const CONFIG = {
    // Проект и секретный ключ AnyPay.io
    ANYPAY_PROJECT_ID: '18631',
    ANYPAY_SECRET: 'z6BJacQ0qBphXPd7vgKKmbmUgGcDl8AguxybVHX',
    
    // Секретный ключ из личного кабинета PayOK.io
    PAYOK_SECRET: 'YOUR_PAYOK_SECRET_KEY',

    // RCON настройки Minecraft сервера (из server.properties)
    RCON: {
        host: '127.0.0.1',
        port: 25575,
        password: 'hendel_secure_rcon_2026' // пароль RCON
    }
};

// Соответствие товаров командам в Minecraft
const ITEM_COMMANDS = {
    // Ранги
    'rank_dream': 'setrank {nick} dream',
    'rank_rich': 'setrank {nick} rich',
    'rank_dragon': 'setrank {nick} dragon',
    'rank_hendel': 'setrank {nick} hendel',
    'rank_astra': 'setrank {nick} astra',
    'rank_infinity': 'setrank {nick} infinity',

    // Кейсы
    'case_donate': 'case give {nick} donate 1',
    'case_weapon': 'case give {nick} weapon 1',

    // Монеты
    'coins_500k': 'eco give {nick} 500000',
    'coins_2500k': 'eco give {nick} 2500000',

    // Артефакты
    'item_giant': 'case give {nick} weapon 5' // или прямая выдача
};

// Простой RCON-клиент
function executeMinecraftCommand(command) {
    console.log(`[RCON] Отправка команды на сервер: ${command}`);
    // В боевом режиме подключение к RCON через rcon-client пакет или TCP сокет
}

// Создание HTTP сервера для приёма вебхуков от платёжек
const server = http.createServer((req, res) => {
    // Обработка статики для сайта
    if (req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('HENDEL WORLD Payment Gateway Server is running!');
        return;
    }

    // Обработка уведомления об успешной оплате (POST Webhook)
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            console.log('[PAYMENT] Получен webhook:', body);

            try {
                const params = new URLSearchParams(body);
                
                // Пример для AnyPay
                // pay_id, amount, custom_fields / desc
                const payId = params.get('pay_id');
                const amount = params.get('amount');
                const desc = params.get('desc'); // в desc передаётся "Привилегия ASTRA для Saanimaing"

                console.log(`[PAYMENT] Успешная оплата #${payId} на сумму ${amount} руб. (${desc})`);

                // Выдача доната:
                // executeMinecraftCommand(`setrank ${nick} ${rank}`);

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('OK');
            } catch (err) {
                console.error('[PAYMENT] Ошибка обработки:', err);
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('ERROR');
            }
        });
    }
});

server.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` HENDEL WORLD Payment Webhook Server запущен!    `);
    console.log(` Порт: ${PORT}                                  `);
    console.log(` Ссылка для webhook: http://ваш-домен/pay-callback`);
    console.log(`=================================================`);
});
