import {SLACK_APP_TOKEN, SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET} from "./constants";

const {App} = require('@slack/bolt');
import {dishes, typeDishes} from "./objectsDishes";
import {getOptionDishes, getOptionObject, getOptionTypeDishes} from "./getOptionObject";
import {getPriceOrder} from "./getPriceOrder";

const app = new App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: SLACK_APP_TOKEN,
    port: process.env.PORT || 3000
});


app.message('hello', async ({say}) => {
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
                    "options": getOptionTypeDishes(typeDishes),
                    "action_id": "static_select-action"
                }
            }
        ],
    });
});

app.action('static_select-action', async ({body, ack, client}) => {
    await ack();
    const typeOfDish = body.actions[0].selected_option.value;

    await client.views.open({
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
                        "options": getOptionDishes(typeDishes, typeOfDish),
                        "action_id": "order"
                    }
                }
            ]
        }
    });

});

// app.action('order', async ({ack, body, client}) => {
//     await ack;
//     const keysOrder = Object.keys(body.view.state.values)
//     const orders = body.view.state.values[keysOrder]['order']['selected_options']
//     const price = getPriceOrder(orders, dishes);
//
//     console.log(price)
//     await client.views.push({
//         trigger_id: body.trigger_id,
//         view: {
//             type: "modal",
//             callback_id: "view_2",
//             title: {
//                 type: 'plain_text',
//                 text: 'Modal title'
//             },
//             blocks: [
//                 {
//                     type: 'section',
//                     text: {
//                         type: 'mrkdwn',
//                         text: `Price ${price}`
//                     },
//                     accessory: {
//                         type: 'button',
//                         text: {
//                             type: 'plain_text',
//                             text: 'Click me!'
//                         },
//                         action_id: 'button_abc'
//                     }
//                 }
//             ]
//         }
//     })
// });

app.view('view_1', async ({ack, body, view, client, logger}) => {
    await ack;
    const keysOrder = Object.keys(view.state.values)
    const orders = view.state.values[keysOrder]['order']['selected_options']
    console.log(orders)
    console.log(body.trigger_id)

    try {
        await client.chat.postMessage({
            channel: 'C0319SBGSJ2',
            text: `<@${body.user.id}> order the ${orders.map(order => order.value + ' ')}`
        })
    } catch (error) {
        logger.error(error)
    }
});

// Notification about orders in channel oder
// app.view('view_1', async ({ack, body, view, client, logger}) => {
//     await ack;
//     const keysOrder = Object.keys(view.state.values)
//     const orders = view.state.values[keysOrder]['order']['selected_options']
//
//     try {
//         await client.chat.postMessage({
//             channel: 'C0319SBGSJ2',
//             text: `<@${body.user.id}> order the ${orders.map(order => order.value + ' ')}`
//         })
//     } catch (error) {
//         logger.error(error)
//     }
// });

(async () => {
    // Start your app
    await app.start();
    console.log('⚡️ Bolt app is running!');
})();