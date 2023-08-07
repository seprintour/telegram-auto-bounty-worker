/**
 * All console.log for debugging the worker on cloudflare dashboard
 */

import { completeGPT3 } from "./helpers/chatGPT"
import { createIssue } from "./helpers/github"
import { isGreeting } from "./helpers/greetings"
import { answerCallbackQuery, apiUrl, deleteBotMessage, editBotMessage, sendReply } from "./helpers/triggers";
import { cleanMessage, createCooldownFunction, escapeMarkdown, extractTaskInfo, generateMessageLink, getRepoData } from "./helpers/utils"

const cooldownTime = 60000; // 1 minute cooldown for message handler
const cooldownFunction = createCooldownFunction(cooldownTime);

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
 * Handle incoming callback_query (inline button press)
 * https://core.telegram.org/bots/api#message
 */
async function onCallbackQuery(callbackQuery)
{
	const groupId = callbackQuery.message.chat.id; // group id
	const messageId = callbackQuery.message.message_id; // id for current message
	const messageIdReply = callbackQuery.message.reply_to_message.message_id; // id of root message
	//const senderId = message.from.id
	const messageText = callbackQuery.message.text // text of current message
	const replyToMessage = callbackQuery.message.reply_to_message.text // text of root message

	if (callbackQuery.data === "create_task")
	{
		// get message link
		const messageLink = generateMessageLink(messageIdReply, groupId);

		const {
			title,
			timeEstimate,
		} = extractTaskInfo(messageText); // extract issue info from text

		const { repoName, orgName } = getRepoData(groupId);

		console.log(`Check: ${title}, ${timeEstimate} ${orgName}:${repoName}`);

		if (!repoName || !orgName)
		{
			console.log(`No Github data mapped to channel`);
			return;
		}

		const res = await createIssue(timeEstimate, orgName, repoName, title, replyToMessage, messageLink)

		console.log(`Issue created: ${res.html_url}`);

		const msg = escapeMarkdown(`*Issue created: [Check it out here](${res.html_url})* with time estimate *${timeEstimate}*`, '*`[]()');

		await editBotMessage(groupId, messageId, msg)
		return answerCallbackQuery(callbackQuery.id, 'issue created!');
	} else if (callbackQuery.data === "reject_task")
	{
		deleteBotMessage(groupId, messageId)
	}
}

/**
 * Handle incoming Message
 * https://core.telegram.org/bots/api#message
 */
const onMessage = async (message) =>
{
	console.log(`Received message: ${message.text}`);

	// check if cooldown
	const isReady = cooldownFunction();

	if (!isReady)
	{
		console.log(`Skipping, bot on cooldown`);
		return;
	}

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

	const { repoName, orgName } = getRepoData(groupId);

	if (!repoName || !orgName)
	{
		console.log(`No Github data mapped to channel`);
		return;
	}

	if (issueTitle)
	{
		return sendReply(
			groupId,
			messageId,
			escapeMarkdown(`Click confirm to create new task *"${issueTitle}"* on *${orgName}/${repoName}* with time estimate *${timeEstimate}*`, '*`[]()@/')
		)
	}
}
