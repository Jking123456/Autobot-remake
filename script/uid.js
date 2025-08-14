const cooldowns = new Map(); // Store cooldowns per senderID
const ONE_DAY = 24 * 60 * 60 * 1000; // 1 day in ms

module.exports.config = {
	name: "uid",
	role: 0,
	credits: "Homer Rebatis + Updated by ChatGPT",
	description: "Get the user's Facebook UID.",
	hasPrefix: false,
	usages: "{p}uid {p}uid @mention",
	cooldown: 5, // meta's built-in cooldown (not our custom one)
	aliases: ["id", "ui"]
};

module.exports.run = async function({ api, event }) {
	const senderID = event.senderID;
	const now = Date.now();

	// Check cooldown
	if (cooldowns.has(senderID)) {
		const lastUsed = cooldowns.get(senderID);
		const timePassed = now - lastUsed;

		if (timePassed < ONE_DAY) {
			const remaining = ONE_DAY - timePassed;
			const hours = Math.floor(remaining / (1000 * 60 * 60));
			const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
			return api.sendMessage(
				`⏳ You can use this command again in ${hours}h ${minutes}m.`,
				event.threadID,
				event.messageID
			);
		}
	}

	// Update cooldown
	cooldowns.set(senderID, now);

	if (Object.keys(event.mentions).length === 0) {
		if (event.messageReply) {
			const replySenderID = event.messageReply.senderID;
			return api.sendMessage(replySenderID, event.threadID);
		} else {
			return api.sendMessage(`${senderID}`, event.threadID, event.messageID);
		}
	} else {
		for (const mentionID in event.mentions) {
			const mentionName = event.mentions[mentionID];
			api.sendMessage(`${mentionName.replace('@', '')}: ${mentionID}`, event.threadID);
		}
	}
};
