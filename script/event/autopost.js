const axios = require('axios');
const moment = require('moment-timezone');

const fontMap = {
  'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪', 'j': '𝘫', 'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 
  'n': '𝘯', 'o': '𝘰', 'p': '𝘱', 'q': '𝘲', 'r': '𝘳', 's': '𝘴', 't': '𝘵', 'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻',
  'A': '𝘈', 'B': '𝘉', 'C': '𝘊', 'D': '𝘋', 'E': '𝘌', 'F': '𝘍', 'G': '𝘎', 'H': '𝘏', 'I': '𝘐', 'J': '𝘑', 'K': '𝘒', 'L': '𝘓', 'M': '𝘔',
  'N': '𝘕', 'O': '𝘖', 'P': '𝘗', 'Q': '𝘘', 'R': '𝘙', 'S': '𝘚', 'T': '𝘛', 'U': '𝘜', 'V': '𝘝', 'W': '𝘞', 'X': '𝘟', 'Y': '𝘠', 'Z': '𝘡'
};

function mapToFont(text) {
  return text.split('').map(char => fontMap[char] || char).join('');
}

module.exports.config = {
  name: "auto-post",
  version: "1.0.1",
};

let isAutoPostStarted = false;

module.exports.handleEvent = async function({ api }) {
  if (!isAutoPostStarted) {
    startAutoPost(api);
    isAutoPostStarted = true;
  }
};

async function startAutoPost(api) {
  const checkTimeAndPost = async () => {
    try {
      // Fetch from new API
      const { data } = await axios.get("https://wildan-suldyir-apis.vercel.app/api/devquote");
      const quoteText = mapToFont(data.quote);
      const quoteAuthor = mapToFont(data.creator || 'Unknown');
      const quoteMessage = `✨ 𝘋𝘦𝘷 𝘘𝘶𝘰𝘵𝘦:\n\n"${quoteText}"\n\n- ${quoteAuthor}`;

      // Prepare FB post
      const formData = {
        input: {
          composer_entry_point: "inline_composer",
          composer_source_surface: "timeline",
          idempotence_token: `${Date.now()}_FEED`,
          source: "WWW",
          message: { text: quoteMessage },
          audience: { privacy: { base_state: "EVERYONE" } },
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
      console.log(`[AUTO POST] Successful Post! Link: ${postLink}`);
    } catch (error) {
      console.error("Error during auto-posting:", error);
    }

    // Wait 2 hours before next post
    setTimeout(checkTimeAndPost, 2 * 60 * 60 * 1000);
  };

  checkTimeAndPost();
}
