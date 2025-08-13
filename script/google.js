// google.js
// Search via https://rapido.zetsu.xyz/api/google?q=
// Author: Homer Rebatis
// Credits: Pedro Pendoko (request)

const axios = require("axios");

module.exports.config = {
  name: "google",
  version: "1.0.2",
  role: 0, // Everyone can use, but restricted by bot admin check
  hasPrefix: true,
  aliases: ["g", "search"],
  description: "Search Google and return the top results.",
  usage: "google <query>\n\nExamples:\n• google goat bot commands\n• g how to center a div",
  credits: "Homer Rebatis"
};

module.exports.run = onStart;
module.exports.onStart = onStart;

async function onStart({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  // 🔒 Bot admin restriction check
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id == botID);

    if (!isBotAdmin) {
      return api.sendMessage(
        "🚫 Locked! To use this command, make the bot an admin in this group.",
        threadID,
        messageID
      );
    }
  } catch (err) {
    return api.sendMessage(
      "⚠️ Unable to verify bot admin status. Make sure the bot is admin to use this command.",
      threadID,
      messageID
    );
  }

  const query = args.join(" ").trim();
  if (!query) {
    return api.sendMessage(
      "🟡 Usage: google <query>\nExamples:\n• google goat bot commands\n• g how to center a div",
      threadID,
      messageID
    );
  }

  let placeholder;
  try {
    // Step 1: Send "typing..." placeholder message
    placeholder = await api.sendMessage("⌛ Searching Google...", threadID);

    const url = "https://rapido.zetsu.xyz/api/google?q=" + encodeURIComponent(query);
    const { data } = await axios.get(url, { timeout: 20000 });

    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      return api.editMessage(`🔍 No results found for: “${query}”`, placeholder.messageID);
    }

    // Format results
    const results = data.results.slice(0, 8);
    const lines = [];
    lines.push(`🔎 Google results for: “${query}”\n`);

    for (let i = 0; i < results.length; i++) {
      const r = results[i] || {};
      const title = r.title || "(no title)";
      const link = r.link || "";
      const snippet = (r.snippet || "").trim();
      const host = r.displayLink ? ` — ${r.displayLink}` : "";

      lines.push(`${i + 1}. ${title}`);
      lines.push(link);
      if (snippet) lines.push(snippet);
      if (host) lines.push(host);
      if (i !== results.length - 1) lines.push("");
    }

    lines.push("\n💡 Tip: Use quotes or site: to refine your search.\nExample:\n• google site:github.com goat bot facebook\n• google \"goat bot\" admin commands");

    // Step 2: Edit the placeholder message with results
    api.editMessage(lines.join("\n"), placeholder.messageID);

  } catch (err) {
    api.editMessage(
      "❌ Error fetching results.\n" +
        (err?.response?.status
          ? `Status: ${err.response.status}`
          : err?.code || err?.message || "Unknown error"),
      placeholder?.messageID || messageID
    );
  }
      }
