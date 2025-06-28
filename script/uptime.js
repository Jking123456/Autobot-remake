const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const pidusage = require('pidusage');

const timestampFile = path.join(__dirname, 'uptime_start_time.txt');

module.exports.config = {
	name: "uptime",
	version: "1.0.2",
	role: 0,
	credits: "cliff (fixed by Bogart)",
	description: "Get bot uptime and system information",
	hasPrefix: false,
	cooldowns: 5,
	aliases: ["up"]
};

module.exports.byte2mb = (bytes) => {
	const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	let l = 0, n = parseInt(bytes, 10) || 0;
	while (n >= 1024 && ++l) n = n / 1024;
	return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
};

module.exports.getStartTimestamp = async () => {
	try {
		const startTimeStr = await fs.readFile(timestampFile, 'utf8');
		return parseInt(startTimeStr);
	} catch (error) {
		return Date.now();
	}
};

module.exports.saveStartTimestamp = async (timestamp) => {
	try {
		await fs.writeFile(timestampFile, timestamp.toString());
	} catch (error) {
		console.error('❌ Error saving start timestamp:', error);
	}
};

module.exports.getUptime = (uptime) => {
	const days = Math.floor(uptime / (3600 * 24));
	const hours = Math.floor((uptime % (3600 * 24)) / 3600);
	const mins = Math.floor((uptime % 3600) / 60);
	const seconds = Math.floor(uptime % 60);

	return `━━━━━━━━━━━━━━━━━━━━━━━
 | 𝗨𝗣𝗧𝗜𝗠𝗘
 | ${days} day(s)
 | ${hours} hour(s)
 | ${mins} minute(s)
 | ${seconds} second(s)`;
};

module.exports.onLoad = async () => {
	try {
		await fs.access(timestampFile);
	} catch {
		await module.exports.saveStartTimestamp(Date.now());
	}
};

module.exports.run = async ({ api, event }) => {
	const startTime = await module.exports.getStartTimestamp();
	const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
	const usage = await pidusage(process.pid);

	const osInfo = {
		platform: os.platform(),
		architecture: os.arch()
	};

	const timeStart = Date.now();
	const uptimeMessage = module.exports.getUptime(uptimeSeconds);
	const returnResult = `${uptimeMessage}
 | ❖ CPU usage: ${usage.cpu.toFixed(1)}%
 | ❖ RAM usage: ${module.exports.byte2mb(usage.memory)}
 | ❖ Cores: ${os.cpus().length}
 | ❖ Ping: ${Date.now() - timeStart}ms
 | ❖ OS Platform: ${osInfo.platform}
 | ❖ CPU Architecture: ${osInfo.architecture}
━━━━━━━━━━━━━━━━━━━━━━━`;

	return api.sendMessage(returnResult, event.threadID, event.messageID);
};
