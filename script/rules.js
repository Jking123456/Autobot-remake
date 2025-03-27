module.exports = {

    name: "rules",

    author: "Aljur Pogoy",

    description: "Displays the chatbot rules.",

    

    run: async ({ api, event }) => {

        const { threadID, messageID } = event;

        const rules = [

            "1. Be respectful to everyone, including the bot.",

            "2. No spamming commands.",

            "3. Avoid excessive use of capital letters.",

            "4. Do not abuse the bot for trolling or harassment.",

            "5. No NSFW (Not Safe for Work) content.",

            "6. Do not try to exploit bugs or glitches.",

            "7. Avoid excessive flooding (repeating messages rapidly).",

            "8. Do not impersonate an admin or the bot.",

            "9. The bot is not responsible for any personal data shared.",

            "10. Do not send links that may contain malicious content.",

            "11. The bot has the right to mute or ban users who violate rules.",

            "12. Admins can update these rules anytime if needed.",

            "13. Do not request admin privileges through the bot.",

            "14. No self-promotion, advertisements, or scams.",

            "15. Follow all Facebook and Messenger community guidelines.",

            "16. The bot does not tolerate hate speech or discrimination.",

            "17. If the bot malfunctions, report to an admin instead of abusing it.",

            "18. The bot cannot provide illegal or sensitive content.",

            "19. Commands may be logged for security purposes.",

            "20. Have fun and use the bot responsibly."

        ];

        const message = `Cid Kagenou Bot Rules\n\n${rules.join("\n")}\n\nBreaking these rules may result in restrictions.`;

        api.sendMessage(message, threadID, messageID);

    }

};