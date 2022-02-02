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