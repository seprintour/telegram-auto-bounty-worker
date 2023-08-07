const { repoMapping } = require("../constants")

/**
 * Escape string for use in MarkdownV2-style text
 * if `except` is provided, it should be a string of characters to not escape
 * https://core.telegram.org/bots/api#markdownv2-style
 */
const escapeMarkdown = (str, except = '') =>
{
	const all = '_*[]()~`>#+-=|{}.!\\'.split('').filter(c => !except.includes(c))
	const regExSpecial = '^$*+?.()|{}[]\\'
	const regEx = new RegExp('[' + all.map(c => (regExSpecial.includes(c) ? '\\' + c : c)).join('') + ']', 'gim')
	return str.replace(regEx, '\\$&')
}

const extractNumberWithoutPrefix = (text) =>
{
	const numberWithoutPrefix = text.replace(/^(-)?\d{3}/, '');
	return numberWithoutPrefix.length === 10 ? numberWithoutPrefix : null;
}

const cleanMessage = (text) =>
{
	// Remove all occurrences of @tag
	const cleanedText = text.replace(/@\w+/g, '');

	// Remove all occurrences of links (http and https)
	return cleanedText.replace(/(https?:\/\/[^\s]+)/g, '');
};

function extractTag(text)
{
	const regex = /@(\w+)/;
	const match = regex.exec(text);
	return match ? match[0] : null;
}

const removeNewlinesAndExtractValues = (text) =>
{
	// Remove all occurrences of '\n'
	const textWithoutNewlines = text.replace(/\n/g, '');

	// Extract Issue Title and Time Estimate using regex
	const issueTitleRegex = /Issue Title: (.*?)(?=Time Estimate|$)/;
	const timeEstimateRegex = /Time Estimate: (.*?)(?=\.$|$)/;

	const issueTitleMatch = textWithoutNewlines.match(issueTitleRegex);
	const timeEstimateMatch = textWithoutNewlines.match(timeEstimateRegex);

	const issueTitle = issueTitleMatch ? issueTitleMatch[1].trim() : null;
	const timeEstimate = timeEstimateMatch ? timeEstimateMatch[1].trim() : null;

	return { issueTitle, timeEstimate };
}

/**
 * Get repo data from mapping
 */
const getRepoData = (groupId) =>
{
	const data = repoMapping.find((e) => e.group === groupId);
	if (data.github)
	{
		const orgName = data.github.split('/')[0]
		const repoName = data.github.split('/')[1]
		return {
			orgName, repoName
		}
	}

	return {
		orgName: null,
		repoName: null
	}
}

const generateMessageLink = (messageId, groupId) =>
{
	return `https://t.me/c/${extractNumberWithoutPrefix(groupId?.toString())}/${messageId?.toString()}`
}

const generateGitHubIssueBody = (interceptedMessage, telegramMessageLink) =>
{
	const quotedMessage = `> ${interceptedMessage.replace(/\n/g, '\n> ')}\n\n`;
	return `${quotedMessage}${telegramMessageLink}`;
}

const extractTaskInfo = (text) =>
{
	const regex = /Click confirm to create new task "(.*?)" on (.*?)\/(.*?) with time estimate (.+?)$/;
	const match = text.match(regex);
	console.log(match)

	if (match)
	{
		const [_, title, orgName, repoName, timeEstimate] = match;
		return {
			title,
			orgName,
			repoName,
			timeEstimate,
		};
	} else
	{
		return null;
	}
}

const createCooldownFunction = (cooldownTimeInMilliseconds) =>
{
	let lastCallTime = 0;

	return function ()
	{
		const currentTime = Date.now();
		if (currentTime - lastCallTime >= cooldownTimeInMilliseconds)
		{
			lastCallTime = currentTime;
			return true;
		} else
		{
			return false;
		}
	};
}


module.exports = {
	removeNewlinesAndExtractValues,
	cleanMessage,
	escapeMarkdown,
	getRepoData,
	extractTag,
	generateMessageLink,
	generateGitHubIssueBody,
	extractTaskInfo,
	createCooldownFunction
}
