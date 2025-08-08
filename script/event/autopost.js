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
  version: "1.0.0",
};

let isAutoPostStarted = false;

module.exports.handleEvent = async function({ api }) {
  if (!isAutoPostStarted) {
    startAutoPost(api);
    isAutoPostStarted = true;
  }
};

async function startAutoPost(api) {
  const postData = {
    "00:00": {},
    "01:00": {},
    "02:00": {},
    "03:00": {},
    "04:00": {},
    "05:00": {},
    "06:00": {},
    "07:00": {},
    "08:00": {},
    "09:00": {},
    "10:00": {},
    "11:00": {},
    "12:00": {},
    "13:00": {},
    "14:00": {},
    "15:00": {},
    "16:00": {},
    "17:00": {},
    "18:00": {},
    "19:00": {},
    "20:00": {},
    "21:00": {},
    "22:00": {},
    "23:00": {}
  };


  const response = await axios.get("https://raw.githubusercontent.com/JamesFT/Database-Quotes-JSON/master/quotes.json");
  const quotes = response.data;

  const checkTimeAndPost = async () => {
    const now = moment().tz('Asia/Manila');
    const currentTime = now.format('HH:mm');

    if (postData[currentTime]) {
      try {

        const randomIndex = Math.floor(Math.random() * quotes.length);
        const randomQuote = quotes[randomIndex];
        const quoteText = mapToFont(randomQuote.quoteText); 
        const quoteAuthor = mapToFont(randomQuote.quoteAuthor || 'Unknown'); 
        const quoteMessage = `✨ 𝘋𝘢𝘪𝘭𝘺 𝘔𝘰𝘵𝘪𝘷𝘢𝘵𝘪𝘰𝘯:\n\n"${quoteText}"\n\n- ${quoteAuthor}`;

        const formData = {
          input: {
            composer_entry_point: "inline_composer",
            composer_source_surface: "timeline",
            idempotence_token: `${Date.now()}_FEED`,
            source: "WWW",
            message: {
              text: quoteMessage,
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
        console.log(`[AUTO POST] Successful Post! Link: ${postLink}`);
      } catch (error) {
        console.error("Error during auto-posting:", error);
      }
    }

    const nextHour = moment().add(1, 'hour').startOf('hour');
    const delay = nextHour.diff(moment());
    setTimeout(checkTimeAndPost, delay);
  };
  checkTimeAndPost();
}
