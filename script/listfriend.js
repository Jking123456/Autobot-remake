const handleReply = [];

module.exports.config = {
    name: "listfriend",
    version: "1.1.0",
    role: 2,
    hasPrefix: false,
    credits: "cliff",
    description: "View friends information / Delete friends safely",
    usages: "",
    cooldown: 10 // increase cooldown for safety
};

module.exports.handleReply = async function ({ api, args, event }) {
    const { threadID, messageID, senderID } = event;
    const reply = handleReply.find(r => r.author === senderID);
    if (!reply) return;

    const { nameUser, urlUser, uidUser } = reply;

    if (event.type === "message_reply") {
        const selectedNumbers = event.body.split(" ").map(n => parseInt(n)).filter(n => !isNaN(n));

        // Limit bulk deletion to 3 friends per reply
        if (selectedNumbers.length > 3) {
            return api.sendMessage("⚠️ You can delete a maximum of 3 friends at a time.", threadID);
        }

        let msg = "💢Delete Friends💢\n\n";

        for (const num of selectedNumbers) {
            const index = num - 1;
            if (index >= 0 && index < nameUser.length) {
                const name = nameUser[index];
                const url = urlUser[index];
                const uid = uidUser[index];

                // Add a delay between API calls to reduce detection
                await api.unfriend(uid);
                await new Promise(res => setTimeout(res, 2000));

                msg += `- ${name}\n🌐ProfileUrl: ${url}\n`;
            }
        }

        return api.sendMessage(msg, threadID, () => api.unsendMessage(messageID));
    }
};

module.exports.run = async function ({ event, api, args }) {
    const { threadID, messageID, senderID, isGroup, isE2EE } = event;

    // Restrict to private chats only
    if (isGroup || isE2EE) {
        return api.sendMessage("🚫 This command is available only in private chats for safety.", threadID);
    }

    try {
        const dataFriend = await api.getFriendsList();
        const countFr = dataFriend.length;

        const nameUser = [], urlUser = [], uidUser = [];
        const limit = 10;
        let page = parseInt(args[0]) || 1;
        page = Math.max(page, 1);
        const numPage = Math.ceil(dataFriend.length / limit);

        let msg = `🎭DS INCLUDES ${countFr} FRIENDS🎭\n\n`;

        for (let i = limit * (page - 1); i < limit * page; i++) {
            if (i >= dataFriend.length) break;
            const friend = dataFriend[i];

            msg += `${i + 1}. ${friend.fullName || "Chưa đặt tên"}\n🙇‍♂️ID: ${friend.userID}\n🧏‍♂️Gender: ${friend.gender}\n❄️Vanity: ${friend.vanity}\n🌐Profile Url: ${friend.profileUrl}\n\n`;

            nameUser.push(friend.fullName || "Chưa đặt tên");
            urlUser.push(friend.profileUrl);
            uidUser.push(friend.userID);
        }

        msg += `✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏\n--> Page ${page}/${numPage} <--\nUse .friend page number/all\n\n`;
        msg += "🎭Reply numbers (1-10) separated by space to delete friends (max 3 at a time)!";

        return api.sendMessage(msg, threadID, (e, data) =>
            handleReply.push({
                author: senderID,
                messageID: data.messageID,
                nameUser,
                urlUser,
                uidUser
            })
        );

    } catch (e) {
        console.log(e);
        return api.sendMessage("❌ Error fetching friends list.", threadID);
    }
};
