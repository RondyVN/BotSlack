const {App, WorkflowStep} = require("@slack/bolt");
const {SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_APP_TOKEN} = require("./constants");
const {getOptionTypeDishes, getOptionDishes} = require("./utils/getOptionObject");
const typeDishes = require("../typeDishesDate.json");
const dishes = require("../allDishesDate.json");
const {pars} = require("./parser/parser");
const {writeJson} = require("./utils/writeJSON");



const app = new App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: SLACK_APP_TOKEN,
    port: process.env.PORT || 3000
});

const ws = new WorkflowStep("test_step", {
    edit: async ({ack, step, configure}) => {
        await ack();
        console.log('hello edit')
        const blocks = [
            {
                type: 'input',
                block_id: 'channel_order',
                element: {
                    type: 'channels_select',
                    action_id: 'channel',
                    placeholder: {
                        type: 'plain_text',
                        text: 'Choose channel',
                    },
                },
                label: {
                    type: 'plain_text',
                    text: 'Add a channel for order',
                },
            },
            {
                type: 'input',
                block_id: 'channel_accept_order',
                element: {
                    type: 'channels_select',
                    action_id: 'channel',
                    placeholder: {
                        type: 'plain_text',
                        text: 'Choose channel',
                    },
                },
                label: {
                    type: 'plain_text',
                    text: 'Add a channel for accept order',
                },
            },
        ];

        await configure({blocks});
    },
    save: async ({ack, step, view, update}) => {
        await ack();
        console.log('hello save')

        const {values} = view.state;
        console.log(values)
        const nameChannelOrder = values.channel_order.channel;
        const nameChannelAcceptOrder = values.channel_accept_order.channel

        const inputs = {
            nameChannelOrder: {value: nameChannelOrder.selected_channel},
            nameChannelAcceptOrder: {value: nameChannelAcceptOrder.selected_channel}
        };

        const outputs = [
            {
                type: 'text',
                name: 'nameChannelOrder',
                label: 'Channel name for order',
            },
            {
                type: 'text',
                name: 'nameChannelAcceptOrder',
                label: 'Channel name for order accept',
            }
        ];

        await update({inputs, outputs});
    },
    execute: async ({step, complete, fail, client, message}) => {
        const {inputs} = step;
        const channelForOrder = inputs.nameChannelOrder.value;
        const channelForAcceptOrder = inputs.nameChannelAcceptOrder.value;

        await client.chat.postMessage({
            channel: channelForOrder,
            blocks: [
                {
                    "type": "section",
                    "block_id": channelForAcceptOrder,
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
                    },
                },
            ],
        })

        const outputs = {
            nameChannelOrder: channelForOrder,
            nameChannelAcceptOrder: channelForAcceptOrder
        };

        writeJson('channels.json', outputs)
        // signal back to Slack that everything was successful
        await complete({outputs});
        // NOTE: If you run your app with processBeforeResponse: true option,
        // `await complete()` is not recommended because of the slow response of the API endpoint
        // which could result in not responding to the Slack Events API within the required 3 seconds
        // instead, use:
        // complete({ outputs }).then(() => { console.log('workflow step execution complete registered'); });

        // let Slack know if something went wrong
        // await fail({ error: { message: "Just testing step failure!" } });
        // NOTE: If you run your app with processBeforeResponse: true, use this instead:
        // fail({ error: { message: "Just testing step failure!" } }).then(() => { console.log('workflow step execution failure registered'); });
    }
});

app.step(ws);

app.action('static_select-action', async ({body, ack, client}) => {
    await ack();
    // console.log(body.message.blocks[0].block_id)
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
                    "block_id": body.message.blocks[0].block_id,
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
    const price = dishes[order]['price'];

    console.log(body.user.username)

    const creds = require('./test-folder-341016-5454c87c8c36.json');
    const {GoogleSpreadsheet} = require('google-spreadsheet');

// Initialize the sheet - doc ID is the long id in the sheets URL
    const doc = new GoogleSpreadsheet('1FkrcwCSpz8k9mUGqZK6J96RSn_oSxkbo1SzgRcknX8I');
    await doc.useServiceAccountAuth(creds);

// Initialize Auth - see https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
    await doc.useServiceAccountAuth({
        // env var values are copied from service account credentials generated by google
        // see "Authentication" section in docs for more info
        client_email: creds.client_email,
        private_key: creds.private_key,
    });

    await doc.useServiceAccountAuth(creds, 'customer@test-folder-341016.iam.gserviceaccount.com');

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[1]

    const rows = await sheet.getRows()

    const customer = rows.filter((row) => row['Login slack'].includes(body.user.username))

    const customerMoney = customer[0]['Money']

    let footerOption = {}
    if (customerMoney > price) {
        footerOption = {
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
    }
    else {
        footerOption = {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "У вас не достатнь грошей"
            },
        }
    }
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
                    block_id: body.actions[0].block_id,
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `Баланс: ${customerMoney}\n Вартість: ${price} грн\n Замовлення: ${order} \n${!dishes[order]['description']
                            ? ''
                            : 'Опис: ' + dishes[order]['description']
                        }`
                    },
                    "accessory": {
                        "type": "image",
                        "image_url": dishes[order]['image'],
                        "alt_text": "cute cat",
                    }
                },
                {
                    "type": "divider"
                },
                footerOption
            ]
        }
    })
});

app.action('confirm_order', async ({ack, body, client, logger}) => {
    await ack;
    const order = body.actions[0]['value']
    const channelForAcceptOrder = body.view.blocks[0].block_id
    // console.log(body.view.blocks[0].block_id)
    const creds = require('./test-folder-341016-5454c87c8c36.json');
    const {GoogleSpreadsheet} = require('google-spreadsheet');

// Initialize the sheet - doc ID is the long id in the sheets URL
    const doc = new GoogleSpreadsheet('1FkrcwCSpz8k9mUGqZK6J96RSn_oSxkbo1SzgRcknX8I');
    await doc.useServiceAccountAuth(creds);

// Initialize Auth - see https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
    await doc.useServiceAccountAuth({
        // env var values are copied from service account credentials generated by google
        // see "Authentication" section in docs for more info
        client_email: creds.client_email,
        private_key: creds.private_key,
    });

    await doc.useServiceAccountAuth(creds, 'customer@test-folder-341016.iam.gserviceaccount.com');

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[1]

    const rows = await sheet.getRows()

    const customer = rows.filter((row) => row['Login slack'].includes(body.user.username))

    const customerMoney = customer[0]['Money']
    customer[0]['Money'] = customerMoney - dishes[order]['price']
    await customer[0].save()
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
            channel: channelForAcceptOrder,
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