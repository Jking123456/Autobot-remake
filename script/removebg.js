const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
  name: "removebg",
  version: "1.0.1",
  role: 0,
  credits: "Harith (Updated by ChatGPT)",
  aliases: [],
  usages: "< reply image >",
  cooldown: 2,
};

module.exports.run = async ({ api, event, args }) => {
  let pathie = __dirname + `/cache/removed-bg.png`;
  const { threadID, messageID } = event;

  // Get the image URL from reply or from args
  const imageUrl = event.messageReply?.attachments[0]?.url || args.join(" ");
  if (!imageUrl) {
    return api.sendMessage("❌ Please reply to an image or provide a valid image URL.", threadID, messageID);
  }

  try {
    api.sendMessage("⌛ Removing background, please wait...", threadID, messageID);

    // Step 1: Call the new removebgv3 API
    const apiUrl = `https://kaiz-apis.gleeze.com/api/removebgv3?url=${encodeURIComponent(imageUrl)}&stream=false&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;
    const response = await axios.get(apiUrl);
    const resultImageUrl = response.data.imageurl;

    if (!resultImageUrl) {
      throw new Error("No 'imageurl' returned from the API.");
    }

    // Step 2: Download the processed image
    const imageBuffer = (await axios.get(resultImageUrl, { responseType: "arraybuffer" })).data;

    // Step 3: Save to file
    fs.writeFileSync(pathie, Buffer.from(imageBuffer, 'utf-8'));

    // Step 4: Send the image back
    api.sendMessage({
      body: "🪄 Background removed successfully!",
      attachment: fs.createReadStream(pathie)
    }, threadID, () => fs.unlinkSync(pathie), messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
