module.exports.config = {
  name: "spy",
  version: "2.0",
  role: 0,
  hasPrefix: true,
  aliases: ["whoishe", "whoisshe", "whoami", "stalk"],
  description: "Get detailed user information with elegant presentation",
  usage: "[reply/tag/uid]",
  credits: "Converted by ChatGPT - Original by xnil6x",
  cooldowns: 5,
  commandCategory: "info"
};

module.exports.run = async function ({ api, event, args, Users }) {
  const { senderID, messageID, messageReply, mentions, threadID } = event;

  let uid =
    args[0]?.match(/^\d+$/)?.[0] ||
    args[0]?.match(/profile\.php\?id=(\d+)/)?.[1] ||
    Object.keys(mentions)[0] ||
    (messageReply && messageReply.senderID) ||
    senderID;

  try {
    const userInfo = await api.getUserInfo(uid);
    const info = userInfo[uid];

    if (!info) throw new Error("Invalid user or can't access user info");

    const userData = await Users.getData(uid);
    const allUsers = await Users.getAll();
    const avatarUrl = await Users.getAvatarUrl(uid);

    const genderMap = { 1: "♀️ Girl", 2: "♂️ Boy", undefined: "🌈 Custom" };

    const formatMoney = num => {
      if (isNaN(num)) return "0";
      const units = ["", "K", "M", "B", "T"];
      let unit = 0;
      while (num >= 1000 && unit < units.length - 1) {
        num /= 1000;
        unit++;
      }
      return num.toFixed(1).replace(/\.0$/, "") + units[unit];
    };

    const getRank = (id, key) => {
      const sorted = [...allUsers].sort((a, b) => (b[key] || 0) - (a[key] || 0));
      return sorted.findIndex(u => u.userID === id) + 1;
    };

    const stats = {
      money: userData.money || 0,
      exp: userData.exp || 0,
      rank: getRank(uid, "exp"),
      moneyRank: getRank(uid, "money")
    };

    const createBox = (title, items) => {
      let box = `╭─── ✦ ${title} ✦ ───\n`;
      items.forEach(([k, v]) => (box += `├─ ${k}: ${v}\n`));
      box += `╰────────────────`;
      return box;
    };

    const profileBox = createBox("PROFILE", [
      ["🎭 Name", info.name],
      ["🧬 Gender", genderMap[info.gender] || "Unknown"],
      ["🆔 UID", uid],
      ["👑 Status", info.type?.toUpperCase() || "Regular User"],
      ["🏷️ Username", info.vanity || "None"],
      ["🎂 Birthday", info.isBirthday ? "Yes" : "Private"],
      ["💫 Nickname", info.alternateName || "None"],
      ["🤖 Bot Friend", info.isFriend ? "✅ Yes" : "❌ No"]
    ]);

    const statsBox = createBox("STATISTICS", [
      ["💰 Money", `$${formatMoney(stats.money)}`],
      ["⭐ Experience", stats.exp],
      ["🏆 Rank", `#${stats.rank}/${allUsers.length}`],
      ["💎 Wealth Rank", `#${stats.moneyRank}/${allUsers.length}`]
    ]);

    const profileUrl = `🌐 Profile: ${info.profileUrl || "Unavailable"}`;

    const avatarStream = await global.utils.getStreamFromURL(avatarUrl);

    return api.sendMessage(
      {
        body: `${profileBox}\n\n${statsBox}\n\n${profileUrl}`,
        attachment: avatarStream
      },
      threadID,
      messageID
    );
  } catch (err) {
    console.error("🔍 SPY COMMAND ERROR:", err);
    return api.sendMessage(`❌ Couldn't spy on this user. Reason: ${err.message}`, threadID, messageID);
  }
};
