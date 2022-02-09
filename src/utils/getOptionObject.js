export const getOptionObject = (obj) => {
    const option = [];
    for (let prop in obj) {
        option.push({
            "text": {
                "type": "plain_text",
                "text": prop,
                "emoji": true
            },
            "value": prop
        });
    }
    return option
}

export const getOptionTypeDishes = (typeDishes) => {
    const option = [];
    const keys = Object.keys(typeDishes)
    keys.map(key => option.push({
        "text": {
            "type": "plain_text",
            "text": key,
            "emoji": true
        },
        "value": key
    }))
    return option
}

export const getOptionDishes = (typeDishes, key) => {
    const option = [];
    typeDishes[key].map(dish => option.push({
        "text": {
            "type": "plain_text",
            "text": dish,
            "emoji": true
        },
        "value": dish
    }));
    return option
}