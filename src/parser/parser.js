const axios = require('axios');
const cheerio = require('cheerio');
const fs = require("fs");
const URL = 'https://glovoapp.com'

const writeJson = (nameFile, obj) => {
    fs.writeFile(nameFile, JSON.stringify(obj), (err) => {
        if (err) console.log('Error')
    })
}

export const pars = async () => {
    try {
        const urls = []
        const typeDishes = []
        await axios.get('https://glovoapp.com/ua/ru/ivano-frankovsk/p-yatnytsia/')
            .then(res => res.data)
            .then(res => {
                const html = res;
                const $ = cheerio.load(html);
                $('#default-wrapper > div > section > div.container.store__container > div > div > div.store__page__body > div:nth-child(3) > div > div > div.list__container > div > div > a').each((index, element) => {
                    typeDishes.push($(element).text().trim())
                    // typeDishes[$(element).text().trim()] = []
                    urls.push(URL + $(element).attr('href'))
                })

            })
        // console.log(typeDishes)

        const dishesAndTypeDishes = {}
        const allDishes = {}

        for (let i = 0; i < urls.length; i++) {
            const dishes = []
            await axios.get(urls[i])
                .then(res => res.data)
                .then(res => {
                    const html = res;
                    const $ = cheerio.load(html);

                    $(html).find('div.product-row').each((index, element) => {
                        const nameDishes = $(element).find('div[class="product-row__name"]').text().trim()
                        const price = $(element).find('div[class="product-price product-row__price layout-vertical-tablet"]').text().trim().replace(/грн./, '').replace(/,/, '.')
                        const image = $(element).find('img.product-row__image').attr('src')
                        const description = $(element).find('span[data-test-id="product-row-description__highlighter"]').text().trim().replace(/\n/g,' ');
                        console.log(description)

                        dishes.push(nameDishes)

                        allDishes[nameDishes] = {
                            "price": +price,
                            "image": `${!image
                                ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAMFBMVEXp7vG6vsG3u77s8fTCxsnn7O/f5OfFyczP09bM0dO8wMPk6ezY3eDd4uXR1tnJzdBvAX/cAAACVElEQVR4nO3b23KDIBRA0ShGU0n0//+2KmO94gWZ8Zxmr7fmwWEHJsJUHw8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwO1MHHdn+L3rIoK6eshsNJ8kTaJI07fERPOO1Nc1vgQm2oiBTWJ+d8+CqV1heplLzMRNonED+4mg7L6p591FC+133/xCRNCtd3nL9BlxWP++MOaXFdEXFjZ7r8D9l45C8y6aG0cWtP/SUGhs2d8dA/ZfGgrzYX+TVqcTNRRO9l+fS5eSYzQs85psUcuzk6igcLoHPz2J8gvzWaH/JLS+95RfOD8o1p5CU5R7l5LkfKEp0mQ1UX7hsVXqDpRrifILD/3S9CfmlUQFhQfuFu0STTyJ8gsP3PH7GVxN1FC4t2sbBy4TNRTu7LyHJbqaqKFw+/Q0ncFloo7CjRPwMnCWqKXQZ75El4nKC9dmcJaou9AXOE5UXbi+RGeJygrz8Uf+GewSn9uXuplnWDZJ7d8f24F/s6iq0LYf9olbS3Q8i5oKrRu4S9ybwaQ/aCkqtP3I28QDgeoK7TBya/aXqL5COx67PTCD2grtdOwH+pQV2r0a7YVBgZoKwwIVFQYG6ikMDVRTGByopjD8ATcKb0UhhRTe77sKs2DV7FKSjId18TUEBYVyLhUThWfILHTDqmI85/2RWWjcE/bhP6OD7maT3h20MHsA47JC3PsW0wcwLhv9t0OOPOIkCn21y2bXXwlyylxiYMPk1SuCSmpfK8bNQvIrpAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwNX4BCbAju9/X67UAAAAASUVORK5CYII='
                                : image
                            }`,
                            "description": description
                        }

                    })
                })
            dishesAndTypeDishes[typeDishes[i]] = dishes
            console.log(`Pages downloaded ${i + 1}/${urls.length}`)
        }

        writeJson('typeDishesDate.json', dishesAndTypeDishes)
        writeJson('allDishesDate.json', allDishes)
        console.log("Done!")

    } catch (error) {
        console.log(`Error - ${error}`)
    }
}
