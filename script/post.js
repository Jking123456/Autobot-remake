module.exports.config = {
  name: "post",
  version: "1.0.2",
  role: 1,
  credits: "NTKhang",
  description: "Create a new post in acc bot (Admin only in groups).",
  commandCategory: "Tiện ích",
  cooldowns: 60, // 60 seconds per user
  hasPrefix: true
};

const activeCooldowns = new Map(); // Track user cooldowns

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID, isGroup } = event;

  // Check admin only in groups
  if (isGroup) {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    if (!threadInfo.adminIDs.some(admin => admin.id === botID)) {
      return api.sendMessage(
        "⚠️ I need to be an admin in this group to create posts. Please promote me to admin first.",
        threadID,
        messageID
      );
    }
  }

  // Check cooldown
  const now = Date.now();
  if (activeCooldowns.has(senderID) && now - activeCooldowns.get(senderID) < 60000) { // 60 sec
    return api.sendMessage("⏱️ Please wait before creating another post.", threadID, messageID);
  }
  activeCooldowns.set(senderID, now);

  const uuid = getGUID();
  const formData = {
    input: {
      composer_entry_point: "inline_composer",
      composer_source_surface: "timeline",
      idempotence_token: uuid + "_FEED",
      source: "WWW",
      attachments: [],
      audience: { privacy: { allow: [], base_state: "FRIENDS", deny: [], tag_expansion_state: "UNSPECIFIED" } },
      message: { ranges: [], text: "" },
      with_tags_ids: [],
      inline_activities: [],
      explicit_place_id: "0",
      text_format_preset_id: "0",
      logging: { composer_session_id: uuid },
      tracking: [null],
      actor_id: api.getCurrentUserID(),
      client_mutation_id: Math.floor(Math.random() * 17)
    },
    displayCommentsFeedbackContext: null,
    feedLocation: "TIMELINE",
    isTimeline: true
  };

  const audienceOptions = { "1": "EVERYONE", "2": "FRIENDS", "3": "SELF" };
  const audienceChoice = args[0];
  const content = args.slice(1).join(" ");

  if (!audienceOptions[audienceChoice]) {
    return api.sendMessage("Invalid audience choice. Please choose 1, 2, or 3.", threadID, messageID);
  }

  formData.input.audience.privacy.base_state = audienceOptions[audienceChoice];
  formData.input.message.text = content;

  // Random delay 2–5 seconds to mimic human behavior
  const randomDelay = Math.floor(Math.random() * 3000) + 2000;
  await wait(randomDelay);

  try {
    const postResult = await createPost(api, formData);
    return api.sendMessage(
      `✅ Post created successfully:\nPost ID: ${postResult.postID}\nPost URL: ${postResult.postURL}`,
      threadID,
      messageID
    );
  } catch (error) {
    console.error("Error creating post:", error);
    return api.sendMessage("❌ Failed to create post. Please try again later.", threadID, messageID);
  }
};

// Utility: random delay
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createPost(api, formData) {
  return new Promise((resolve, reject) => {
    const form = {
      av: api.getCurrentUserID(),
      fb_api_req_friendly_name: "ComposerStoryCreateMutation",
      fb_api_caller_class: "RelayModern",
      doc_id: "7711610262190099",
      variables: JSON.stringify(formData)
    };

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "X-FB-LSD": api.getLSD ? api.getLSD() : "",
      "Cookie": api.getCookie ? api.getCookie() : ""
    };

    api.httpPost('https://www.facebook.com/api/graphql/', form, { headers }, (error, result) => {
      if (error) return reject(error);
      try {
        const responseData = JSON.parse(result.replace("for (;;);", ""));
        const postID = responseData.data.story_create.story.legacy_story_hideable_id;
        const postURL = responseData.data.story_create.story.url;
        resolve({ postID, postURL });
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// Utility: generate GUID
function getGUID() {
  let sectionLength = Date.now();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = Math.floor((sectionLength + Math.random() * 16) % 16);
    sectionLength = Math.floor(sectionLength / 16);
    return (c === "x" ? r : (r & 7) | 8).toString(16);
  });
}
