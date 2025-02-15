//Объявление библиотек
const axios = require('axios'); //Библиотека для http запросов
const TelegramBot = require('node-telegram-bot-api'); //Библиотека для тг-бота
const GigaToken = require('./GigaToken.js'); //Библиотека для получения актуального токена для достукпа к гигаЧату

//Добавление сертификата мин. цифры для взаимодействия с api gigaChat (взято с сайта gigachat)
const path = require('path')
process.env.NODE_EXTRA_CA_CERTS= path.resolve(__dirname, 'dir', 'with', 'certs')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

//Инициализация тг-бота
const bot = new TelegramBot(process.env.API_KEY_TG_BOT, {
    polling: true
});

//Инициализация класса, который отвечает за токен для гигаЧата
const gigaToken = new GigaToken('start', new Date().getTime());

//Вывод лога в консоль при ошибке получения сообщений от тг-бота
bot.on("polling_error", err => console.log(err.data.error.message));

//Обработка получения текстового сообщения от тг-бота
bot.on('text', async msg => {
    if (['/start', '/stop'].includes(msg.text)) { //Если бот получил эти команды, то он должен их обработать отдельно
        await processComand(msg);
    } else {
        console.log('Request_' + msg.chat.id + ': ' + msg.text); //Вывод в консоль ИД чата и сообщения
        var response = await sendContentToGigaChat(msg.text); //Отправка сообщения в гигаЧат
        console.log('Response_' + msg.chat.id + ': ' + response); //Вывод в консоль ИД чата и ответа
        await bot.sendMessage(msg.chat.id, response); //Отправка ответа от гигаЧата пользователю
    }
})

//Обработка команд старт стоп
async function processComand(msg) {
    console.log(msg.chat.id, 'sent command message:', msg.text);
    if (msg == '/start') {
        await bot.sendMessage(msg.chat.id, "Привет! Напиши мне название лекарства или что тебя беспокоит?");
    } else {
        await bot.sendMessage(msg.chat.id, "Извини, я не знаю что значит '" + msg.text + "'");
    }
}

//Отправка сообщения в гигачат
async function sendContentToGigaChat(userContent) {
    try {
        var token = await gigaToken.getToken(); //Получаем токен доступа к гигаЧату
        const response = await axios.post( //Отправляем POST запрос в гигаЧат с параметрами ниже
            'https://gigachat.devices.sberbank.ru/api/v1/chat/completions', // URL-адрес API гигаЧата
            {
                model: 'GigaChat', //Название модели
                messages: [ //Сообщения
                    {
                        //Промт
                        role: "system",
                        content: "Ты фармацевт, который экономит деньги своим покупателям и можешь посоветовать дешевый препарат от любого недуга.\
                        При рекомендации препаратов, дай среднюю стоимость. Если ты видишь название препарата, посоветуй дешевый аналог.\
                        Только предупреди, что на самом деле ты не являешься врачом и твои рекомендации носят лишь ознакомительный характер." 
                    },
                    {
                        //Сообщение от пользователя
                        role: "user",
                        content: userContent 
                    }
                ],
                //Обязательные параметры для запроса
                stream: false,
                update_interval: 0
            },
            {
                //Заголовки запроса
                headers: {
                    'Content-Type': 'application/json', //Тип контента, который отправлен в запросе
                    'Authorization': 'Bearer ' + token //Токен доступа к api гигаЧата
                }
            }
        );
        return response.data.choices[0].message.content; //Возврат ответа
    } catch (error) {
        return error; //Возврат ошибки
    }
}