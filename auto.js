const fs = require('fs');
const path = require('path');
const login = require('./Rico/index');
const express = require('express');
const app = express();
const chalk = require('chalk');
const bodyParser = require('body-parser');
const cron = require('node-cron');

// load config or create
const config = fs.existsSync('./data') && fs.existsSync('./data/config.json')
  ? JSON.parse(fs.readFileSync('./data/config.json', 'utf8'))
  : createConfig();

const script = path.join(__dirname, 'script');
const Utils = {
  commands: new Map(),
  handleEvent: new Map(),
  account: new Map(),
  cooldowns: new Map(),
};

// ================== COMMAND LOADER ==================
fs.readdirSync(script).forEach((file) => {
  const scripts = path.join(script, file);
  const stats = fs.statSync(scripts);

  const loadFile = (filepath) => {
    try {
      const { config, run, handleEvent } = require(filepath);
      if (!config) return;

      const {
        name = [], role = '0', version = '1.0.0', hasPrefix = true,
        aliases = [], description = '', usage = '', credits = '', cooldown = '5'
      } = Object.fromEntries(Object.entries(config).map(([k, v]) => [k.toLowerCase(), v]));

      aliases.push(name);

      if (run) {
        Utils.commands.set(aliases, {
          name, role, run, aliases, description, usage, version, hasPrefix, credits, cooldown
        });
      }
      if (handleEvent) {
        Utils.handleEvent.set(aliases, {
          name, handleEvent, role, description, usage, version, hasPrefix, credits, cooldown
        });
      }
    } catch (err) {
      console.error(chalk.red(`Error installing command from file ${filepath}: ${err.message}`));
    }
  };

  if (stats.isDirectory()) {
    fs.readdirSync(scripts).forEach((f) => loadFile(path.join(scripts, f)));
  } else {
    loadFile(scripts);
  }
});

// ================== EXPRESS ROUTES ==================
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
  res.json(data);
});

app.get('/commands', (req, res) => {
  const commandSet = new Set();

  const commands = [...Utils.commands.values()].map(({ name }) => {
    commandSet.add(name);
    return name;
  });

  const handleEvent = [...Utils.handleEvent.values()]
    .map(({ name }) => commandSet.has(name) ? null : (commandSet.add(name), name))
    .filter(Boolean);

  const role = [...Utils.commands.values()].map(({ role }) => role);
  const aliases = [...Utils.commands.values()].map(({ aliases }) => aliases);

  res.json({ commands, handleEvent, role, aliases });
});

app.post('/login', async (req, res) => {
  const { state, commands, prefix, admin } = req.body;
  try {
    if (!state) throw new Error('Missing app state data');

    const cUser = state.find(item => item.key === 'c_user');
    if (!cUser) throw new Error("Invalid appstate data");

    const existingUser = Utils.account.get(cUser.value);
    if (existingUser) {
      return res.status(400).json({
        error: false,
        message: "Active user session detected; already logged in",
        user: existingUser
      });
    }

    await accountLogin(state, commands, prefix, [admin]);
    res.status(200).json({ success: true, message: 'Login successful' });
  } catch (err) {
    res.status(400).json({ error: true, message: err.message });
  }
});

app.listen(3000, () => {
  console.log(`✅ Server running at http://localhost:3000`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

// ================== LOGIN & HANDLER ==================
async function accountLogin(state, enableCommands = [], prefix, admin = []) {
  return new Promise((resolve, reject) => {
    login({ appState: state }, async (error, api) => {
      if (error) return reject(error);

      const userid = await api.getCurrentUserID();
      addThisUser(userid, enableCommands, state, prefix, admin);

      try {
        const userInfo = await api.getUserInfo(userid);
        const { name, profileUrl, thumbSrc } = userInfo[userid];
        if (!name || !profileUrl || !thumbSrc)
          throw new Error('Account may be suspended or locked');

        let time = (JSON.parse(fs.readFileSync('./data/history.json', 'utf-8'))
          .find(user => user.userid === userid) || {}).time || 0;

        Utils.account.set(userid, { name, profileUrl, thumbSrc, time });

        // update online time
        const intervalId = setInterval(() => {
          const account = Utils.account.get(userid);
          if (!account) return clearInterval(intervalId);
          account.time++;
          Utils.account.set(userid, account);
        }, 1000);
      } catch (err) {
        return reject(err);
      }

      api.setOptions(config[0].fcaOption);

      try {
        api.listenMqtt(async (err, event) => {
          if (err) return console.error(`API Listen error: ${err}`, userid);

          // handle events, commands, cooldowns ... (same as your logic)
          // cut here for brevity — keep your existing event handler logic
        });
      } catch (err) {
        console.error('Listen error', userid);
        Utils.account.delete(userid);
        deleteThisUser(userid);
      }

      resolve();
    });
  });
}

// ================== HELPERS ==================
async function deleteThisUser(userid) {
  const configFile = './data/history.json';
  let history = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  const sessionFile = path.join('./data/session', `${userid}.json`);

  history = history.filter(u => u.userid !== userid);
  fs.writeFileSync(configFile, JSON.stringify(history, null, 2));

  try { fs.unlinkSync(sessionFile); } catch {}
}

async function addThisUser(userid, enableCommands, state, prefix, admin, blacklist) {
  const configFile = './data/history.json';
  const sessionFolder = './data/session';
  const sessionFile = path.join(sessionFolder, `${userid}.json`);

  if (fs.existsSync(sessionFile)) return;

  const history = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  history.push({
    userid, prefix: prefix || "", admin: admin || [], blacklist: blacklist || [],
    enableCommands, time: 0,
  });

  fs.writeFileSync(configFile, JSON.stringify(history, null, 2));
  fs.writeFileSync(sessionFile, JSON.stringify(state));
}

function aliases(command) {
  const entry = Array.from(Utils.commands.entries())
    .find(([cmds]) => cmds.includes(command?.toLowerCase()));
  return entry ? entry[1] : null;
}

async function main() {
  const empty = require('fs-extra');
  const cacheFile = './script/cache';
  if (!fs.existsSync(cacheFile)) fs.mkdirSync(cacheFile);

  const historyFile = './data/history.json';
  if (!fs.existsSync(historyFile)) fs.writeFileSync(historyFile, '[]', 'utf-8');

  const sessionFolder = './data/session';
  if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder);

  const adminOfConfig = config;
  cron.schedule(`*/${adminOfConfig[0].masterKey.restartTime} * * * *`, async () => {
    let history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    history.forEach(user => {
      const update = Utils.account.get(user.userid);
      if (update) user.time = update.time;
    });
    await empty.emptyDir(cacheFile);
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
    process.exit(1);
  });

  for (const file of fs.readdirSync(sessionFolder)) {
    try {
      const { enableCommands, prefix, admin, blacklist } =
        JSON.parse(fs.readFileSync(historyFile, 'utf-8'))
          .find(item => item.userid === path.parse(file).name) || {};
      const state = JSON.parse(fs.readFileSync(path.join(sessionFolder, file), 'utf-8'));
      if (enableCommands) await accountLogin(state, enableCommands, prefix, admin, blacklist);
    } catch (err) {
      deleteThisUser(path.parse(file).name);
    }
  }
}

function createConfig() {
  const config = [{
    masterKey: { admin: [], devMode: false, database: false, restartTime: 15 },
    fcaOption: {
      forceLogin: true, listenEvents: true, logLevel: "silent",
      updatePresence: true, selfListen: true,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      online: true, autoMarkDelivery: false, autoMarkRead: false
    }
  }];
  if (!fs.existsSync('./data')) fs.mkdirSync('./data');
  fs.writeFileSync('./data/config.json', JSON.stringify(config, null, 2));
  return config;
}

main();
