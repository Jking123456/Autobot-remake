const cron = require('node-cron');
const axios = require('axios');

module.exports.config = {
    name: "autopost",
    version: "1.0.0",
};

// Flag to ensure the cron job only runs once
let isCronStarted = false;

module.exports.handleEvent = async function({ api, event }) {
    if (!isCronStarted) {
        startAutoPost(api, event.threadID);
        isCronStarted = true;
    }
};

function startAutoPost(api, threadID) {
    cron.schedule("0 * * * *", async function () {
        try {
            const response = await axios.get("https://catfact.ninja/fact");
            const catFact = response.data.fact;

            const message = `𝚁𝙰𝙽𝙳𝙾𝙼 𝙲𝙰𝚃 𝙵𝙰𝙲𝚃 meow: “${catFact}”`;

            const userID = api.getCurrentUserID?.();
            if (!userID) {
                console.error("Error: Unable to get user ID.");
                return;
            }

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
                    actor_id: userID,
                },
            };

            const postResult = await api.httpPost(
                "https://www.facebook.com/api/graphql/",
                {
                    av: userID,
                    fb_api_req_friendly_name: "ComposerStoryCreateMutation",
                    fb_api_caller_class: "RelayModern",
                    doc_id: "7711610262190099",
                    variables: JSON.stringify(formData),
                }
            );

            const postID = postResult?.data?.story_create?.story?.legacy_story_hideable_id;

            if (postID) {
                const postLink = `https://www.facebook.com/${userID}/posts/${postID}`;
                api.sendMessage(`[AUTO POST]\nLink: ${postLink}`, threadID);
                console.log(`[AUTO POST]\nLink: ${postLink}`);
            } else {
                console.error("Auto-post succeeded but post ID was not returned.");
            }
        } catch (error) {
            console.error("Error during auto-posting:", error.message || error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Manila",
    });
                  }
