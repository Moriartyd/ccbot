// const OpenAI = require("openai");
const axios = require('axios');

const TelegramBot = require('node-telegram-bot-api');
const https = require('https');
const GigaToken = require('./GigaToken.js')

const path = require('path')

process.env.NODE_EXTRA_CA_CERTS= path.resolve(__dirname, 'dir', 'with', 'certs')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const bot = new TelegramBot(process.env.API_KEY_TG_BOT, {
    polling: true
});

const gigaToken = new GigaToken('start', new Date().getTime());

bot.on("polling_error", err => console.log(err.data.error.message));

bot.on('text', async msg => {
    await bot.sendMessage(msg.chat.id, msg.text);
})

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

async function sendImageUrlToGigaChat(imageUrl) {
    try {
        var token = await gigaToken.getToken();
        const response = await axios.post(
            'https://gigachat.devices.sberbank.ru/api/v1/chat/completions', // URL-адрес API
            {
                model: 'GigaChat-Max',
                messages: [
                    {
                        role: "system",
                        content: "Ты - профессиональный повар.Ты знаешь все блюда мира и калорийность каждого продукта.\
                        Отвечай только в формате:\
                        Я узнал это блюдо, это <название блюда>. Примерное количество калорий в порции на 100г - <количество калорий>" 
                    },
                    {
                        role: "user",
                        content: imageUrl 
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