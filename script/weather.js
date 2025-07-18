const axios = require('axios');

module.exports = {
  config: {
    name: "weather",
    aliases: ["forecast", "temp"],
    version: "1.0",
    author: "Homer Rebatis",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Check current weather"
    },
    longDescription: {
      en: "Get current weather and a 5-day forecast for any location"
    },
    category: "utilities",
    guide: {
      en: "{pn} <location>"
    }
  },

  onStart: async function ({ message, args }) {
    const location = args.join(" ");
    if (!location) {
      return message.reply("❌ Please enter a location.\nExample: `weather Manila`");
    }

    const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
    const url = `https://kaiz-apis.gleeze.com/api/weather?q=${encodeURIComponent(location)}&apikey=${apiKey}`;

    try {
      const res = await axios.get(url);
      const data = res.data["0"];

      if (!data || !data.current) {
        return message.reply("❌ Couldn't get weather data. Try a different location.");
      }

      const { location: loc, current, forecast } = data;

      const msg = 
`📍 Weather in ${loc.name}
🌤️ Condition: ${current.skytext}
🌡️ Temp: ${current.temperature}°C (Feels like ${current.feelslike}°C)
💧 Humidity: ${current.humidity}%
🌬️ Wind: ${current.winddisplay}
📅 Date: ${current.date}
🕒 Time: ${current.observationtime}

📆 5-Day Forecast:
${forecast.map(day =>
  `• ${day.day} (${day.date}): ${day.skytextday}, 🌡️ ${day.low}°C - ${day.high}°C, ☔ ${day.precip}%`
).join("\n")}
`;

      return message.reply({
        body: msg,
        attachment: await global.utils.getStreamFromURL(current.imageUrl)
      });

    } catch (err) {
      console.error(err);
      return message.reply("⚠️ Error fetching weather info. Please try again later.");
    }
  }
};
