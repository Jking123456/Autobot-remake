const axios = require("axios");
const fs = require("fs");
const request = require("request");

function convert(time) {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${day < 10 ? "0" + day : day}/${month < 10 ? "0" + month : month}/${year}||${hours < 10 ? "0" + hours : hours}:${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
}

module.exports.config = {
  name: "stalk",
  version: "1.0.0",
  permission: 0,
  credits: "Deku & Eugene Aguilar (Auto Bot conversion by ChatGPT)",
  description: "Facebook stalker using UID, mention, or reply",
  prefix: false,
  premium: false,
  category: "info",
  usage: "{pn} [uid/@mention/reply]",
  cooldowns: 5,
  dependencies: {
    axios: "",
    request: ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const token = "EAAD6V7os0gcBO2aUDSZBhLGzreMcWtcCv1DONhlZCcdMIR4greGiFuJn9bL5IPQL0C3UolS5Iq4F9Uk0dwZAsMd2hScJJN9l5JP3wXFgUEqYjBTsP96FHOBdbqYRgGwbAaO7jvUZAyfe5aeqpqch58bAYKNTFRGvHrKWc9SbscoZBWE4uP5pdJdqQjIVV0yVWUwZDZD";
  const path = __dirname + `/cache/info.png`;
  let id;

  if (args.length && args[0].includes('@')) {
    id = Object.keys(event.mentions)[0];
  } else if (event.type === "message_reply") {
    id = event.messageReply.senderID;
  } else {
    id = args[0] || event.senderID;
  }

  const headers = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like) Version/12.0 eWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
    "accept": "application/json, text/plain, */*"
  };

  try {
    const response = await axios.get(`https://graph.facebook.com/${id}?fields=id,is_verified,cover,created_time,work,hometown,username,link,name,locale,location,about,website,birthday,gender,relationship_status,significant_other,quotes,first_name,subscribers.limit(0)&access_token=${token}`, { headers });

    const data = response.data;
    const name = data.name;
    const link_profile = data.link;
    const uid = data.id;
    const first_name = data.first_name;
    const username = data.username || "No data!";
    const created_time = convert(data.created_time);
    const web = data.website || "No data!";
    const gender = data.gender;
    const relationship_status = data.relationship_status || "No data!";
    const love = data.significant_other?.name || "No data!";
    const bday = data.birthday || "No data!";
    const follower = data.subscribers?.summary?.total_count || "No data!";
    const is_verified = data.is_verified;
    const quotes = data.quotes || "No data!";
    const about = data.about || "No data!";
    const locale = data.locale || "No data!";
    const hometown = data.hometown?.name || "No Hometown";
    const avatar = `https://graph.facebook.com/${id}/picture?width=1500&height=1500&access_token=1174099472704185|0722a7d5b5a4ac06b11450f7114eb2e9`;

    const cb = () => {
      api.sendMessage({
        body: `•—— FACEBOOK STALK ——•
🔹 Name: ${name}
🔹 First name: ${first_name}
🔹 UID: ${uid}
🔹 Username: ${username}
🔹 Created: ${created_time}
🔹 Profile: ${link_profile}
🔹 Gender: ${gender}
🔹 Relationship: ${relationship_status}
🔹 Lover: ${love}
🔹 Birthday: ${bday}
🔹 Followers: ${follower}
🔹 Website: ${web}
🔹 About: ${about}
🔹 Locale: ${locale}
🔹 Hometown: ${hometown}
🔹 Verified: ${is_verified ? "Yes ✅" : "No ❌"}
🔹 Quotes: ${quotes}
•—— END ——•`,
        attachment: fs.createReadStream(path)
      }, event.threadID, () => fs.unlinkSync(path), event.messageID);
    };

    request(encodeURI(avatar)).pipe(fs.createWriteStream(path)).on("close", cb);
  } catch (err) {
    api.sendMessage("❌ Error: " + err.message, event.threadID, event.messageID);
  }
};
