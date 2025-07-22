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
  const { threadID, messageID } = event;
  let pathie = __dirname + `/cache/removed-bg.png`;

  // ✅ Check if bot is admin in the group
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 This command is disabled in this group because the bot is not an admin.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("Admin check error:", err);
    return api.sendMessage("⚠️ Unable to verify admin status. Please try again later.", threadID, messageID);
  }

  // Get the image URL from reply or from args
  const imageUrl = event.messageReply?.attachments[0]?.url || args.join(" ");
  if (!imageUrl) {
    return api.sendMessage("❌ Please reply to an image or provide a valid image URL.", threadID, messageID);
  }

  try {
    api.sendMessage("⌛ Removing background, please wait...", threadID, messageID);

    // Call the API
    const apiUrl = `https://kaiz-apis.gleeze.com/api/removebgv3?url=${encodeURIComponent(imageUrl)}&stream=false&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;
    const response = await axios.get(apiUrl);
    const resultImageUrl = response.data.imageurl;

    if (!resultImageUrl) {
      throw new Error("No 'imageurl' returned from the API.");
    }

    // Download the image
    const imageBuffer = (await axios.get(resultImageUrl, { responseType: "arraybuffer" })).data;

    // Save to file
    fs.writeFileSync(pathie, Buffer.from(imageBuffer, 'utf-8'));

    // Send the image back
    api.sendMessage({
      body: "🪄 Background removed successfully!",
      attachment: fs.createReadStream(pathie)
    }, threadID, () => fs.unlinkSync(pathie), messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
