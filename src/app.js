const {App} = require('@slack/bolt');
import {typeOfDishes, dishes} from "./objectsDishes";
import {getOptionObject} from "./getOptionObject";

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
    // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
    // you still need to listen on some port!
    port: process.env.PORT || 3000
});

// Listens to incoming messages that contain "hello"
app.message('hello', async ({say}) => {
    // say() sends a message to the channel where the event was triggered
    await say({
        blocks: [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Pick type of eat"
                },
                "accessory": {
                    "type": "static_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select type",
                        "emoji": true
                    },
                    "options": getOptionObject(typeOfDishes),
                    "action_id": "static_select-action"
                }
            }
        ],
    });
});

app.action('static_select-action', async ({body, ack, say}) => {
    // Acknowledge the action
    await ack();
    const typeOfDish = body.actions[0].selected_option.value;

    await say(`<@${body.user.id}> picked the ${typeOfDish}`);

    const optionDishes = getOptionObject(dishes[typeOfDish])
    await say({
        blocks: [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Pick type of eat"
                },
                "accessory": {
                    "type": "static_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select type",
                        "emoji": true
                    },
                    "options": optionDishes,
                    "action_id": "order"
                }
            }
        ],
    })
});

app.action('order', async ({body, ack, say}) => {
    // Acknowledge the action
    await ack();
    await say(`<@${body.user.id}> order the ${body.actions[0].selected_option.value}`)
});

(async () => {
    // Start your app
    await app.start();

    console.log('⚡️ Bolt app is running!');
})();