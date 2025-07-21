module.exports.config = {
  name: "all",
  version: "1.0.4",
  hasPermission: 1, // fixed typo
  credits: "Homer Rebatis",
  description: "Tag all members",
  commandCategory: "system",
  usages: "[Text]",
  cooldowns: 80
};

module.exports.run = async function({ api, event, args }) {
  try {
    const botID = api.getCurrentUserID();
    const listUserID = event.participantIDs.filter(ID => ID !== botID);
    
    let body = (args.length !== 0 ? args.join(" ") + "\n" : "Mentioning all:\n");
    let mentions = [];

    for (const id of listUserID) {
      const tag = "@user";
      mentions.push({ id, tag });
      body += `${tag} `;
    }

    return api.sendMessage({ body, mentions }, event.threadID, event.messageID);

  } catch (e) {
    console.log(e);
  }
};
