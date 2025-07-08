const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
  name: "removebg",
  version: "1.0.0",
  role: 0,
  credits: "Harith (Updated by ChatGPT)",
  aliases: [],
  usages: "< reply image >",
  cooldown: 2,
};

module.exports.run = async ({ api, event, args }) => {
  let pathie = __dirname + `/cache/removed-bg.jpg`;
  const { threadID, messageID } = event;

  // Get the image URL from the reply or from arguments
  var imageUrl = event.messageReply?.attachments[0]?.url || args.join(" ");
  if (!imageUrl) return api.sendMessage("❌ Please reply to an image or provide a valid image URL.", threadID, messageID);

  try {
    api.sendMessage("⌛ Removing background, please wait...", threadID, messageID);

    // Step 1: Call the removebg API and get the JSON response
    const apiUrl = `https://kaiz-apis.gleeze.com/api/removebg?url=${encodeURIComponent(imageUrl)}&stream=false&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;
    const response = await axios.get(apiUrl);
    const resultImageUrl = response.data.url;

    if (!resultImageUrl) throw new Error("No image URL returned from API.");

    // Step 2: Fetch the actual image using the URL from the JSON response
    const img = (await axios.get(resultImageUrl, { responseType: "arraybuffer" })).data;

    // Step 3: Save the image to file
    fs.writeFileSync(pathie, Buffer.from(img, 'utf-8'));

    // Step 4: Send the processed image
    api.sendMessage({
      body: "🪄 Background removed successfully!",
      attachment: fs.createReadStream(pathie)
    }, threadID, () => fs.unlinkSync(pathie), messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
