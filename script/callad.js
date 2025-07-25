module.exports.config = {
	name: "callad",
	version: "1.0.1",
	hasPermssion: 0,
	credits: "NTKhang, ManhG Fix Get",
	description: "Report bot's error to admin or comment",
	usePrefix: true,
	commandCategory: "report",
	usages: "[Error encountered or comments]",
	cooldowns: 5
};

module.exports.handleReply = async function({
	api: e,
	args: n,
	event: a,
	Users: s,
	handleReply: o
}) {
	var i = await s.getNameUser(a["100044848836284"]);
	switch (o.type) {
		case "reply":
			e.sendMessage({
				body: "📄Feedback from " + i + ":\n" + a.body,
				mentions: [{
					id: a["100044848836284"],
					tag: i
				}]
			}, o.id);
			break;
		case "calladmin":
			e.sendMessage({
				body: `📌Feedback from admin ${i} to you:\n--------\n${a.body}\n--------\n»💬Reply to this message to continue sending reports to admin`,
				mentions: [{
					tag: i,
					id: a["100044848836284"]
				}]
			}, o.id);
			break;
	}
};

module.exports.run = async function({
	api: e,
	event: n,
	args: a,
	Users: s,
	Threads: o
}) {
	// 🚧 Under Maintenance Mode
	return e.sendMessage("⚠️ The `callad` command is currently under maintenance. Please try again later.", n.threadID, n.messageID);

	// ⛔ Below code is disabled during maintenance
	if (!a[0]) return e.sendMessage("You have not entered the content to report", n["100044848836284"], n.messageID);
	let i = await s.getNameUser(n.senderID);
	let t = n.senderID,
		d = n.threadID;
	let r = (await o.getData(n.threadID)).threadInfo;
	let l = require("moment-timezone").tz("Asia/Manila").format("HH:mm:ss D/MM/YYYY");
	e.sendMessage(`At: ${l}\nYour report has been sent to the specified user's ID`, n["100044848836284"], (() => {
		const calladUserID = '100044848836284';
		e.sendMessage(`${a.join(" ")}`, calladUserID, (err, info) => {
			if (err) return console.error(err);
			global.client.handleReply.push({
				name: this.config.name,
				messageID: info.messageID,
				author: n.senderID,
				messID: n.messageID,
				id: d,
				type: "calladmin"
			});
		});
	}));
};
