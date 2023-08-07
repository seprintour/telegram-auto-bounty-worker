const { generateGitHubIssueBody } = require("./utils");

/**
 * Create Issue on Github
 */
const createIssue = async (timeEstimate, organization, repository, issueTitle, messageText, messageLink) =>
{
	console.log('Creating Github Issue:', organization, repository, issueTitle, messageText, messageLink)
	try
	{
		const apiUrl = `https://api.github.com/repos/${organization}/${repository}/issues`;

		// labels array
		const labels = [
			DEFAULT_PRIORITY,
			`Time: <${timeEstimate}`
		]

		// create body
		const issueBody = generateGitHubIssueBody(messageText, messageLink)

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Authorization': `token ${GITHUB_PAT}`,
				'Content-Type': 'application/json',
				'User-Agent': 'Telegram Cloudflare Worker',
			},
			body: JSON.stringify({
				title: issueTitle,
				body: issueBody,
				labels,
			}),
		});
		const data = await response.json();
		return data;
	} catch (error)
	{
		console.log('Error creating issue:', error);
		return null;
	}
}

module.exports = {
	createIssue
}
