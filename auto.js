const fs = require('fs');
const path = require('path');
const login = require('./Rico/index');
const express = require('express');
const app = express();
const chalk = require('chalk');
const bodyParser = require('body-parser');
const script = path.join(__dirname, 'script');
const cron = require('node-cron');

const config = fs.existsSync('./data') && fs.existsSync('./data/config.json')
  ? JSON.parse(fs.readFileSync('./data/config.json', 'utf8'))
  : createConfig();

const Utils = {
  commands: new Map(),
  handleEvent: new Map(),
  account: new Map(),
  cooldowns: new Map(),
};

// ✅ Fixed Command Loader
function loadCommands() {
  let count = 0;

  fs.readdirSync(script).forEach((file) => {
    const scripts = path.join(script, file);
    const stats = fs.statSync(scripts);

    const files = stats.isDirectory()
      ? fs.readdirSync(scripts).map((f) => path.join(scripts, f))
      : [scripts];

    for (const f of files) {
      try {
        const cmdFile = require(f);
        const cfg = (cmdFile.config || {});
        const name = (cfg.name || path.basename(f, '.js')).toLowerCase();

        const commandObj = {
          name,
          role: cfg.role || 0,
          version: cfg.version || '1.0.0',
          hasPrefix: cfg.hasPrefix !== false,
          aliases: (cfg.aliases || []).map(a => a.toLowerCase()).concat(name),
          description: cfg.description || '',
          usage: cfg.usage || '',
          credits: cfg.credits || '',
          cooldown: cfg.cooldown || 5,
          run: cmdFile.run || null,
          handleEvent: cmdFile.handleEvent || null,
        };

        // Save under each alias
        for (const alias of commandObj.aliases) {
          Utils.commands.set(alias, commandObj);
        }

        if (commandObj.handleEvent) {
          Utils.handleEvent.set(name, commandObj);
        }

        count++;
      } catch (err) {
        console.error(chalk.red(`❌ Failed to load ${f}: ${err.message}`));
      }
    }
  });

  console.log(chalk.green(`✅ Commands Loaded: ${count}`));
}

// ✅ Simplified Command Resolver
function getCommand(cmd) {
  if (!cmd) return null;
  return Utils.commands.get(cmd.toLowerCase()) || null;
}

// Run command loader
loadCommands();

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(express.json());

// Routes
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
  res.json(data);
});

app.get('/commands', (req, res) => {
  const commands = [...new Set([...Utils.commands.values()].map(cmd => cmd.name))];
  const handleEvent = [...Utils.handleEvent.values()].map(cmd => cmd.name);
  res.json({ commands, handleEvent });
});

// Login route
app.post('/login', async (req, res) => {
  const { state, commands, prefix, admin } = req.body;
  try {
    if (!state) throw new Error('Missing app state data');
    const cUser = state.find(item => item.key === 'c_user');
    if (cUser) {
      const existingUser = Utils.account.get(cUser.value);
      if (existingUser) {
        console.log(`User ${cUser.value} is already logged in`);
        return res.status(400).json({
          error: false,
          message: "Active user session detected; already logged in",
          user: existingUser
        });
      } else {
        try {
          await accountLogin(state, commands, prefix, [admin]);
          res.status(200).json({
            success: true,
            message: 'Authentication process completed successfully; login achieved.'
          });
        } catch (error) {
          console.error(error);
          res.status(400).json({ error: true, message: error.message });
        }
      }
    } else {
      return res.status(400).json({ error: true, message: "Invalid appstate data" });
    }
  } catch (error) {
    return res.status(400).json({ error: true, message: "Invalid appstate data" });
  }
});

app.listen(3000, () => {
  console.log(`Server is running at http://localhost:5000`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

// =================== LOGIN HANDLER ===================
async function accountLogin(state, enableCommands = [], prefix, admin = []) {
  return new Promise((resolve, reject) => {
    login({ appState: state }, async (error, api) => {
      if (error) return reject(error);

      const userid = await api.getCurrentUserID();
      addThisUser(userid, enableCommands, state, prefix, admin);

      try {
        const userInfo = await api.getUserInfo(userid);
        if (!userInfo || !userInfo[userid]) throw new Error('Account locked/suspended');

        const { name, profileUrl, thumbSrc } = userInfo[userid];
        let time = (JSON.parse(fs.readFileSync('./data/history.json', 'utf-8'))
          .find(user => user.userid === userid) || {}).time || 0;

        Utils.account.set(userid, { name, profileUrl, thumbSrc, time });

        const intervalId = setInterval(() => {
          try {
            const account = Utils.account.get(userid);
            if (!account) throw new Error('Account not found');
            Utils.account.set(userid, { ...account, time: account.time + 1 });
          } catch (error) {
            clearInterval(intervalId);
          }
        }, 1000);
      } catch (error) {
        return reject(error);
      }

      api.setOptions(config[0].fcaOption);

      try {
        api.listenMqtt(async (error, event) => {
          if (error) return console.error('API Listen Error:', error);

          let database = fs.existsSync('./data/database.json')
            ? JSON.parse(fs.readFileSync('./data/database.json', 'utf8'))
            : createDatabase();

          let data = Array.isArray(database)
            ? database.find(item => Object.keys(item)[0] === event?.threadID)
            : {};

          let adminIDS = data ? database : createThread(event.threadID, api);

          let blacklist = (JSON.parse(fs.readFileSync('./data/history.json', 'utf-8'))
            .find(b => b.userid === userid) || {}).blacklist || [];

          let hasPrefix = (event.body && getCommand(event.body.trim().split(/ +/).shift())?.hasPrefix === false)
            ? '' : prefix;

          let [command, ...args] = ((event.body || '').trim().toLowerCase().startsWith(hasPrefix?.toLowerCase())
            ? (event.body || '').trim().substring(hasPrefix?.length).trim().split(/\s+/)
            : []);

          const cmdObj = getCommand(command);

          // Permissions
          if (cmdObj?.name) {
            const role = cmdObj.role ?? 0;
            const isAdmin = config?.[0]?.masterKey?.admin?.includes(event.senderID) || admin.includes(event.senderID);
            const isThreadAdmin = isAdmin || ((Array.isArray(adminIDS)
              ? adminIDS.find(a => Object.keys(a)[0] === event.threadID)
              : {})?.[event.threadID] || []).some(a => a.id === event.senderID);

            if ((role == 1 && !isAdmin) || (role == 2 && !isThreadAdmin) || (role == 3 && !isAdmin)) {
              api.sendMessage(`You don't have permission to use this command.`, event.threadID, event.messageID);
              return;
            }
          }

          // Blacklist check
          if (cmdObj?.name && blacklist.includes(event.senderID)) {
            api.sendMessage("🚫 You are banned from using this bot.", event.threadID, event.messageID);
            return;
          }

          // Cooldown
          if (cmdObj?.name) {
            const now = Date.now();
            const senderKey = `${event.senderID}_${cmdObj.name}_${userid}`;
            const sender = Utils.cooldowns.get(senderKey);
            const delay = cmdObj.cooldown ?? 0;

            if (!sender || (now - sender.timestamp) >= delay * 1000) {
              Utils.cooldowns.set(senderKey, { timestamp: now, command: cmdObj.name });
            } else {
              return; // Silent ignore
            }
          }

          // Invalid commands
          if (event.body && !cmdObj && event.body.toLowerCase().startsWith(prefix.toLowerCase())) {
            api.sendMessage(`❌ Unknown command. Use ${prefix}help to see available commands.`, event.threadID, event.messageID);
            return;
          }

          // Run commands
          if (cmdObj?.run) {
            try {
              await cmdObj.run({ api, event, args, enableCommands, admin, prefix, blacklist, Utils });
            } catch (err) {
              console.error(`❌ Error in command '${cmdObj.name}':`, err.message);
            }
          }

          // Handle events
          for (const { handleEvent, name } of Utils.handleEvent.values()) {
            if (handleEvent && name &&
              ((enableCommands[1]?.handleEvent || []).includes(name) ||
               (enableCommands[0]?.commands || []).includes(name))) {
              handleEvent({ api, event, enableCommands, admin, prefix, blacklist });
            }
          }
        });
      } catch (error) {
        console.error('Error outside listen loop', userid);
        Utils.account.delete(userid);
        deleteThisUser(userid);
      }

      resolve();
    });
  });
}

// =================== HELPERS ===================
async function deleteThisUser(userid) {
  const configFile = './data/history.json';
  let config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  const sessionFile = path.join('./data/session', `${userid}.json`);
  const index = config.findIndex(item => item.userid === userid);
  if (index !== -1) config.splice(index, 1);
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  try { fs.unlinkSync(sessionFile); } catch {}
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

async function main() {
  const empty = require('fs-extra');
  const cacheFile = './script/cache';
  if (!fs.existsSync(cacheFile)) fs.mkdirSync(cacheFile);
  const configFile = './data/history.json';
  if (!fs.existsSync(configFile)) fs.writeFileSync(configFile, '[]', 'utf-8');
  const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  const sessionFolder = path.join('./data/session');
  if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder);
  const adminOfConfig = fs.existsSync('./data') && fs.existsSync('./data/config.json')
    ? JSON.parse(fs.readFileSync('./data/config.json', 'utf8'))
    : createConfig();

  cron.schedule(`*/${adminOfConfig[0].masterKey.restartTime} * * * *`, async () => {
    const history = JSON.parse(fs.readFileSync('./data/history.json', 'utf-8'));
    history.forEach(user => {
      if (!user || typeof user !== 'object') process.exit(1);
      if (isNaN(user.time)) process.exit(1);
      const update = Utils.account.get(user.userid);
      if (update) user.time = update.time;
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
        const state = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (enableCommands) await accountLogin(state, enableCommands, prefix, admin, blacklist);
      } catch (error) {
        deleteThisUser(path.parse(file).name);
      }
    }
  } catch {}
}

function createConfig() {
  const config = [{
    masterKey: {
      admin: [],
      devMode: false,
      database: false,
      restartTime: 15,
    },
    fcaOption: {
      forceLogin: true,
      listenEvents: true,
      logLevel: "silent",
      updatePresence: true,
      selfListen: true,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64",
      online: true,
      autoMarkDelivery: false,
      autoMarkRead: false
    }
  }];
  const dataFolder = './data';
  if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);
  fs.writeFileSync('./data/config.json', JSON.stringify(config, null, 2));
  return config;
}

async function createThread(threadID, api) {
  try {
    const database = JSON.parse(fs.readFileSync('./data/database.json', 'utf8'));
    let threadInfo = await api.getThreadInfo(threadID);
    let adminIDs = threadInfo ? threadInfo.adminIDs : [];
    const data = {};
    data[threadID] = adminIDs;
    database.push(data);
    fs.writeFileSync('./data/database.json', JSON.stringify(database, null, 2), 'utf-8');
    return database;
  } catch (error) {
    console.log(error);
  }
}

async function createDatabase() {
  const data = './data';
  const database = './data/database.json';
  if (!fs.existsSync(data)) fs.mkdirSync(data, { recursive: true });
  if (!fs.existsSync(database)) fs.writeFileSync(database, JSON.stringify([]));
  return database;
}

main();
