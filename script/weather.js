const axios = require("axios");

module.exports.config = {
  name: "weather",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "Kaizenji (Modded by Homer Rebatis)",
  description: "Get current weather and forecast for a location.",
  commandCategory: "tools",
  usages: "weather [location]",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const location = args.join(" ");
    if (!location)
      return api.sendMessage("❗ Please provide a location.\n\nUsage: weather [location]", event.threadID, event.messageID);

    const res = await axios.get(`https://kaiz-apis.gleeze.com/api/weather?q=${encodeURIComponent(location)}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`);
    const data = res.data["0"];

    if (!data || !data.current) {
      return api.sendMessage("❌ Couldn't retrieve weather data. Please try a different location.", event.threadID, event.messageID);
    }

    const { location: loc, current, forecast } = data;

    const forecastText = forecast.slice(0, 3).map(day =>
      `📅 ${day.day} (${day.date}):
🌤 Condition: ${day.skytextday}
🌡 Low: ${day.low}°C | High: ${day.high}°C
🌧 Precipitation: ${day.precip}%`
    ).join("\n\n");

    const message = 
`🌍 Weather for: ${loc.name}
🕒 Observation Time: ${current.observationtime} (${current.day})
🌡 Temp: ${current.temperature}°C (Feels like: ${current.feelslike}°C)
🌥 Sky: ${current.skytext}
💧 Humidity: ${current.humidity}%
🌬 Wind: ${current.winddisplay}

📆 3-Day Forecast:
${forecastText}

📸 Icon: ${current.imageUrl}
`;

    return api.sendMessage(message, event.threadID, event.messageID);

  } catch (error) {
    console.error("Weather command error:", error);
    return api.sendMessage("❌ Error occurred while fetching weather data.", event.threadID, event.messageID);
  }
};
