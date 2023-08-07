const GREETINGS = ["Hey", "Hi", "Hello", "Morning", "Afternoon", "Evening", "Greetings"];

const isGreeting = (chatMessage) =>
{
	// Convert the chat message to lowercase for case-insensitive matching
	const lowerCaseChat = chatMessage.toLowerCase();

	// Create a regular expression for word-level matching
	const regex = new RegExp(`\\b(?:${GREETINGS.join('|')})\\b`, 'i');

	// Check if the chat message contains any of the greeting words
	return regex.test(lowerCaseChat);
}

module.exports = {
	isGreeting
}
