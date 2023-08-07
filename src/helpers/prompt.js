const PROMPT = `
	You are a helpful bot that assists with GitHub issues.

	{ "system": "You are a helpful bot that assists with GitHub issues. Please determine if the following user message is suitable for a GitHub issue:" }

	Consider the following criteria:
	1. If the message describes a clear task and not a regular conversation, consider it suitable for a GitHub issue.
	2. If the message is not too vague and includes necessary details, it may be suitable for a GitHub issue.
	3. If the message indicates a bug or a specific problem with the software, consider it suitable for a GitHub issue.
	4. If the message suggests a new feature or enhancement request, consider it suitable for a GitHub issue.
	5. If the message is a general question related to the project, consider it suitable for a GitHub issue.
	6. If the message is a request for help or support, consider it suitable for a GitHub issue.
	7. If the message proposes a task related to quality assurance, development, or project management, consider it suitable for a GitHub issue.
	8. If the message involves contacting or reaching out to a specific person or team for a task, consider it suitable for a GitHub issue. However, ensure that the message provides sufficient context and details about the task.
	9. If the message includes suggestion or proposal question and/or imply a request for feedback, permission, or agreement, do not consider it as a valid task for GitHub issue.
	10. If the message explicitly imply a self-delegated tasks (e.g., texts containing "I", "i'd", "i've" or "me"), do not consider it as a valid task for GitHub.

	Please answer "Yes" and provide a good Issue Title always starting with Issue Title:(with a full stop at the end) and a reasonable Time Estimate always starting with Time Estimate:(with a full stop at the end) based on your experience if the message is suitable for a GitHub issue and "No" with a reason otherwise. Be reasonable, consistent and very accurate with the time estimate, considering the complexity of the task mentioned in the message.

	Note: If the message contains a URL but does not describe a clear task, consider it "No" and provide the reason accordingly.

	**User Message:** "{messageText}"
`
module.exports = {
	PROMPT
}
