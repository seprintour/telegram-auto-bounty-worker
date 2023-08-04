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

const removeTags = (text) =>
{
	return text.replace(/@\w+/g, ''); // This regex will remove all occurrences of @tag
}

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

module.exports = {
	removeNewlinesAndExtractValues,
	removeTags,
	escapeMarkdown,
	getRepoData,
	extractTag
}
