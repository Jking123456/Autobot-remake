const axios = require('axios');

module.exports.config = {
  name: "auto-comment",
  version: "1.0.0",
  permission: 2,
  credits: "GoatGPT",
  description: "Auto-reply to comments on a given FB post link using Bossing API (Graph API)",
  commandCategory: "automation",
  usages: "[post link | stop]",
  cooldowns: 5
};

function getPostIdFromUrl(url) {
  if (!url) return null;
  let match;
  // direct numeric id
  match = url.match(/^(\d+)$/);
  if (match) return match[1];

  // /posts/12345
  match = url.match(/\/posts\/(\d+)/);
  if (match) return match[1];

  // /groups/\d+/posts/12345
  match = url.match(/\/groups\/\d+\/posts\/(\d+)/);
  if (match) return match[1];

  // photo.php?fbid=12345
  match = url.match(/fbid=(\d+)/);
  if (match) return match[1];

  // story.php?story_fbid=12345
  match = url.match(/story_fbid=(\d+)/);
  if (match) return match[1];

  // permalink.php?story_fbid=12345&id=...
  match = url.match(/permalink\.php\?story_fbid=(\d+)/);
  if (match) return match[1];

  // last-resort: numeric after underscore in /{pageid}_{postid}
  match = url.match(/_(\d+)(?:\/|$)/);
  if (match) return match[1];

  return null;
}

// active jobs per thread (or per user — keyed by threadID here)
const activeJobs = {};

module.exports.run = async function ({ api, event, args }) {
  try {
    const threadID = event.threadID;
    const senderID = event.senderID;
    const input = (args || []).join(' ').trim();

    if (!input) {
      return api.sendMessage('❌ Usage: auto-comment <post link|postID>  — or: auto-comment stop', threadID);
    }

    if (input.toLowerCase() === 'stop') {
      if (activeJobs[threadID]) {
        clearInterval(activeJobs[threadID].interval);
        delete activeJobs[threadID];
        return api.sendMessage('🛑 Auto-comment stopped.', threadID);
      } else {
        return api.sendMessage('❌ No active auto-comment job found for this chat.', threadID);
      }
    }

    // Extract post ID
    const postID = getPostIdFromUrl(input);
    if (!postID) return api.sendMessage('❌ Could not extract a post ID from that link. Paste the full permalink or the numeric post ID.', threadID);

    // Get access token from app state (fca / similar)
    const appState = api.getAppState ? api.getAppState() : null;
    const ACCESS_TOKEN = (appState && (appState.accessToken || appState.access_token)) || process.env.FB_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) return api.sendMessage('❌ No Facebook access token available. Make sure your bot/session has an access token (appState.accessToken).', threadID);

    // Prevent duplicate jobs for same thread/post
    if (activeJobs[threadID]) {
      return api.sendMessage('❌ There is already an active auto-comment job in this chat. Stop it first with `auto-comment stop`.', threadID);
    }

    // bookkeeping
    const botId = api.getCurrentUserID ? api.getCurrentUserID() : null;
    const replied = new Set();
    // track last time we checked -> fetch only newer comments using since param
    let lastSince = Math.floor(Date.now() / 1000);

    api.sendMessage(`✅ Auto-comment started for post ID: ${postID}\nChecking every 12s. Replying with Bossing API output.`, threadID);

    // interval job
    const interval = setInterval(async () => {
      try {
        // fetch latest comments (graph API v16.0+)
        // fields: id,message,from{id,name},created_time
        const commentsUrl = `https://graph.facebook.com/v16.0/${postID}/comments`;
        const res = await axios.get(commentsUrl, {
          params: {
            access_token: ACCESS_TOKEN,
            fields: 'id,message,from{id,name},created_time',
            order: 'chronological',
            limit: 25,
            since: lastSince
          },
          timeout: 15000
        });

        const data = res.data && res.data.data ? res.data.data : [];
        if (!data.length) return;

        // update since to the newest comment time to avoid re-fetching same ones next time
        const newestTime = data.reduce((max, c) => {
          const t = Math.floor(new Date(c.created_time).getTime() / 1000);
          return t > max ? t : max;
        }, lastSince);
        lastSince = Math.max(lastSince, newestTime);

        for (const c of data) {
          try {
            if (!c || !c.id) continue;
            if (replied.has(c.id)) continue;
            if (c.from && botId && String(c.from.id) === String(botId)) continue; // skip bot's own comments

            // call Bossing API with comment text as prompt
            const bossingRes = await axios.get('https://markdevs-last-api-p2y6.onrender.com/bossing', {
              params: {
                prompt: c.message || '',
                uid: 1
              },
              timeout: 15000
            }).catch(e => null);

            const replyText = bossingRes && bossingRes.data && bossingRes.data.response
              ? bossingRes.data.response
              : `🐐 Bossing, hindi nag-reply ang Bossing API.`;

            // post reply using Graph API to comment id (reply to comment)
            const postReplyUrl = `https://graph.facebook.com/v16.0/${c.id}/comments`;
            await axios.post(postReplyUrl, null, {
              params: {
                message: replyText,
                access_token: ACCESS_TOKEN
              },
              timeout: 15000
            });

            replied.add(c.id);
            console.log(`Replied to comment ${c.id} (by ${c.from?.name || c.from?.id})`);
            // small delay between replies to reduce risk of rate limit loops
            await new Promise(r => setTimeout(r, 1500));
          } catch (innerErr) {
            console.error('Reply error for comment', c.id, innerErr?.response?.data || innerErr.message || innerErr);
          }
        }
      } catch (err) {
        console.error('Fetch comments error:', err?.response?.data || err?.message || err);
      }
    }, 12 * 1000); // every 12 seconds

    // store job so it can be stopped
    activeJobs[threadID] = { postID, interval, startedBy: senderID };

  } catch (e) {
    console.error(e);
    return api.sendMessage('❌ Unexpected error starting auto-comment. Check console for details.', event.threadID);
  }
};
