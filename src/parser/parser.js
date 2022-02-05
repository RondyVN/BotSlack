const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://glovoapp.com/ua/ru/ivano-frankovsk/p-yatnytsia/').then(data => {
    const $ = cheerio.load(data.data);
    let text = '';
    $('#default-wrapper > div > section > div.container.store__container > div > div > div.store__page__body > div:nth-child(3) > div > div > div.list__container > div:nth-child(1) > div > a > div > div.card__content > div > div').each((i, element) => {
        text += `${$(element).text()}\n`
    })

    console.log(text);
});