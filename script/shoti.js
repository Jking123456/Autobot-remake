module.exports.config = {
	name: "shoti",
	version: "1.0.0",
	role: 0,
	credits: "libyzxy0",
	description: "Generate a random tiktok video.",
	usages: "[]",
	cooldown: 0,
	hasPrefix: false,
};

module.exports. run = async ({ api, event, args }) => {

	api.setMessageReaction("🌸", event.messageID, (err) => {
		 }, true);
api.sendTypingIndicator(event.threadID, true);

	const { messageID, threadID } = event;
	const fs = require("fs");
	const axios = require("axios");
	const request = require("request");
	const prompt = args.join(" ");

	if (!prompt[0]) { api.sendMessage("▪〉𝙎𝙃𝙊𝙏𝙄🌸.🌸.🌸", threadID, messageID);
		}

 try {
	const response = await axios.post(`https://kaiz-apis.gleeze.com/api/shoti`, { apikey: `$shoti-1hg4gifgnlfdmeslom8` });

	let path = __dirname + `/../public/image/shoti.mp4`;
	const file = fs.createWriteStream(path);
	const rqs = request(encodeURI(response.data.shoti.videoUrl));
	rqs.pipe(file);
	file.on(`finish`, () => {
		 setTimeout(function() {
			 api.setMessageReaction("⚡", event.messageID, (err) => {
					}, true);
			return api.sendMessage({
			body: `Random Shoti:\n\nUsername : ${response.data.shoti.username}\nNickname : ${response.data.shoti.nickname}`, 
			attachment: fs.createReadStream(path)
		}, threadID);
			}, 5000);
				});
	file.on(`error`, (err) => {
			api.sendMessage(`Error: ${err}`, threadID, messageID);
	});
	 } catch (err) {
		api.sendMessage(`Error: ${err}`, threadID, messageID);
	};
};