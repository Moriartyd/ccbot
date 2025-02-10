const axios = require('axios');

const TelegramBot = require('node-telegram-bot-api');
const https = require('https');
const GigaToken = require('./GigaToken.js')

const path = require('path')

process.env.API_KEY_TG_BOT='7759036798:AAEWNVvhbJh60WRDCZVxKKcU6JqVInC5y90'
process.env.GIGA_AUTH_KEY='N2NmZjM1ZGMtYTg3NC00M2M4LWE2Y2ItMWFhNzk2MmI1OWFlOmEzNDVkMzRhLTEyZjItNDBmMi04MGFhLTZjM2MwYmQ1NDgwMA=='

process.env.NODE_EXTRA_CA_CERTS= path.resolve(__dirname, 'dir', 'with', 'certs')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const bot = new TelegramBot(process.env.API_KEY_TG_BOT, {
    polling: true
});

const gigaToken = new GigaToken('start', new Date().getTime());

bot.on("polling_error", err => console.log(err.data.error.message));

bot.on('text', async msg => {
    if (['/start', '/stop'].includes(msg.text)) {
        await processComand(msg);
    } else {
        console.log('Request_' + msg.chat.id + ': ' + msg.text);
        var response = await sendContentToGigaChat(msg.text);
        console.log('Response_' + msg.chat.id + ': ' + response);
        await bot.sendMessage(msg.chat.id, response);
    }
})

async function processComand(msg) {
    console.log(msg.chat.id, 'sent command message:', msg.text);
    if (msg == '/start') {
        await bot.sendMessage(msg.chat.id, "Привет! Напиши мне название лекарства или что тебя беспокоит?");
    } else {
        await bot.sendMessage(msg.chat.id, "Извини, я не знаю что значит '" + msg.text + "'");
    }
}

bot.on('photo', async msg => {
    var fileId = msg.photo[msg.photo.length - 1].file_id;
    var filePath = await getFilePath(fileId);
    console.log('filePath=' + filePath);
    var imageUrl = 'https://api.telegram.org/file/bot' + process.env.API_KEY_TG_BOT + '/' + filePath;
    console.log('imageUrl=' + imageUrl);
    var response = await sendImageUrlToGigaChat(imageUrl);
    console.log('response: ' + response);
    await bot.sendMessage(msg.chat.id, response);
})

async function getFilePath(fileId) {

    var url = 'api.telegram.org';
    var path = '/bot' + process.env.API_KEY_TG_BOT + '/getFile?file_id=' + fileId;

    var options = {
        host: url,
        port: 443,
        path: path,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        json: true
      };

      return new Promise((resolve, reject) => {
        https
            .get(options, function(res) {
                res.setEncoding('utf8');
                res.on('data', function (data) {
                    var jsonObject = JSON.parse(data);
                    console.log('File path from response:' + jsonObject.result.file_path);
                    resolve(jsonObject.result.file_path)
                });
            })
            .on("error", e => reject(e))
        }
    )
}

// async function sendImageUrlToChatGPT(imageUrl) {
//     try {
//         const response = await openai.chat.completions.create({
//             model: "qwen2.5-vl-72b-instruct", // Модель с поддержкой изображений
//             messages: [
//                 { role: "system", content: "Ты помощник, который анализирует изображения." },
//                 { role: "user", content: [
//                     { type: "text", content: "Что изображено на этом фото?" },
//                     { type: "image_url", image_url: imageUrl }
//                 ] }
//             ],
//             max_tokens: 500
//         });

//         console.log('Ответ ChatGPT:', response.choices[0].message.content);
//     } catch (error) {
//         console.error('Ошибка:', error);
//     }
// }

async function sendContentToGigaChat(userContent) {
    try {
        var token = await gigaToken.getToken();
        const response = await axios.post(
            'https://gigachat.devices.sberbank.ru/api/v1/chat/completions', // URL-адрес API
            {
                model: 'GigaChat',
                messages: [
                    {
                        role: "system",
                        content: "Ты фармацевт, который экономит деньги своим покупателям и можешь посоветовать дешевый препарат от любого недуга.\
                        При рекомендации препаратов, дай среднюю стоимость. Если ты видишь название препарата, посоветуй дешевый аналог.\
                        Только предупреди, что на самом деле ты не являешься врачом и твои рекомендации носят лишь ознакомительный характер." 
                    },
                    {
                        role: "user",
                        content: userContent 
                    }
                ],
                stream: false,
                update_interval: 0
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        return error;
    }
}