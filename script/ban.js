const fs = require("fs-extra");
const path = require("path");
const bansPath = path.join(process.cwd(), "cache", "bans.json");

module.exports.config = {
	name: "ban",
	version: "2.0.5",
	hasPermssion: 0,
	credits: "NTKhang & edited by DuyVuong",
	description: "Permanently ban members from the group",
	usePrefix: true,
	commandCategory: "group",
	usages: "[key]",
	cooldowns: 5,
	info: [
		{
			key: '[tag] or [reply message] "reason"',
			prompt: '1 more warning user',
			type: '',
			example: 'ban [tag] "reason for warning"'
		},
		{
			key: 'listban',
			prompt: 'see the list of users banned from the group',
			type: '',
			example: 'ban listban'
		},
		{
			key: 'uban',
			prompt: 'remove the user from the list of banned groups',
			type: '',
			example: 'ban unban [id of user to delete]'
		},
		{
			key: 'view',
			prompt: '"tag" or "blank" or "view all"',
			type: '',
			example: 'ban view [@tag] / warns view'
		},
		{
			key: 'reset',
			prompt: 'Reset all data in your group',
			type: '',
			example: 'ban reset'
		}
	]
};

module.exports.run = async function({ api, args, Users, event, Threads, utils, client }) {
	const { messageID, threadID, senderID } = event;
	const info = await api.getThreadInfo(threadID);

	if (!info.adminIDs.some(item => item.id == api.getCurrentUserID()))
		return api.sendMessage('🚫 The bot needs group admin rights to use this command!', threadID, messageID);

	// Ensure bans.json file and structure exist
	if (!fs.existsSync(bansPath)) {
		const initData = { warns: {}, banned: {} };
		fs.writeFileSync(bansPath, JSON.stringify(initData, null, 2));
	}
	let bans = JSON.parse(fs.readFileSync(bansPath));

	if (!bans.warns[threadID]) {
		bans.warns[threadID] = {};
		fs.writeFileSync(bansPath, JSON.stringify(bans, null, 2));
	}

	// === VIEW ===
	if (args[0] === "view") {
		if (!args[1]) {
			const mywarn = bans.warns[threadID][senderID];
			if (!mywarn) return api.sendMessage('✅ You have never been warned', threadID, messageID);
			const msg = mywarn.map((r, i) => `${i + 1}. ${r}`).join("\n");
			return api.sendMessage(`❎ You have been warned:\n${msg}`, threadID, messageID);
		} else if (Object.keys(event.mentions).length !== 0) {
			let message = "";
			for (let id of Object.keys(event.mentions)) {
				const name = (await api.getUserInfo(id))[id].name;
				const warns = bans.warns[threadID][id];
				const msg = warns ? warns.map((r, i) => `${i + 1}. ${r}`).join("\n") : "✅ Never warned";
				message += `⭐ ${name}:\n${msg}\n\n`;
			}
			return api.sendMessage(message.trim(), threadID, messageID);
		} else if (args[1] === "all") {
			let result = "";
			for (let id in bans.warns[threadID]) {
				const name = (await api.getUserInfo(id))[id].name;
				const reasons = bans.warns[threadID][id].join(", ");
				result += `${name}: ${reasons}\n`;
			}
			return api.sendMessage(result || "✅ No one has been warned in this group yet", threadID, messageID);
		}
	}

	// === UNBAN ===
	else if (args[0] === "unban") {
		if (!info.adminIDs.some(item => item.id == senderID) && !(global.config.ADMINBOT || []).includes(senderID))
			return api.sendMessage('🚫 You don’t have permission to unban users.', threadID, messageID);

		const id = parseInt(args[1]);
		if (!id) return api.sendMessage("❎ Please provide a valid user ID to unban.", threadID, messageID);

		if (!bans.banned[threadID] || !bans.banned[threadID].includes(id))
			return api.sendMessage("✅ This user is not banned from your group.", threadID, messageID);

		bans.banned[threadID] = bans.banned[threadID].filter(uid => uid !== id);
		delete bans.warns[threadID][id];
		fs.writeFileSync(bansPath, JSON.stringify(bans, null, 2));
		return api.sendMessage(`✅ User with ID ${id} has been unbanned.`, threadID, messageID);
	}

	// === LIST BAN ===
	else if (args[0] === "listban") {
		const list = bans.banned[threadID] || [];
		if (!list.length) return api.sendMessage("✅ No banned users in this group.", threadID, messageID);

		let msg = "";
		for (let id of list) {
			const name = (await api.getUserInfo(id))[id]?.name || "Unknown";
			msg += `╔ Name: ${name}\n╚ ID: ${id}\n`;
		}
		return api.sendMessage("❎ Banned users:\n" + msg, threadID, messageID);
	}

	// === RESET ===
	else if (args[0] === "reset") {
		if (!info.adminIDs.some(item => item.id == senderID) && !(global.config.ADMINBOT || []).includes(senderID))
			return api.sendMessage('🚫 You don’t have permission to reset warnings.', threadID, messageID);

		bans.warns[threadID] = {};
		bans.banned[threadID] = [];
		fs.writeFileSync(bansPath, JSON.stringify(bans, null, 2));
		return api.sendMessage("✅ All warning and ban data has been reset for this group.", threadID, messageID);
	}

	// === DEFAULT: WARN / BAN ===
	else {
		if (event.type !== "message_reply" && Object.keys(event.mentions).length === 0)
			return utils.throwError(this.config.name, threadID, messageID);

		if (!info.adminIDs.some(item => item.id == senderID) && !(global.config.ADMINBOT || []).includes(senderID))
			return api.sendMessage('🚫 You don’t have permission to warn/ban.', threadID, messageID);

		let iduser = [];
		let reason = args.join(" ").trim() || "No reason provided";

		if (event.type === "message_reply") {
			iduser.push(event.messageReply.senderID);
		} else {
			iduser = Object.keys(event.mentions);
			for (let mention of Object.values(event.mentions)) {
				reason = reason.replace(mention, "").trim();
			}
		}

		let arraytag = [];
		let arrayname = [];

		for (let id of iduser) {
			id = parseInt(id);
			const name = (await api.getUserInfo(id))[id].name;
			arraytag.push({ id, tag: name });
			arrayname.push(name);

			if (!bans.warns[threadID][id]) bans.warns[threadID][id] = [];
			bans.warns[threadID][id].push(reason);

			if (!bans.banned[threadID]) bans.banned[threadID] = [];
			if (bans.warns[threadID][id].length > 1) {
				await api.removeUserFromGroup(id, threadID);
				bans.banned[threadID].push(id);
			}
		}

		fs.writeFileSync(bansPath, JSON.stringify(bans, null, 2));
		api.sendMessage({
			body: `🚫 User(s) ${arrayname.join(", ")} have been warned.\n📝 Reason: ${reason}`,
			mentions: arraytag
		}, threadID, messageID);
	}
};
