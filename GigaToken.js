const axios = require('axios');

//Класс для получения нового токена для доступа к API ГигаЧата
module.exports = class GigaToken {
    constructor(token, expireTime) {
        this.token = token; //Сам токен
        this.expireTime = expireTime; //Время, после которго токен перестает быть действительным (типа срока голности)
        this.apiKeyURL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth'; //Ссылка, по котороый нужно получать токен
    }

    //Метод получения токена
    async getToken() {
        var currentDate = new Date().getTime(); //Узнаем текущую дату и время

        console.log('d1 = ' + currentDate + ' d2 = ' + this.expireTime); //Выводим в лог текущую дату и срок годности
        if (currentDate >= this.expireTime) { //Сравниваем, если срок годности истек
            await this.getNewToken(); //Получаем новый токен
        }
        return this.token; //Возвращаем уже имеющийся у нас токен
    }

    //Метод отправки запроса на получение токена
    async getNewToken() {
        try {
            const response = await axios.post(//Отправляем POST запрос в гигаЧат с параметрами ниже
                this.apiKeyURL, //Адрес, куда отправляем запрос
                //Параметры запроса взяты с сайта с документацией по гигаЧату
                {
                    scope: 'GIGACHAT_API_PERS'
                },
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json',
                        'RqUID': '43235d8e-f2a7-40c7-8c07-ab343b5b08e5',
                        'Authorization': 'Basic ' + process.env.GIGA_AUTH_KEY
                    }
                }
            );
            console.log('New token is received!'); //Вывод в лог сообщения о том, что новый токен получен
            this.token = response.data.access_token; //Меняем старый токен на новый
            this.expireTime = response.data.expires_at; //Обновляем срок годности
        } catch (error) {
            console.log(error); //Вывод в лог ошибки
        }
    }
}