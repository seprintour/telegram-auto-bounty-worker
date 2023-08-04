const { getClosestTimeLabel } = require("./time");

/**
 * Create Issue on Github
 */
const createIssue = async (timeEstimate, organization, repository, issueTitle, issueBody) =>
{
	console.log('Creating Github Issue:', organization, repository, issueTitle, issueBody)
	try
	{
		const apiUrl = `https://api.github.com/repos/${organization}/${repository}/issues`;

		// get time label
		const closestTimeLabel = getClosestTimeLabel(timeEstimate);

		// labels array
		const labels = [
			DEFAULT_PRIORITY,
			closestTimeLabel
		]

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
