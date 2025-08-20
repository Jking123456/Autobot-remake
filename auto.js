const fs = require('fs');
const path = require('path');
const login = require('./Rico/index');
const express = require('express');
const app = express();
const chalk = require('chalk');
const bodyParser = require('body-parser');
const script = path.join(__dirname, 'script');
const cron = require('node-cron');
const config = fs.existsSync('./data') && fs.existsSync('./data/config.json') ? JSON.parse(fs.readFileSync('./data/config.json', 'utf8')) : createConfig();

const Utils = new Object({
  commands: new Map(),
  handleEvent: new Map(),
  account: new Map(),
  cooldowns: new Map(),
  spamCounter: new Map(),
  bannedUsers: new Set(),
});

// === Load commands dynamically ===
fs.readdirSync(script).forEach((file) => {
  const scripts = path.join(script, file);
  const stats = fs.statSync(scripts);
  if (stats.isDirectory()) {
    fs.readdirSync(scripts).forEach((file) => {
      try {
        const { config, run, handleEvent } = require(path.join(scripts, file));
        if (config) {
          const { name = [], role = '0', version = '1.0.0', hasPrefix = true, aliases = [], description = '', usage = '', credits = '', cooldown = '5' } =
            Object.fromEntries(Object.entries(config).map(([key, value]) => [key.toLowerCase(), value]));
          aliases.push(name);
          if (run) {
            Utils.commands.set(aliases, { name, role, run, aliases, description, usage, version, hasPrefix: config.hasPrefix, credits, cooldown });
          }
          if (handleEvent) {
            Utils.handleEvent.set(aliases, { name, handleEvent, role, description, usage, version, hasPrefix: config.hasPrefix, credits, cooldown });
          }
        }
      } catch (error) {
        console.error(chalk.red(`Error installing command from file ${file}: ${error.message}`));
      }
    });
  } else {
    try {
      const { config, run, handleEvent } = require(scripts);
      if (config) {
        const { name = [], role = '0', version = '1.0.0', hasPrefix = true, aliases = [], description = '', usage = '', credits = '', cooldown = '5' } =
          Object.fromEntries(Object.entries(config).map(([key, value]) => [key.toLowerCase(), value]));
        aliases.push(name);
        if (run) {
          Utils.commands.set(aliases, { name, role, run, aliases, description, usage, version, hasPrefix: config.hasPrefix, credits, cooldown });
        }
        if (handleEvent) {
          Utils.handleEvent.set(aliases, { name, handleEvent, role, description, usage, version, hasPrefix: config.hasPrefix, credits, cooldown });
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error installing command from file ${file}: ${error.message}`));
    }
  }
});

// === Middleware & Routes ===
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(express.json());

const routes = [
  { path: '/', file: 'index.html' },
  { path: '/step_by_step_guide', file: 'guide.html' },
  { path: '/online_user', file: 'online.html' },
];
routes.forEach(route => {
  app.get(route.path, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', route.file));
  });
});

app.get('/info', (req, res) => {
  const data = Array.from(Utils.account.values()).map(account => ({
    name: account.name,
    profileUrl: account.profileUrl,
    thumbSrc: account.thumbSrc,
    time: account.time
  }));
  res.json(JSON.parse(JSON.stringify(data, null, 2)));
});

app.get('/commands', (req, res) => {
  const command = new Set();
  const commands = [...Utils.commands.values()].map(({ name }) => (command.add(name), name));
  const handleEvent = [...Utils.handleEvent.values()].map(({ name }) => command.has(name) ? null : (command.add(name), name)).filter(Boolean);
  const role = [...Utils.commands.values()].map(({ role }) => (command.add(role), role));
  const aliases = [...Utils.commands.values()].map(({ aliases }) => (command.add(aliases), aliases));
  res.json(JSON.parse(JSON.stringify({ commands, handleEvent, role, aliases }, null, 2)));
});

app.listen(3000, () => {
  console.log(`Server is running at http://localhost:5000`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

// === Account Login ===
async function accountLogin(state, enableCommands = [], prefix, admin = []) {
  return new Promise((resolve, reject) => {
    login({ appState: state }, async (error, api) => {
      if (error) {
        reject(error);
        return;
      }
      const userid = await api.getCurrentUserID();
      addThisUser(userid, enableCommands, state, prefix, admin);

      try {
        const userInfo = await api.getUserInfo(userid);
        if (!userInfo || !userInfo[userid]?.name || !userInfo[userid]?.profileUrl || !userInfo[userid]?.thumbSrc) throw new Error('Account locked.');
        const { name, profileUrl, thumbSrc } = userInfo[userid];
        let time = (JSON.parse(fs.readFileSync('./data/history.json', 'utf-8')).find(user => user.userid === userid) || {}).time || 0;

        Utils.account.set(userid, { name, profileUrl, thumbSrc, time });

        const intervalId = setInterval(() => {
          try {
            const account = Utils.account.get(userid);
            if (!account) throw new Error('Account not found');
            Utils.account.set(userid, { ...account, time: account.time + 1 });
          } catch (error) {
            clearInterval(intervalId);
            return;
          }
        }, 1000);
      } catch (error) {
        reject(error);
        return;
      }

      api.setOptions({
        listenEvents: config[0].fcaOption.listenEvents,
        logLevel: config[0].fcaOption.logLevel,
        updatePresence: config[0].fcaOption.updatePresence,
        selfListen: config[0].fcaOption.selfListen,
        forceLogin: config[0].fcaOption.forceLogin,
        online: config[0].fcaOption.online,
        autoMarkDelivery: config[0].fcaOption.autoMarkDelivery,
        autoMarkRead: config[0].fcaOption.autoMarkRead,
      });

      try {
        var listenEmitter = api.listenMqtt(async (error, event) => {
          if (error) return;

          let database = fs.existsSync('./data/database.json') ? JSON.parse(fs.readFileSync('./data/database.json', 'utf8')) : createDatabase();
          let data = Array.isArray(database) ? database.find(item => Object.keys(item)[0] === event?.threadID) : {};
          let adminIDS = data ? database : createThread(event.threadID, api);

          let history = JSON.parse(fs.readFileSync('./data/history.json', 'utf-8'));
          let userData = history.find(user => user.userid === userid) || {};
          let blacklist = userData.blacklist || [];

          // === Block banned users immediately ===
          if (blacklist.includes(event.senderID) || Utils.bannedUsers.has(event.senderID)) {
            return; // ignore completely
          }

          let hasPrefix = (event.body && aliases((event.body || '')?.trim().toLowerCase().split(/ +/).shift())?.hasPrefix == false) ? '' : prefix;
          let [command, ...args] = ((event.body || '').trim().toLowerCase().startsWith(hasPrefix?.toLowerCase())
            ? (event.body || '').trim().substring(hasPrefix?.length).trim().split(/\s+/).map(arg => arg.trim())
            : []);

          // === Anti-Spam System ===
          if (event.body && command) {
            let key = `${event.senderID}_${command}`;
            let spam = Utils.spamCounter.get(key) || { count: 0, lastTime: Date.now() };

            if (Date.now() - spam.lastTime < 5000) {
              spam.count++;
            } else {
              spam.count = 1;
            }
            spam.lastTime = Date.now();
            Utils.spamCounter.set(key, spam);

            if (spam.count >= 5) {
              if (!blacklist.includes(event.senderID)) {
                blacklist.push(event.senderID);
                userData.blacklist = blacklist;
                fs.writeFileSync('./data/history.json', JSON.stringify(history, null, 2));
                Utils.bannedUsers.add(event.senderID);
                api.sendMessage("⚠️ You have been banned for spamming commands too many times.", event.threadID, event.messageID);
              }
              return;
            }
          }

          // === Command Handling ===
          if (event.body && aliases(command)?.name) {
            if (blacklist.includes(event.senderID)) {
              return; // ignore permanently
            }
            if (enableCommands[0].commands.includes(aliases(command?.toLowerCase())?.name)) {
              await ((aliases(command?.toLowerCase())?.run || (() => {}))({
                api, event, args, enableCommands, admin, prefix, blacklist, Utils
              }));
            }
          }
        });
      } catch (error) {
        Utils.account.delete(userid);
        deleteThisUser(userid);
        return;
      }
      resolve();
    });
  });
}

// === Helpers ===
async function deleteThisUser(userid) {
  const configFile = './data/history.json';
  let config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  const sessionFile = path.join('./data/session', `${userid}.json`);
  const index = config.findIndex(item => item.userid === userid);
  if (index !== -1) config.splice(index, 1);
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  try { fs.unlinkSync(sessionFile); } catch (error) {}
}

async function addThisUser(userid, enableCommands, state, prefix, admin, blacklist) {
  const configFile = './data/history.json';
  const sessionFolder = './data/session';
  const sessionFile = path.join(sessionFolder, `${userid}.json`);
  if (fs.existsSync(sessionFile)) return;
  const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  config.push({ userid, prefix: prefix || "", admin: admin || [], blacklist: blacklist || [], enableCommands, time: 0 });
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  fs.writeFileSync(sessionFile, JSON.stringify(state));
}

function aliases(command) {
  const aliases = Array.from(Utils.commands.entries()).find(([commands]) => commands.includes(command?.toLowerCase()));
  if (aliases) return aliases[1];
  return null;
}

function createConfig() {
  const config = [{
    masterKey: { admin: [], devMode: false, database: false, restartTime: 15 },
    fcaOption: {
      forceLogin: true, listenEvents: true, logLevel: "silent",
      updatePresence: true, selfListen: true, userAgent: "Mozilla/5.0",
      online: true, autoMarkDelivery: false, autoMarkRead: false
    }
  }];
  if (!fs.existsSync('./data')) fs.mkdirSync('./data');
  fs.writeFileSync('./data/config.json', JSON.stringify(config, null, 2));
  return config;
}

async function createThread(threadID, api) {
  try {
    const database = JSON.parse(fs.readFileSync('./data/database.json', 'utf8'));
    let threadInfo = await api.getThreadInfo(threadID);
    let adminIDs = threadInfo ? threadInfo.adminIDs : [];
    const data = {}; data[threadID] = adminIDs;
    database.push(data);
    await fs.writeFileSync('./data/database.json', JSON.stringify(database, null, 2), 'utf-8');
    return database;
  } catch (error) { console.log(error); }
}

async function createDatabase() {
  const data = './data';
  const database = './data/database.json';
  if (!fs.existsSync(data)) fs.mkdirSync(data, { recursive: true });
  if (!fs.existsSync(database)) fs.writeFileSync(database, JSON.stringify([]));
  return database;
}

async function main() {
  const empty = require('fs-extra');
  const cacheFile = './script/cache';
  if (!fs.existsSync(cacheFile)) fs.mkdirSync(cacheFile);
  const configFile = './data/history.json';
  if (!fs.existsSync(configFile)) fs.writeFileSync(configFile, '[]', 'utf-8');
  const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  const sessionFolder = path.join('./data/session');
  if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder);

  cron.schedule(`*/${config[0]?.masterKey?.restartTime || 15} * * * *`, async () => {
    const history = JSON.parse(fs.readFileSync('./data/history.json', 'utf-8'));
    history.forEach(user => {
      const update = Utils.account.get(user.userid);
      update ? user.time = update.time : null;
    });
    await empty.emptyDir(cacheFile);
    fs.writeFileSync('./data/history.json', JSON.stringify(history, null, 2));
    process.exit(1);
  });

  try {
    for (const file of fs.readdirSync(sessionFolder)) {
      const filePath = path.join(sessionFolder, file);
      try {
        const { enableCommands, prefix, admin, blacklist } = config.find(item => item.userid === path.parse(file).name) || {};

        let raw = fs.readFileSync(filePath, 'utf-8');
        let state;

        try {
          state = JSON.parse(raw);
          if (!Array.isArray(state)) {
            state = Object.entries(state).map(([key, value]) => ({ key, value, domain: "facebook.com", path: "/", hostOnly: false }));
          }
        } catch (e) {
          state = raw.split(";").map(c => {
            let [key, value] = c.trim().split("=");
            return { key, value, domain: "facebook.com", path: "/", hostOnly: false };
          });
        }

        if (enableCommands) await accountLogin(state, enableCommands, prefix, admin, blacklist);
      } catch (error) {
        deleteThisUser(path.parse(file).name);
      }
    }
  } catch (error) {}
}

main();
