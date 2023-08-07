const { removeNewlinesAndExtractValues } = require("./utils");
const { PROMPT } = require("./prompt");

const completeGPT3 = async (messageText) =>
{
	try
	{
		const apiKey = OPENAI_API_KEY;
		const apiUrl = 'https://api.openai.com/v1/completions';

		const requestBody = {
			model: 'text-davinci-003',
			prompt: PROMPT.replace(/{messageText}/g, messageText),
			max_tokens: 1000,
			temperature: 1, // Adjust temperature as needed
		};

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`,
			},
			body: JSON.stringify(requestBody),
		});

		const data = await response.json();

		console.log(data); // log raw data

		if (data?.error)
		{
			console.log(`ChatGPT Error: ${data?.error}`);
			return;
		}

		return removeNewlinesAndExtractValues(data.choices[0].text);
	} catch (e)
	{
		console.log(e.message);
		return {
			issueTitle: null, timeEstimate: null
		}
	}
}

module.exports = {
	completeGPT3
}
