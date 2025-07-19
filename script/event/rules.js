module.exports.config = {
  name: "rules",
  eventType: ["log:subscribe"],
  version: "1.0.0",
  credits: "Aminulsordar",
  description: "Notify group of rules when new members are added",
  dependencies: {
    "fs-extra": ""
  }
};

module.exports.run = async function ({ api, event }) {
  const { threadID } = event;

  // If bot was added to the group, send a different message
  if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
    return api.sendMessage("🤖 Thank you for adding me! Type 'help' to see all my commands.", threadID);
  }

  // Define group rules message
  const rules = `🌟 𝗚𝗿𝗼𝘂𝗽 𝗥𝘂𝗹𝗲𝘀 🌟

1️⃣ 𝗡𝗼 𝗦𝗽𝗮𝗺𝗺𝗶𝗻𝗴  
Please avoid excessive messages or repeated content.

2️⃣ 𝗕𝗲 𝗥𝗲𝘀𝗽𝗲𝗰𝘁𝗳𝘂𝗹  
No hate speech, bullying, or discrimination.

3️⃣ 𝗡𝗼 𝗜𝗹𝗹𝗲𝗴𝗮𝗹 𝗖𝗼𝗻𝘁𝗲𝗻𝘁  
Strictly avoid illegal or explicit content.

4️⃣ 𝗙𝗼𝗹𝗹𝗼𝘄 𝗔𝗱𝗺𝗶𝗻 𝗥𝘂𝗹𝗲𝘀  
Respect any pinned rules or admin guidance.

5️⃣ 𝗕𝗲 𝗔𝗰𝘁𝗶𝘃𝗲  
Inactive members may be removed.

6️⃣ 𝗥𝗲𝘀𝗽𝗲𝗰𝘁 𝗘𝘃𝗲𝗿𝘆𝗼𝗻𝗲  
Admins and members deserve respect equally.

7️⃣ 𝗡𝗼 𝗦𝗲𝗲𝗻𝗲𝗿 𝗧𝗮𝗴𝘀  
Avoid ignoring replies intentionally.

8️⃣ 𝗡𝗼 𝗥𝗼𝗹𝗲𝗽𝗹𝗮𝘆𝗶𝗻𝗴  
Keep conversations genuine.

9️⃣ 𝗦𝘂𝗽𝗽𝗼𝗿𝘁 𝗘𝗮𝗰𝗵 𝗢𝘁𝗵𝗲𝗿  
Promote a kind and helpful environment.

⚠️ 𝗕𝗿𝗲𝗮𝗸𝗶𝗻𝗴 𝗿𝘂𝗹𝗲𝘀 𝗺𝗮𝘆 𝗹𝗲𝗮𝗱 𝘁𝗼 𝗿𝗲𝗺𝗼𝘃𝗮𝗹 𝘄𝗶𝘁𝗵𝗼𝘂𝘁 𝘄𝗮𝗿𝗻𝗶𝗻𝗴.  
Let's keep this group respectful and safe for everyone. Thank you! 🙏`;

  try {
    for (const participant of event.logMessageData.addedParticipants) {
      const userID = participant.userFbId;
      if (userID === api.getCurrentUserID()) continue;
      await api.sendMessage(rules, threadID);
    }
  } catch (err) {
    console.error("[RULES ERROR]:", err);
  }
};
