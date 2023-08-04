const { TIME_LABELS } = require("../constants");

const getClosestTimeLabel = (timeEstimate) =>
{
	// Convert the time estimate into minutes
	const apiTimeInMinutes = getTimeInMinutes(timeEstimate);

	// Find the index of the closest time label in the array
	let closestIndex = 0;
	let minDifference = Math.abs(apiTimeInMinutes - getTimeInMinutesFromLabel(TIME_LABELS[0]));

	for (let i = 1; i < TIME_LABELS.length; i++)
	{
		const labelTimeInMinutes = getTimeInMinutesFromLabel(TIME_LABELS[i]);
		const difference = Math.abs(apiTimeInMinutes - labelTimeInMinutes);

		if (difference < minDifference)
		{
			minDifference = difference;
			closestIndex = i;
		}
	}

	return TIME_LABELS[closestIndex];
}

// Helper function to convert time labels to minutes
const getTimeInMinutesFromLabel = (label) =>
{
	const timeStr = label.match(/\d+/)[0]; // Extract the numeric value from the label
	const unit = label.includes("Hour") ? "hour" : label.includes("Day") ? "day" : label.includes("Week") ? "week" : "month";

	return unit === "hour" ? parseInt(timeStr) * 60 : unit === "day" ? parseInt(timeStr) * 24 * 60 :
		unit === "week" ? parseInt(timeStr) * 7 * 24 * 60 : parseInt(timeStr) * 30 * 24 * 60;
}

// Helper function to convert time estimates to minutes
const getTimeInMinutes = (timeEstimate) =>
{
	const timeRegex = /(\d+)\s*(hour|day|week|month)s?/i;
	const match = timeEstimate.match(timeRegex);

	if (match)
	{
		const value = parseInt(match[1]);
		const unit = match[2].toLowerCase();

		return unit === "hour" ? value * 60 : unit === "day" ? value * 24 * 60 :
			unit === "week" ? value * 7 * 24 * 60 : value * 30 * 24 * 60;
	}

	return null;
}

module.exports = {
	getClosestTimeLabel
}
