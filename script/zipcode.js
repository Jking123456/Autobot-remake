const axios = require("axios");

module.exports.config = {
  name: "zipcode",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis",
  description: "Lookup Philippine location info from a ZIP code.",
  commandCategory: "tools",
  usages: "zipcode [zipcode]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const zip = args.join(" ").trim();
  if (!zip)
    return api.sendMessage("📮 Please provide a ZIP code.\n\nUsage: zipcode [zipcode]", event.threadID, event.messageID);

  const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
  const url = `https://kaiz-apis.gleeze.com/api/zipcodeinfo?country=ph&zipcode=${encodeURIComponent(zip)}&apikey=${apiKey}`;

  try {
    const res = await axios.get(url);
    const data = res.data;

    if (!data["post code"] || !data.places || data.places.length === 0) {
      return api.sendMessage("❌ ZIP code not found or invalid.", event.threadID, event.messageID);
    }

    const place = data.places[0];

    const message = 
`📍 ZIP Code Info (PH)

📬 ZIP Code: ${data["post code"]}
📦 Location: ${place["place name"]}
🌍 Country: ${data.country} (${data["country abbreviation"]})
📌 Coordinates: ${place.latitude}, ${place.longitude}`;

    return api.sendMessage(message, event.threadID, event.messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("⚠️ Error retrieving ZIP code info. Please try again later.", event.threadID, event.messageID);
  }
};
