import {SLACK_APP_TOKEN, SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET} from "./constants";

const {App} = require('@slack/bolt');
import {dishes, typeDishes} from "./objectsDishes";
import {getOptionDishes, getOptionTypeDishes} from "./getOptionObject";
import {pars} from "./parser/parser";
import {WorkflowStep} from "@slack/bolt";

const app = new App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: SLACK_APP_TOKEN,
    port: process.env.PORT || 3000
});


// Try setting workflow
// app.message('hello', async ({ message, say }) => {
//     // say() sends a message to the channel where the event was triggered
//     await say({
//         blocks: [
//             {
//                 "type": "section",
//                 "text": {
//                     "type": "mrkdwn",
//                     "text": `Hey there <@${message.user}>!`
//                 },
//                 "accessory": {
//                     "type": "button",
//                     "text": {
//                         "type": "plain_text",
//                         "text": "Click Me"
//                     },
//                     "action_id": "button_click"
//                 }
//             }
//         ],
//         text: `Hey there <@${message.user}>!`
//     });
// });
//
// app.action('button_click', async ({ body, ack, say, logger, client}) => {
//     // Acknowledge the action
//     await ack();
//
//     try {
//         // Call views.open with the built-in client
//         const result = await client.views.open({
//             // Pass a valid trigger_id within 3 seconds of receiving it
//             trigger_id: body.trigger_id,
//             // View payload
//             view: {
//                 type: 'modal',
//                 // View identifier
//                 callback_id: 'view_1',
//                 title: {
//                     type: 'plain_text',
//                     text: 'Modal title'
//                 },
//                 blocks: [
//                     {
//                         type: 'section',
//                         text: {
//                             type: 'mrkdwn',
//                             text: 'Welcome to a modal with _blocks_'
//                         },
//                         accessory: {
//                             type: 'button',
//                             text: {
//                                 type: 'plain_text',
//                                 text: 'Click me!'
//                             },
//                             action_id: 'button_abc'
//                         }
//                     },
//                     {
//                         type: 'input',
//                         block_id: 'input_c',
//                         label: {
//                             type: 'plain_text',
//                             text: 'What are your hopes and dreams?'
//                         },
//                         element: {
//                             type: 'plain_text_input',
//                             action_id: 'dreamy_input',
//                             multiline: true
//                         }
//                     }
//                 ],
//                 submit: {
//                     type: 'plain_text',
//                     text: 'Submit'
//                 }
//             }
//         });
//         logger.info(result);
//     }
//     catch (error) {
//         logger.error(error);
//     }
//
// });
//
//
// const ws = new WorkflowStep('add_task', {
//     edit: async ({ ack, step, configure }) => { },
//     save: async ({ ack, step, view, update }) => {
//         await ack();
//
//         const { values } = view.state;
//         const taskName = values.task_name_input.name;
//         const taskDescription = values.task_description_input.description;
//
//         const inputs = {
//             taskName: { value: taskName.value },
//             taskDescription: { value: taskDescription.value }
//         };
//
//         const outputs = [
//             {
//                 type: 'text',
//                 name: 'taskName',
//                 label: 'Task name',
//             },
//             {
//                 type: 'text',
//                 name: 'taskDescription',
//                 label: 'Task description',
//             }
//         ];
//
//         await update({ inputs, outputs });
//     },
//     execute: async ({ step, complete, fail }) => { },
// });
const channelOrder = "C0319SBGSJ2"

const today = new Date()
today.setDate(today.getDate())
today.setHours(15, 11, 0)

const notificationUnixConvert = today.getTime().toString().slice(0, 10)

app.message('start', async ({message, client, logger}) => {

    console.log(notificationUnixConvert)
    try {
        // Call chat.scheduleMessage with the built-in client
        const result = await client.chat.scheduleMessage({
            channel: channelOrder,
            post_at: notificationUnixConvert,
            text: 'Summer has come and passed'
        });
    } catch (error) {
        logger.error(error);
    }
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
                text: 'П\'ятниця'
            },
            // submit: {
            //     type: "plain_text",
            //     text: "Order"
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
                        image_url: 'https://www.wall-art.de/out/pictures/generated/product/2/780_780_80/4512-wandtattoo-bon-appetit-web-einzel.jpg',
                        alt_text: 'Замовлення отримано'
                    }
                ]
            }
        })
        await client.chat.postMessage({
            channel: 'C0319SBGSJ2',
            text: `<@${body.user.id}> ordered ${order}`
        })
    } catch (error) {
        logger.error(error)
    }
});

(async () => {
    // Start your app
    // await pars()
    await app.start();
    console.log('⚡️ Bolt app is running!');
})();