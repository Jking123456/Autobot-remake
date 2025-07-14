const axios = require("axios");

module.exports.config = {
  name: "freesms",
  version: "1.2.0",
  role: 0,
  credits: "ChatGPT + You",
  description: "Send free SMS to PH numbers via LibreText (after manual CAPTCHA)",
  usages: "freesms 09xxxxxxxxx | your message",
  cooldowns: 10,
  hasPrefix: true
};

module.exports.run = async ({ api, event, args }) => {
  try {
    const input = args.join(" ").split("|").map(item => item.trim());

    if (input.length < 2) {
      return api.sendMessage(
        "❌ Incorrect usage.\n\n📌 Example:\nfreesms 09123456789 | Hello world!",
        event.threadID,
        event.messageID
      );
    }

    const [phone, message] = input;

    // Validate phone number
    if (!/^09\d{9}$/.test(phone)) {
      return api.sendMessage("❌ Invalid phone number. Must start with 09 and be 11 digits.", event.threadID, event.messageID);
    }

    // Validate message length
    if (message.length < 5 || message.length > 70) {
      return api.sendMessage("❌ Message must be between 5 and 70 characters.", event.threadID, event.messageID);
    }

    // Prepare form data (no CAPTCHA token included)
    const formData = new URLSearchParams();
    formData.append("phnumber", phone);
    formData.append("text", message);
    formData.append("cf-turnstile-response", ""); // Empty; assumes it's stored server-side

    // Inform user that it's attempting to send
    await api.sendMessage("⏳ Attempting to send your SMS... Please wait.", event.threadID);

    // Attempt to send SMS
    const res = await axios.post("https://kenlie.top/libretext/freesmsph.php", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      timeout: 15000
    });

    const { status, response } = res.data;

    if (status) {
      return api.sendMessage(
        `✅ SMS sent successfully!\n\n📱 To: ${phone}\n✉️ Message: ${message}`,
        event.threadID,
        event.messageID
      );
    } else {
      return api.sendMessage(
        `❌ Failed to send SMS.\n\n🔒 Make sure you visited this link and passed CAPTCHA recently:\n👉 https://kenlie.top/\n\n🛑 Reason: ${response}`,
        event.threadID,
        event.messageID
      );
    }

  } catch (err) {
    return api.sendMessage(`❌ An error occurred:\n${err.message}`, event.threadID, event.messageID);
  }
};
