module.exports = {
    name: "sendmessage",
    description: "Send an anonymous message to a user by their UID.",
    author: "coffee",
    usage: "/sendmessage <UID> <message>",

    async execute(api, event, args, commands, prefix, admins, appState, sendMessage) {
        const { threadID, senderID } = event;

        // Restrict access to bot admins only
        if (!admins.includes(senderID)) {
            return sendMessage(api, { threadID, message: "❌ | You do not have permission to use this command." });
        }

      
        const userID = args[1];
        const messageContent = args.slice(1).join(" ");

        if (!userID || isNaN(userID)) {
            return sendMessage(api, { threadID, message: "⚠️ | Please provide a valid **User ID (UID)**." });
        }
        if (!messageContent) {
            return sendMessage(api, { threadID, message: "⚠️ | Please provide a **message** to send." });
        }

      
        const formattedMessage = `📩 | Message from an anonymous person\n\n${messageContent}\n\n___________________________________________________\n📒: *This bot is for educational purposes only.*`;

        try {
          
            await sendMessage(api, { threadID: userID, message: formattedMessage });

            
            sendMessage(api, { threadID, message: `✅ | Your message has been sent to **${userID}**.` });
        } catch (error) {
            console.error("Error sending message:", error);
            sendMessage(api, { threadID, message: "❌ | Failed to send the message. Please check the UID and try again." });
        }
    }
};
