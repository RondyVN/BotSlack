import {SLACK_APP_TOKEN, SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET} from "./constants";

const {App} = require('@slack/bolt');
import {dishes, typeDishes} from "./objectsDishes";
import {getOptionDishes, getOptionTypeDishes} from "./getOptionObject";
import {pars} from "./parser/parser";

pars()

const app = new App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: SLACK_APP_TOKEN,
    port: process.env.PORT || 3000
});


app.message('hello', async ({say}) => {
    console.log('Hello')
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
                text: 'П\'ятниця'
            },
            // submit: {
            //     type: 'plain_text',
            //     text: 'Submit',
            // },
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "Choose a dish to order"
                    },
                    "accessory": {
                        "type": "static_select",
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

app.action('order', async ({ack, body, client}) => {
    await ack;
    const keysOrder = Object.keys(body.view.state.values)
    const order = body.view.state.values[keysOrder]['order']['selected_option']['value']
    // console.log(body.view.state.values[keysOrder]['order']['selected_option']['value'])
    const price = dishes[order]['price'];// getPriceOrder(order, dishes);

    // console.log(price)
    await client.views.push({
        trigger_id: body.trigger_id,
        view: {
            type: "modal",
            callback_id: "view_2",
            title: {
                type: 'plain_text',
                text: 'П\'ятниця'
            },
            // submit: {
            //     type: 'plain_text',
            //     text: 'Submit',
            // },
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `Вартість: ${price} грн\n ${order}`
                    },
                    "accessory": {
                        "type": "image",
                        "image_url": dishes[order]['image'],
                        "alt_text": "cute cat",
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "Ви бажаєте зробити замовлення?"
                    },
                    "accessory": {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Так",
                            "emoji": true
                        },
                        "value": order,
                        "action_id": "confirm_order"
                    }
                }
            ]
        }
    })
});

app.action('confirm_order', async ({ack, body, client, logger}) => {
    await ack;
    const order = body.actions[0]['value']
    console.log(order)

    try {
        await client.views.update({
            view_id: body.view.id,
            hash: body.view.hash,

            view: {
                type: 'modal',
                // View identifier
                callback_id: 'view_3',
                title: {
                    type: 'plain_text',
                    text: 'Замовлення страв'
                },
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'plain_text',
                            text: 'Замовлення отримано'
                        }
                    },
                    {
                        type: 'image',
                        image_url: 'https://media.giphy.com/media/SVZGEcYt7brkFUyU90/giphy.gif',
                        alt_text: 'Замовлення отримано'
                    }
                ]
            }
        })
        await client.chat.postMessage({
            channel: 'C0319SBGSJ2',
            text: `<@${body.user.id}> order the ${order}`
        })
    } catch (error) {
        logger.error(error)
    }
});

// Modal with price
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

// Testing Modal
// app.view('view_1', async ({ack, body, view, client, logger}) => {
//     await ack;
//     const keysOrder = Object.keys(view.state.values)
//     const order = view.state.values[keysOrder]['order']['selected_option']['value']
//     // console.log(order)
//     // console.log(body.trigger_id)
//
//     try {
//         await client.chat.postMessage({
//             channel: 'C0319SBGSJ2',
//             text: `<@${body.user.id}> order the ${order}`
//         })
//     } catch (error) {
//         logger.error(error)
//     }
// });

// Notification about orders in channel oder(Multi select)
// app.view('view_1', async ({ack, body, view, client, logger}) => {
//     await ack;
//     const keysOrder = Object.keys(view.state.values)
//     const orders = view.state.values[keysOrder]['order']['selected_options']['value']
//
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