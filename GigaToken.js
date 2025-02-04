const axios = require('axios');

module.exports = class GigaToken {
    constructor(token, expireTime) {
        this.token = token;
        this.expireTime = expireTime
        this.apiKeyURL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth'
    }

    async getToken() {
        var currentDate = new Date().getTime();

        console.log('d1 = ' + currentDate + ' d2 = ' + this.expireTime);
        if (currentDate >= this.expireTime) {
            await this.getNewToken();
        }
        return this.token;
    }

    async getNewToken() {
        try {
            const response = await axios.post(
                this.apiKeyURL,
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
            console.log('New token is received!');
            this.token = response.data.access_token;
            this.expireTime = response.data.expires_at;
        } catch (error) {
            console.log(error);
        }
    }
}