const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const convertDate = (time) => {
  const date = new Date(time);
  const [y, m, d, h, min, s] = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  ];
  return `${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${y} || ${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

module.exports.config = {
  name: "stalk",
  version: "2.0.0",
  permission: 0,
  credits: "Deku & Eugene Aguilar (Improved by Homer Rebatis)",
  description: "Facebook stalker using UID, mention, or reply",
  prefix: false,
  premium: false,
  category: "info",
  usage: "{pn} [uid/@mention/reply]",
  cooldowns: 5,
  dependencies: {
    axios: "",
    "fs-extra": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const ACCESS_TOKEN = "EAAGNO4a7r2wBPN9DnGPptTYL8cYjZC3cOWYX11xglzGNQADWzoNgBm6YjIMIA6yF9a3YArZBxx2gnTjJ1hWlppTGjXpzv2uh5IObJZAVrbFUz36fmS9Q1J5YnkYrZCEjFtAZC2XSTwnn7DhSa2qdZAPFS1l1VZCdJdZAntbFyO4LIVgTK7iAWAzqGiZBHZAX5zaAZDZD";

  const imgPath = path.join(__dirname, "cache", "stalk_avatar.jpg");
  await fs.ensureDir(path.dirname(imgPath));

  let id;
  if (args.length && args[0].includes("@")) {
    id = Object.keys(event.mentions)[0];
  } else if (event.type === "message_reply") {
    id = event.messageReply.senderID;
  } else {
    id = args[0] || event.senderID;
  }

  const fields = [
    "id", "is_verified", "cover", "created_time", "work", "hometown", "username", "link",
    "name", "locale", "location", "about", "website", "birthday", "gender",
    "relationship_status", "significant_other", "quotes", "first_name",
    "subscribers.limit(0)"
  ].join(",");

  try {
    const res = await axios.get(`https://graph.facebook.com/${id}?fields=${fields}&access_token=${ACCESS_TOKEN}`);

    const d = res.data;
    const data = {
      name: d.name || "No data",
      first_name: d.first_name || "No data",
      uid: d.id || "No data",
      username: d.username || "No data",
      created_time: d.created_time ? convertDate(d.created_time) : "No data",
      profile: d.link || "No data",
      gender: d.gender || "No data",
      relationship: d.relationship_status || "No data",
      love: d.significant_other?.name || "No data",
      birthday: d.birthday || "No data",
      followers: d.subscribers?.summary?.total_count || "No data",
      website: d.website || "No data",
      about: d.about || "No data",
      locale: d.locale || "No data",
      hometown: d.hometown?.name || "No data",
      verified: d.is_verified ? "Yes ✅" : "No ❌",
      quotes: d.quotes || "No data"
    };

    const avatarUrl = `https://graph.facebook.com/${id}/picture?width=1000&height=1000&access_token=1174099472704185|0722a7d5b5a4ac06b11450f7114eb2e9`;
    const avatar = await axios.get(avatarUrl, { responseType: "arraybuffer" });
    await fs.writeFile(imgPath, avatar.data);

    const infoMsg = `
•—— FACEBOOK STALK ——•
🔹 Name: ${data.name}
🔹 First name: ${data.first_name}
🔹 UID: ${data.uid}
🔹 Username: ${data.username}
🔹 Created: ${data.created_time}
🔹 Profile: ${data.profile}
🔹 Gender: ${data.gender}
🔹 Relationship: ${data.relationship}
🔹 Lover: ${data.love}
🔹 Birthday: ${data.birthday}
🔹 Followers: ${data.followers}
🔹 Website: ${data.website}
🔹 About: ${data.about}
🔹 Locale: ${data.locale}
🔹 Hometown: ${data.hometown}
🔹 Verified: ${data.verified}
🔹 Quotes: ${data.quotes}
•—— END ——•`.trim();

    api.sendMessage(
      { body: infoMsg, attachment: fs.createReadStream(imgPath) },
      event.threadID,
      () => fs.unlink(imgPath),
      event.messageID
    );

  } catch (error) {
    console.error("Stalk Error:", error.message);
    return api.sendMessage("❌ Failed to fetch profile. Make sure UID is correct or token is still valid.", event.threadID, event.messageID);
  }
};
