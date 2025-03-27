module.exports = {

    name: "userinfo",

    description: "Displays your user information.",

    async run({ api, event }) {

        const { senderID, threadID } = event;

        try {

            const userInfo = await api.getUserInfo(senderID);

            const user = userInfo[senderID];

            const message = `👤User Info\n\n` +

                `🔹 Name: ${user.name}\n` +

                `🔹 User ID: ${senderID}\n` +

                `🔹 Gender: ${user.gender === 1 ? "Female" : "Male"}\n` +

                `🔹 Profile URL: ${user.profileUrl}`;

            api.sendMessage(message, threadID);

        } catch (error) {

            console.error(error);

            api.sendMessage("❌ Failed to fetch user info.", threadID);

        }

    }

};