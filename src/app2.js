const {App, WorkflowStep} = require("@slack/bolt");
const {SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_APP_TOKEN} = require("./constants");
const {getOptionTypeDishes, getOptionDishes} = require("./utils/getOptionObject");
const typeDishes = require("../typeDishesDate.json");
const dishes = require("../allDishesDate.json");


const app = new App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: SLACK_APP_TOKEN,
    port: process.env.PORT || 3000
});


const ws = new WorkflowStep("test_step", {
    edit: async ({ ack, step, configure }) => {
        await ack();
        console.log('hello edit')
        const blocks = [
            {
                type: 'input',
                block_id: 'task_name_input',
                element: {
                    type: 'plain_text_input',
                    action_id: 'name',
                    placeholder: {
                        type: 'plain_text',
                        text: 'Add a task name',
                    },
                },
                label: {
                    type: 'plain_text',
                    text: 'Task name',
                },
            },
            {
                type: 'input',
                block_id: 'task_description_input',
                element: {
                    type: 'plain_text_input',
                    action_id: 'description',
                    placeholder: {
                        type: 'plain_text',
                        text: 'Add a task description',
                    },
                },
                label: {
                    type: 'plain_text',
                    text: 'Task description',
                },
            },
        ];

        await configure({ blocks });
    },
    save: async ({ ack, step, view, update }) => {
        await ack();
        console.log('hello save')

        const { values } = view.state;
        const taskName = values.task_name_input.name;
        const taskDescription = values.task_description_input.description;

        const inputs = {
            taskName: { value: taskName.value },
            taskDescription: { value: taskDescription.value }
        };

        const outputs = [
            {
                type: 'text',
                name: 'taskName',
                label: 'Task name',
            },
            {
                type: 'text',
                name: 'taskDescription',
                label: 'Task description',
            }
        ];

        await update({ inputs, outputs });
    },
    execute: async ({ step, complete, fail , client, message}) => {
        const { inputs } = step;

        await client.chat.postMessage({
            channel: 'C03122MEV46',
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
        })

        const outputs = {
            taskName: inputs.taskName.value,
            taskDescription: inputs.taskDescription.value,
        };

        // signal back to Slack that everything was successful
        console.log(inputs.taskName.value)
        console.log(inputs.taskDescription.value)
        await complete({ outputs });
        // NOTE: If you run your app with processBeforeResponse: true option,
        // `await complete()` is not recommended because of the slow response of the API endpoint
        // which could result in not responding to the Slack Events API within the required 3 seconds
        // instead, use:
        // complete({ outputs }).then(() => { console.log('workflow step execution complete registered'); });

        // let Slack know if something went wrong
        // await fail({ error: { message: "Just testing step failure!" } });
        // NOTE: If you run your app with processBeforeResponse: true, use this instead:
        // fail({ error: { message: "Just testing step failure!" } }).then(() => { console.log('workflow step execution failure registered'); });
    },
});

app.step(ws);

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