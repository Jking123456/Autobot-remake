const path = require("path");
const fs = require("fs");

let bannedWords = {};
let warnings = {};
let badWordsActive = {};

module.exports.config = {
	name: "badwords",
	version: "1.0.1",
	role: 2,
	credits: "Homer rebatis",
	description: "Manage and enforce banned words",
	hasPrefix: false,
	usages: "add [word] | remove [word] | list | on | off",
	cooldown: 5,
};

const getWordFilePath = threadID => path.join(__dirname, `../cache/${threadID}.json`);

function loadBannedWords(threadID) {
	const wordFile = getWordFilePath(threadID);
	if (fs.existsSync(wordFile)) {
		const words = fs.readFileSync(wordFile, "utf8");
		bannedWords[threadID] = JSON.parse(words);
	} else {
		bannedWords[threadID] = [];
	}
}

module.exports.handleEvent = async function({ api, event }) {
	const { threadID, messageID, senderID, body } = event;

	loadBannedWords(threadID);
	if (!badWordsActive[threadID]) return;

	const threadInfo = await api.getThreadInfo(threadID);
	const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
	const isSenderAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);

	if (!isBotAdmin) {
		await api.sendMessage("⚠️ Bot needs admin privileges to enforce badwords!", threadID, null, messageID);
		return;
	}

	// Prevent punishment if the sender is an admin
	if (isSenderAdmin) return;

	const messageContent = (body || "").toLowerCase();
	const hasBannedWord = bannedWords[threadID].some(word => messageContent.includes(word.toLowerCase()));

	if (hasBannedWord) {
		warnings[senderID] = (warnings[senderID] || 0) + 1;

		if (warnings[senderID] >= 2) {
			await api.sendMessage("⛔ You have violated the badwords rule twice. You will now be removed from the group.", threadID, null, messageID);
			try {
				await api.removeUserFromGroup(senderID, threadID);
			} catch (err) {
				await api.sendMessage("⚠️ Failed to remove user. Please check bot admin permissions.", threadID);
			}
			warnings[senderID] = 1;
		} else {
			await api.sendMessage(`⚠️ Warning: Your message contains banned words.\nNext violation may result in removal.`, threadID, null, messageID);
		}
	}
};

module.exports.run = async function({ api, event, args }) {
	const { threadID, messageID } = event;

	if (!args[0]) {
		return api.sendMessage("📌 Usage: add [word], remove [word], list, on, off", threadID, null, messageID);
	}

	const action = args[0].toLowerCase();
	const word = args.slice(1).join(" ").trim().toLowerCase();
	const wordFile = getWordFilePath(threadID);

	loadBannedWords(threadID);

	const threadInfo = await api.getThreadInfo(threadID);
	const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());

	if (!isBotAdmin) {
		return api.sendMessage("🛡️ Bot needs to be an admin to configure badwords.", threadID, null, messageID);
	}

	switch (action) {
		case "add":
			if (!word) return api.sendMessage("❗ Please specify a word to add.", threadID);
			if (!bannedWords[threadID].includes(word)) {
				bannedWords[threadID].push(word);
				await api.sendMessage(`✅ "${word}" has been added to the list of banned words.`, threadID);
			} else {
				await api.sendMessage(`⚠️ "${word}" is already in the list.`, threadID);
			}
			break;

		case "remove":
			if (!word) return api.sendMessage("❗ Please specify a word to remove.", threadID);
			const index = bannedWords[threadID].indexOf(word);
			if (index !== -1) {
				bannedWords[threadID].splice(index, 1);
				await api.sendMessage(`✅ "${word}" has been removed from the list of banned words.`, threadID);
			} else {
				await api.sendMessage(`❌ "${word}" not found in the list.`, threadID);
			}
			break;

		case "list":
			const list = bannedWords[threadID];
			if (list.length === 0) {
				await api.sendMessage("📭 No banned words set yet.", threadID);
			} else {
				await api.sendMessage(`📝 Banned Words List:\n- ${list.join("\n- ")}`, threadID);
			}
			break;

		case "on":
			badWordsActive[threadID] = true;
			await api.sendMessage("✅ Badwords filter has been activated.", threadID);
			break;

		case "off":
			badWordsActive[threadID] = false;
			await api.sendMessage("❌ Badwords filter has been deactivated.", threadID);
			break;

		default:
			await api.sendMessage("❓ Invalid action. Use: add, remove, list, on, or off.", threadID);
	}

	fs.writeFileSync(wordFile, JSON.stringify(bannedWords[threadID]), "utf8");
};
