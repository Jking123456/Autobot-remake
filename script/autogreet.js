var cron = require("node-cron");

// Function to send greetings
function sendGreeting(message) {
  // Replace this with your code to send the greeting message
  console.log(message);
}

cron.schedule('0 0 6 * * *', () => {
  sendGreeting("Good morning everyone! It's time to wake up.");
}, {
  scheduled: true,
  timezone: "Asia/Manila"
});

cron.schedule('0 0 9 * * *', () => {
  sendGreeting("Good morning! Have a great day ahead.");
}, {
  scheduled: true,
  timezone: "Asia/Manila"
});

cron.schedule('0 0 12 * * *', () => {
  api.getThreadList(30, null, ["INBOX"], (err, list) => {
    if (err) return console.log("ERR: " + err);
    list.forEach(now => (now.isGroup == true && now.threadID != list.threadID) ?
      api.sendMessage("Good afternoon! It's lunchtime.", now.threadID) : '');
  });
}, {
  scheduled: true,
  timezone: "Asia/Manila"
});

cron.schedule('0 0 13 * * *', () => {
  api.getThreadList(30, null, ["INBOX"], (err, list) => {
    if (err) return console.log("ERR: " + err);
    list.forEach(now => (now.isGroup == true && now.threadID != list.threadID) ?
      api.sendMessage("Good afternoon everyone!", now.threadID) : '');
  });
}, {
  scheduled: true,
  timezone: "Asia/Manila"
});

cron.schedule('0 0 15 * * *', () => {
  api.getThreadList(30, null, ["INBOX"], (err, list) => {
    if (err) return console.log("ERR: " + err);
    list.forEach(now => (now.isGroup == true && now.threadID != list.threadID) ?
      api.sendMessage("Hello there! It's 3:00 PM.", now.threadID) : '');
  });
}, {
  scheduled: true,
  timezone: "Asia/Manila"
});

cron.schedule('0 0 17 * * *', () => {
  api.getThreadList(30, null, ["INBOX"], (err, list) => {
    if (err) return console.log("ERR: " + err);
    list.forEach(now => (now.isGroup == true && now.threadID != list.threadID) ?
      api.sendMessage("Good afternoon! It's 5:00 PM.", now.threadID) : '');
  });
}, {
  scheduled: true,
  timezone: "Asia/Manila"
});

cron.schedule('0 0 18 * * *', () => {
  api.getThreadList(30, null, ["INBOX"], (err, list) => {
    if (err) return console.log("ERR: " + err);
    list.forEach(now => (now.isGroup == true && now.threadID != list.threadID) ?
      api.sendMessage("Good evening! It's 6:00 PM.", now.threadID) : '');
  });
}, {
  scheduled: true,
  timezone: "Asia/Manila"
});

cron.schedule('0 0 19 * * *', () => {
  api.getThreadList(30, null, ["INBOX"], (err, list) => {
    if (err) return console.log("ERR: " + err);
    list.forEach(now => (now.isGroup == true && now.threadID != list.threadID) ?
      api.sendMessage("Good evening! It's dinner time.", now.threadID) : '');
  });
}, {
  scheduled: true,
  timezone: "Asia/Manila"
});

cron.schedule('0 0 21 * * *', () => {
  api.getThreadList(30, null, ["INBOX"], (err, list) => {
    if (err) return console.log("ERR: " + err);
    list.forEach(now => (now.isGroup == true && now.threadID != list.threadID) ?
      api.sendMessage("Good evening! It's 9:00 PM.", now.threadID) : '');
  });
}, {
  scheduled: true,
  timezone: "Asia/Manila"
});

cron.schedule('0 0 22 * * *', () => {
  api.getThreadList(30, null, ["INBOX"], (err, list) => {
    if (err) return console.log("ERR: " + err);
    list.forEach(now => (now.isGroup == true && now.threadID != list.threadID) ?
      api.sendMessage("Goodnight everyone! Sweet dreams.", now.threadID) : '');
  });
}, {
  scheduled: true,
  timezone: "Asia/Manila"
});

cron.schedule('0 0 0 * * *', () => {
  api.getThreadList(30, null, ["INBOX"], (err, list) => {
    if (err) return console.log("ERR: " + err);
    list.forEach(now => (now.isGroup == true && now.threadID != list.threadID) ?
      api.sendMessage("Goodnight everyone! It's midnight.", now.threadID) : '');
  });
}, {
  scheduled: true,
  timezone: "Asia/Manila"
});
