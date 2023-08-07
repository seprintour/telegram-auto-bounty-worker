/**
 * All console.log for debugging the worker on cloudflare dashboard
 */

import { completeGPT3 } from "./helpers/chatGPT"
import { createIssue } from "./helpers/github"
import { isGreeting } from "./helpers/greetings"
import { cleanMessage, escapeMarkdown, extractTag, extractTaskInfo, generateMessageLink, getRepoData } from "./helpers/utils"

/**
 * Wait for requests to the worker
 */
addEventListener('fetch', event =>
{
	const url = new URL(event.request.url)
	if (url.pathname === WEBHOOK)
	{
		event.respondWith(handleWebhook(event))
	} else if (url.pathname === '/registerWebhook')
	{
		event.respondWith(registerWebhook(event, url, WEBHOOK, SECRET))
	} else if (url.pathname === '/unRegisterWebhook')
	{
		event.respondWith(unRegisterWebhook(event))
	} else
	{
		event.respondWith(new Response('No handler for this request'))
	}
})

/**
 * Handle requests to WEBHOOK
 * https://core.telegram.org/bots/api#update
 */
const handleWebhook = async (event) =>
{
	// Check secret
	if (event.request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== SECRET)
	{
		return new Response('Unauthorized', { status: 403 })
	}

	// Read request body synchronously
	const update = await event.request.json()
	// Deal with response asynchronously
	event.waitUntil(onUpdate(update))

	return new Response('Ok')
}

/**
 * Handle incoming Update
 * supports messages and callback queries (inline button presses)
 * https://core.telegram.org/bots/api#update
 */
const onUpdate = async (update) =>
{
	if ('message' in update)
	{
		try
		{
			await onMessage(update.message)
		} catch (e)
		{
			console.log(e)
		}
	}

	if ('callback_query' in update)
	{
		await onCallbackQuery(update.callback_query)
	}
}

/**
 * Set webhook to this worker's url
 * https://core.telegram.org/bots/api#setwebhook
 */
const registerWebhook = async (event, requestUrl, suffix, secret) =>
{
	// https://core.telegram.org/bots/api#setwebhook
	const webhookUrl = `${requestUrl.protocol}//${requestUrl.hostname}${suffix}`
	const r = await (await fetch(apiUrl('setWebhook', { url: webhookUrl, secret_token: secret }))).json()
	return new Response('ok' in r && r.ok ? 'Ok' : JSON.stringify(r, null, 2))
}

/**
 * Remove webhook
 * https://core.telegram.org/bots/api#setwebhook
 */
const unRegisterWebhook = async (event) =>
{
	const r = await (await fetch(apiUrl('setWebhook', { url: '' }))).json()
	return new Response('ok' in r && r.ok ? 'Ok' : JSON.stringify(r, null, 2))
}

/**
 * Return url to telegram api, optionally with parameters added
 */
const apiUrl = (methodName, params = null) =>
{
	let query = ''
	if (params)
	{
		query = '?' + new URLSearchParams(params).toString()
	}
	return `https://api.telegram.org/bot${TOKEN}/${methodName}${query}`
}

/**
 * Answer callback query (inline button press)
 * This stops the loading indicator on the button and optionally shows a message
 * https://core.telegram.org/bots/api#sendmessage
 */
async function answerCallbackQuery(callbackQueryId, text = null)
{
	const data = {
		callback_query_id: callbackQueryId
	}
	if (text)
	{
		data.text = text
	}
	return (await fetch(apiUrl('answerCallbackQuery', data))).json()
}

/**
 * Handle incoming callback_query (inline button press)
 * https://core.telegram.org/bots/api#message
 */
async function onCallbackQuery(callbackQuery)
{
	if (callbackQuery.data !== "create_task")
	{
		console.log('Not a create task callback')
		return
	}
	const groupId = message.chat.id; // group id
	const messageId = message.message.message_id;
	//const senderId = message.from.id

	// get message link
	const messageLink = generateMessageLink(messageId, groupId);

	const taskInfo = extractTaskInfo(callbackQuery.message.text)

	const res = await createIssue(timeEstimate, orgName, repoName, issueTitle, msgText, messageLink)

	console.log(`Issue created: ${res.html_url}`);


	const { repoName, orgName } = getRepoData(groupId);

	console.log(`Check: ${issueTitle}, ${timeEstimate} ${orgName}:${repoName}`);

	if (!repoName || !orgName)
	{
		console.log(`No Github data mapped to channel`);
		return;
	}

	const msg = escapeMarkdown(`*Issue created: [Check it out here](${res.html_url})* with time estimate *${timeEstimate}*`, '*`[]()');

	await editBotMessage(callbackQuery.message.chat.id, callbackQuery.message.message_id, escapeMarkdown(`You pressed the button with data=\`${callbackQuery.data}\``, '`'))
	return answerCallbackQuery(callbackQuery.id, 'Button press acknowledged!')
}

/**
 * Send text message formatted with MarkdownV2-style
 * Keep in mind that any markdown characters _*[]()~`>#+-=|{}.! that
 * are not part of your formatting must be escaped. Incorrectly escaped
 * messages will not be sent. See escapeMarkdown()
 * https://core.telegram.org/bots/api#sendmessage
 */
const sendReply = async (
	chatId,
	messageId,
	text
) =>
{
	return (await fetch(apiUrl('sendMessage', {
		chat_id: chatId,
		text,
		parse_mode: 'MarkdownV2',
		reply_to_message_id: messageId,
		reply_markup: JSON.stringify({
			inline_keyboard:
				[[
					{
						text: 'Create Task',
						callback_data: `create_task`
					}
				]]
		}),
	}))).json()
}

async function editBotMessage(chatId, messageId, newText)
{
	try
	{
		const response = await fetch(apiUrl('editMessageText', {
			chat_id: chatId,
			message_id: messageId,
			text: newText,
			parse_mode: 'MarkdownV2',
		}));
		return response.json();
	} catch (error)
	{
		console.error('Error editing message:', error);
		return null;
	}
}

/**
 * Handle incoming Message
 * https://core.telegram.org/bots/api#message
 */
const onMessage = async (message) =>
{
	console.log(`Received message: ${message.text}`);

	// check if its a greeting or blacklisted word to save chatgpt calls
	const greetings = isGreeting(message.text);

	if (greetings)
	{
		console.log(`Skipping, message is excluded from check`);
		console.log(message)
		return;
	}

	const msgText = cleanMessage(message.text);

	if (msgText === "")
	{
		console.log(`Skipping, message is empty`);
		console.log(message)
		return;
	}

	// Analyze the message with ChatGPT
	const { issueTitle, timeEstimate } = await completeGPT3(msgText);

	if (!issueTitle)
	{
		console.log(`No valid task found`);
		return;
	}

	const groupId = message.chat.id; // group id
	const messageId = message.message_id;
	//const senderId = message.from.id

	if (issueTitle)
	{
		return sendReply(
			groupId,
			messageId,
			escapeMarkdown(`Click confirm to create new task *"${issueTitle}"* on [@${orgName}/${repoName}](https://github.com/${orgName}/${repoName}) with time estimate *${timeEstimate}*`, '*`[]()@/')
		)
	}
}
