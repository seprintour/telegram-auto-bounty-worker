/**
 * All console.log for debugging the worker on cloudflare dashboard
 */

import { completeGPT3 } from "./helpers/chatGPT"
import { createIssue } from "./helpers/github"
import { isGreeting } from "./helpers/greetings"
import { escapeMarkdown, extractTag, getRepoData } from "./helpers/utils"

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
		await onMessage(update.message)
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
 * Send text message formatted with MarkdownV2-style
 * Keep in mind that any markdown characters _*[]()~`>#+-=|{}.! that
 * are not part of your formatting must be escaped. Incorrectly escaped
 * messages will not be sent. See escapeMarkdown()
 * https://core.telegram.org/bots/api#sendmessage
 */
const sendReply = async (chatId, messageId, text) =>
{
	return (await fetch(apiUrl('sendMessage', {
		chat_id: chatId,
		text,
		parse_mode: 'MarkdownV2',
		reply_to_message_id: messageId
	}))).json()
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

	// Analyze the message with ChatGPT
	const { issueTitle, timeEstimate } = await completeGPT3(message.text);

	if (!issueTitle)
	{
		console.log(`No valid task found`);
		return;
	}

	const groupId = message.chat.id; // group id
	const messageId = message.message_id;
	//const senderId = message.from.id

	const { repoName, orgName } = getRepoData(groupId);

	console.log(`Check: ${issueTitle}, ${timeEstimate} ${orgName}:${repoName}`);

	if (!repoName || !orgName)
	{
		console.log(`No Github data mapped to channel`);
		return;
	}

	const res = await createIssue(timeEstimate, orgName, repoName, issueTitle, 'Auto-generated from telegram channel')

	console.log(`Issue created: ${res.html_url}`);

	const taggedUser = extractTag(message.text)

	if (issueTitle && res.html_url)
	{
		return sendReply(groupId, messageId, escapeMarkdown(`${taggedUser + ' ' || ''}*Issue created: [Check it out here](${res.html_url})* with time estimate *${timeEstimate}*`, '*`[]()'))
	}
}
