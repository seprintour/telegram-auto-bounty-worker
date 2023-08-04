const GREETINGS = ["Hey", "Hi", "Hello", "Morning", "Afternoon", "Evening", "Hey there", "Hi there", "Greetings"];

function isGreeting(chatMessage)
{
	// Convert the chat message to lowercase for case-insensitive matching
	const lowerCaseChat = chatMessage.toLowerCase();

	// Check if the chat message contains any of the greeting words
	return GREETINGS.some(greeting => lowerCaseChat.includes(greeting.toLowerCase()));
}

module.exports = {
	isGreeting
}
