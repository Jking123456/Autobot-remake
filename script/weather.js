const axios = require('axios');

module.exports = {
  config: {
    name: "weather",
    aliases: ["forecast", "weather"],
    version: "1.0",
    author: "YourName",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Get current weather info"
    },
    longDescription: {
      en: "Fetches and displays the current weather and forecast for a given location"
    },
    category: "utilities",
    guide: {
      en: "{pn} <location>"
    }
  },

  onStart: async function ({ message, args }) {
    const location = args.join(" ");
    if (!location) {
      return message.reply("❌ Please provide a location.\nExample: `weather Mandaluyong`");
    }

    const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
    const apiUrl = `https://kaiz-apis.gleeze.com/api/weather?q=${encodeURIComponent(location)}&apikey=${apiKey}`;

    try {
      const res = await axios.get(apiUrl);
      const data = res.data["0"];

      if (!data || !data.current) {
        return message.reply("❌ Couldn't retrieve weather information. Please try a different location.");
      }

      const { location: loc, current, forecast } = data;

      const msg = 
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

      message.reply({
        body: msg,
        attachment: await global.utils.getStreamFromURL(current.imageUrl)
      });

    } catch (error) {
      console.error(error);
      message.reply("⚠️ An error occurred while fetching the weather.");
    }
  }
};
