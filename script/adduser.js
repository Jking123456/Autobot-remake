const addCooldown = new Map(); // track last add time per thread

module.exports.config = {
    name: "adduser",
    version: "2.0.0",
    role: 0,
    aliases: ["add"],
    credits: "Homer Rebatis",
    description: "Add user to group by ID (with stealth mode)",
    cooldown: 0
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const botID = api.getCurrentUserID();
    const send = msg => api.sendMessage(msg, threadID, messageID);

    // Cooldown check
    const lastUsed = addCooldown.get(threadID) || 0;
    if (Date.now() - lastUsed < 60 * 1000) {
        return send("⏳ Please wait at least 1 minute before adding another user.");
    }

    // Input check
    if (!args[0]) return send("❌ Please enter a user ID or profile link.");

    // Get thread info
    const { participantIDs, approvalMode, adminIDs } = await api.getThreadInfo(threadID);
    const participantList = participantIDs.map(e => parseInt(e));

    // Determine target UID
    let targetID, targetName;
    if (!isNaN(args[0])) {
        targetID = parseInt(args[0]);
    } else {
        try {
            const [id, name, fail] = await getUID(args[0], api);
            if (fail && id != null) return send(id);
            if (fail && id == null) return send("❌ User ID not found.");
            targetID = parseInt(id);
            targetName = name || "Facebook User";
        } catch (e) {
            return send(`${e.name}: ${e.message}`);
        }
    }

    if (participantList.includes(targetID)) {
        return send(`ℹ️ ${targetName || "This member"} is already in the group.`);
    }

    // Ask for confirmation
    send(`⚠️ Confirm adding ${targetName || targetID}? Reply "yes" within 30s to proceed.`);

    const listener = api.listenMqtt(async (err, msg) => {
        if (err) return console.error(err);

        if (msg.senderID === senderID && msg.body?.toLowerCase() === "yes") {
            listener(); // stop listening after confirmation
            addCooldown.set(threadID, Date.now());

            // Random delay for stealth
            const delay = Math.floor(Math.random() * 9000) + 3000;
            send(`⏳ Adding ${targetName || targetID} in a few seconds...`);
            setTimeout(async () => {
                try {
                    await api.addUserToGroup(targetID, threadID);
                    if (approvalMode && !adminIDs.map(e => parseInt(e.id)).includes(botID)) {
                        send(`✅ Added ${targetName || "member"} to the approval list.`);
                    } else {
                        send(`✅ Successfully added ${targetName || "member"} to the group.`);
                    }
                } catch {
                    send(`❌ Can't add ${targetName || "user"} to the group.`);
                }
            }, delay);
        }
    });
};

// Dummy getUID function placeholder (replace with your actual implementation)
async function getUID(link, api) {
    return [null, null, true]; // Example fallback
}
