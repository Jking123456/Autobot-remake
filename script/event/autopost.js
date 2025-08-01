const cron = require('node-cron');
const axios = require('axios');

module.exports.config = {
    name: "autopost",
    version: "1.0.0",
};

// Flag to ensure the cron job only runs once
let isCronStarted = false;

module.exports.handleEvent = async function({ api }) {
    if (!isCronStarted) {
        startAutoPost(api);
        isCronStarted = true;
    }
};

function startAutoPost(api) {
    cron.schedule("0 * * * *", async function () { // Runs every hour
        try {
            const response = await axios.get("https://xvi-rest-api.vercel.app/api/devquote");
            const { quote } = response.data;

            const message = `💻 𝗗𝗘𝗩 𝗤𝗨𝗢𝗧𝗘\n“${quote}”`;

            const formData = {
                input: {
                    composer_entry_point: "inline_composer",
                    composer_source_surface: "timeline",
                    idempotence_token: `${Date.now()}_FEED`,
                    source: "WWW",
                    message: {
                        text: message,
                    },
                    audience: {
                        privacy: {
                            base_state: "EVERYONE",
                        },
                    },
                    actor_id: api.getCurrentUserID(),
                },
            };

            const postResult = await api.httpPost(
                "https://www.facebook.com/api/graphql/",
                {
                    av: api.getCurrentUserID(),
                    fb_api_req_friendly_name: "ComposerStoryCreateMutation",
                    fb_api_caller_class: "RelayModern",
                    doc_id: "7711610262190099",
                    variables: JSON.stringify(formData),
                }
            );

            const postID = postResult.data.story_create.story.legacy_story_hideable_id;
            const postLink = `https://www.facebook.com/${api.getCurrentUserID()}/posts/${postID}`;

            api.sendMessage(`[AUTO POST]\nLink: ${postLink}`, /* add threadID if needed */);
            console.log(`[AUTO POST]\nLink: ${postLink}`);
        } catch (error) {
            console.error("❌ Error during auto-posting:", error.message || error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Manila",
    });
}
