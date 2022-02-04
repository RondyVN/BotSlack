import {SLACK_APP_TOKEN, SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET} from "./constants";

const {App} = require('@slack/bolt');
import {typeOfDishes, dishes} from "./objectsDishes";
import {getOptionObject} from "./getOptionObject";

const app = new App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: SLACK_APP_TOKEN,
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

app.action('static_select-action', async ({body, ack, client}) => {
    // Acknowledge the action
    await ack();
    const typeOfDish = body.actions[0].selected_option.value;

    // await say(`<@${body.user.id}> picked the ${typeOfDish}`);

    //const optionDishes = getOptionObject(dishes[typeOfDish])

    await client.views.open({
        // Pass a valid trigger_id within 3 seconds of receiving it
        trigger_id: body.trigger_id,
        // View payload
        view: {
            type: 'modal',
            // View identifier
            callback_id: 'view_1',
            title: {
                type: 'plain_text',
                text: 'Order dishes'
            },
            submit: {
                type: 'plain_text',
                text: 'Submit',
            },
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "Choose a dish to order"
                    },
                    "accessory": {
                        "type": "multi_static_select",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "Select an item",
                            "emoji": true
                        },
                        "options": getOptionObject(dishes[typeOfDish]),
                        "action_id": "order"
                    }
                }
            ]
        }
    });

    //logger.info(result)

    // await say({
    //     blocks: [
    //         {
    //             "type": "section",
    //             "text": {
    //                 "type": "mrkdwn",
    //                 "text": "Pick type of eat"
    //             },
    //             "accessory": {
    //                 "type": "static_select",
    //                 "placeholder": {
    //                     "type": "plain_text",
    //                     "text": "Select type",
    //                     "emoji": true
    //                 },
    //                 "options": optionDishes,
    //                 "action_id": "order"
    //             }
    //         }
    //     ],
    // })
});

app.view('view_1', async ({ack, body, view, client, logger}) => {
    await ack;
    const keysOrder = Object.keys(view.state.values)
    console.log(view.state.values[keysOrder]['order']['selected_options'])
    const orders = view.state.values[keysOrder]['order']['selected_options']

    try {
        await client.chat.postMessage({
            channel: 'C0319SBGSJ2',
            text: `<@${body.user.id}> order the ${orders.map(order => order.value + ' ')}`
        })
    }
    catch (error){
        logger.error(error)
    }
});

// app.action('order', async ({ack, client, body}) => {
//     await ack;
//     await client.chat.postMessage({
//         channel: 'C0319SBGSJ2',
//         text: `<@${body.user.id}> order ${body.actions[0].selected_option.value}`
//     })
// });

// app.action('order', async ({body, ack, client}) => {
//     // Acknowledge the action
//     await ack();
//     const typeOfDish = body.actions[0].selected_option;
//     const result = await client.views.update({
//         view_id: body.view.id,
//         // Pass the current hash to avoid race conditions
//         hash: body.view.hash,
//         view: {
//             type: 'modal',
//             // View identifier
//             callback_id: 'view_1',
//             title: {
//                 type: 'plain_text',
//                 text: 'Modal title'
//             },
//             "blocks": [
//                 {
//                     "type": "section",
//                     "text": {
//                         "type": "mrkdwn",
//                         "text": "This is a section block with an accessory image."
//                     },
//                     "accessory": {
//                         "type": "image",
//                         "image_url": "https://assets.misteram.com.ua/misteram-public/b1a88a19a4d7bd3b41703ce1ba99802e-826x0.png",
//                         "alt_text": "cute cat"
//                     }
//                 },
//             ]
//         }
//     })
//     //await say(`<@${body.user.id}> order the ${body.actions[0].selected_option.value}`)
// });

(async () => {
    // Start your app
    await app.start();
    console.log('⚡️ Bolt app is running!');
})();