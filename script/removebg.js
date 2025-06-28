const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
  name: "removebg",
  version: "1.0.0",
  role: 0,
  credits: "Harith",
  aliases: [],
  usages: "< reply image >",
  cooldown: 2,
};

module.exports.run = async ({ api, event, args }) => {
  let pathie = __dirname + `/cache/removed-bg.jpg`;
  const { threadID, messageID } = event;

  // Get the image URL from the reply or from arguments
  var imageUrl = event.messageReply?.attachments[0]?.url || args.join(" ");

  try {
    api.sendMessage("⌛ 𝗥𝗲𝗺𝗼𝘃𝗶𝗻𝗴 𝗯𝗮𝗰𝗸𝗴𝗿𝗼𝘂𝗻𝗱 𝗶𝗺𝗮𝗴𝗲 𝗽𝗹𝗲𝗮𝘀𝗲 𝘄𝗮𝗶𝘁...", threadID, messageID);

    // Call the remove background API
    const removeBgUrl = `https://ccprojectsapis.zetsu.xyz/api/removebg?url=${encodeURIComponent(imageUrl)}`;

    // Fetch the processed image
    const img = (await axios.get(removeBgUrl, { responseType: "arraybuffer" })).data;

    // Save the image to the file system
    fs.writeFileSync(pathie, Buffer.from(img, 'utf-8'));

    // Send the processed image back to the user
    api.sendMessage({
      body: "🪄| 𝗕𝗮𝗰𝗸𝗴𝗿𝗼𝘂𝗻𝗱 𝗿𝗲𝗺𝗼𝘃𝗲𝗱 𝘀𝘂𝗰𝗰𝗲𝘀𝚜𝚏𝚞𝚕𝚕𝚢",
      attachment: fs.createReadStream(pathie)
    }, threadID, () => fs.unlinkSync(pathie), messageID);
  } catch (error) {
    api.sendMessage(`❌ 𝗘𝗿𝗿𝗼𝗿: ${error.message}`, threadID, messageID);
  }
};
                     
