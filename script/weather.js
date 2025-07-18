const axios = require("axios");

module.exports.config = {
  name: "weather",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "YourName",
  description: "Get current weather and 5-day forecast.",
  commandCategory: "utilities",
  usages: "weather <location>",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const location = args.join(" ");
  if (!location) {
    return api.sendMessage("❗ Please provide a location.\n\nUsage: weather <location>", event.threadID, event.messageID);
  }

  const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
  const url = `https://kaiz-apis.gleeze.com/api/weather?q=${encodeURIComponent(location)}&apikey=${apiKey}`;

  try {
    const res = await axios.get(url);
    const data = res.data["0"];

    if (!data || !data.current) {
      return api.sendMessage("❌ Couldn't find weather data for that location.", event.threadID, event.messageID);
    }

    const { location: loc, current, forecast } = data;

    const message = 
`📍 Weather in ${loc.name}
🌤️ Condition: ${current.skytext}
🌡️ Temperature: ${current.temperature}°C (Feels like ${current.feelslike}°C)
💧 Humidity: ${current.humidity}%
🌬️ Wind: ${current.winddisplay}
📅 Date: ${current.date}
🕒 Time: ${current.observationtime}

📆 5-Day Forecast:
${forecast.map(day =>
  `• ${day.day} (${day.date}): ${day.skytextday}, 🌡️ ${day.low}°C - ${day.high}°C, ☔ ${day.precip}%`
).join("\n")}
`;

    const imageStream = await global.utils.getStreamFromURL(current.imageUrl);

    return api.sendMessage({ body: message, attachment: imageStream }, event.threadID, event.messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("⚠️ Error fetching weather data. Try again later.", event.threadID, event.messageID);
  }
};
