const fs = require('fs');
const path = require('path');
const login = require('./Rico/index');
const express = require('express');
const app = express();
const chalk = require('chalk');
const bodyParser = require('body-parser');
const cron = require('node-cron');

// ================== CORE UTILS ==================
const script = path.join(__dirname, 'script');
const config = fs.existsSync('./data/config.json')
  ? JSON.parse(fs.readFileSync('./data/config.json', 'utf8'))
  : createConfig();

const Utils = {
  commands: new Map(),
  handleEvent: new Map(),
  account: new Map(),
  cooldowns: new Map(),
};

// ================== COMMAND LOADER ==================
function loadCommands() {
  fs.readdirSync(script).forEach((file) => {
    const scripts = path.join(script, file);
    const stats = fs.statSync(scripts);

    const files = stats.isDirectory()
      ? fs.readdirSync(scripts).map((f) => path.join(scripts, f))
      : [scripts];

    for (const f of files) {
      try {
        const { config, run, handleEvent } = require(f);
        if (!config) continue;

        const {
          name = '',
          role = 0,
          version = '1.0.0',
          hasPrefix = true,
          aliases = [],
          description = '',
          usage = '',
          credits = '',
          cooldown = 5,
        } = Object.fromEntries(
          Object.entries(config).map(([k, v]) => [k.toLowerCase(), v])
        );

        const allAliases = [...new Set([name, ...(aliases || [])])];

        if (run) {
          Utils.commands.set(name.toLowerCase(), {
            name,
            run,
            role,
            aliases: allAliases,
            description,
            usage,
            version,
            hasPrefix,
            credits,
            cooldown,
          });
        }
        if (handleEvent) {
          Utils.handleEvent.set(name.toLowerCase(), {
            name,
            handleEvent,
            role,
            description,
            usage,
            version,
            hasPrefix,
            credits,
            cooldown,
          });
        }
      } catch (err) {
        console.error(chalk.red(`❌ Failed to load ${file}: ${err.message}`));
      }
    }
  });
  console.log(chalk.green(`✅ Commands Loaded: ${Utils.commands.size}`));
}
loadCommands();

// ================== EXPRESS SETUP ==================
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(express.json());

app.get('/info', (req, res) => {
  const data = Array.from(Utils.account.values());
  res.json(data);
});

app.get('/commands', (req, res) => {
  res.json({
    commands: [...Utils.commands.values()].map((c) => c.name),
    handleEvent: [...Utils.handleEvent.values()].map((c) => c.name),
  });
});

app.post('/login', async (req, res) => {
  const { state, commands, prefix, admin } = req.body;
  try {
    if (!state) throw new Error('Missing app state data');
    const cUser = state.find((i) => i.key === 'c_user');
    if (!cUser) throw new Error('Invalid app state data');

    if (Utils.account.get(cUser.value)) {
      return res.status(400).json({
        error: false,
        message: 'Already logged in',
        user: Utils.account.get(cUser.value),
      });
    }

    await accountLogin(state, commands, prefix, [admin]);
    res.json({ success: true, message: 'Login successful' });
  } catch (err) {
    res.status(400).json({ error: true, message: err.message });
  }
});

app.listen(3000, () =>
  console.log(chalk.yellow(`🌐 Server running at http://localhost:3000`))
);

// ================== BOT LOGIN & HANDLER ==================
async function accountLogin(state, enableCommands = [], prefix, admin = []) {
  return new Promise((resolve, reject) => {
    login({ appState: state }, async (err, api) => {
      if (err) return reject(err);

      try {
        const userId = await api.getCurrentUserID();
        addThisUser(userId, enableCommands, state, prefix, admin);

        const info = await api.getUserInfo(userId);
        const { name, profileUrl, thumbSrc } = info[userId] || {};
        if (!name) throw new Error('Account may be locked or suspended');

        Utils.account.set(userId, { name, profileUrl, thumbSrc, time: 0 });
        console.log(chalk.blue(`🔵 Logged in as ${name}`));

        // Update timer
        setInterval(() => {
          const acc = Utils.account.get(userId);
          if (acc) acc.time++;
        }, 1000);

        api.setOptions(config[0].fcaOption);

        api.listenMqtt(async (err, event) => {
          if (err) return console.error(chalk.red('❌ Listen error'), err);

          handleEvent(api, event, { userId, enableCommands, prefix, admin });
        });

        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function handleEvent(api, event, ctx) {
  try {
    const { userId, enableCommands, prefix, admin } = ctx;
    const { body, threadID, senderID } = event;

    if (!body) return;
    const text = body.trim().toLowerCase();

    // Detect command
    const isCmd = text.startsWith(prefix.toLowerCase());
    const [cmdName, ...args] = isCmd
      ? text.substring(prefix.length).split(/\s+/)
      : [];

    const cmd = getCommand(cmdName);

    // Invalid command
    if (isCmd && !cmd) {
      return api.sendMessage(
        `❌ Unknown command '${cmdName}'. Use ${prefix}help.`,
        threadID
      );
    }

    // Permission check
    if (cmd) {
      const role = cmd.role || 0;
      const isAdmin =
        config?.[0]?.masterKey?.admin?.includes(senderID) ||
        admin.includes(senderID);
      if ((role === 1 && !isAdmin)) {
        return api.sendMessage(
          `⚠️ You don't have permission to use this command.`,
          threadID
        );
      }

      // Cooldown check
      const key = `${senderID}_${cmd.name}_${userId}`;
      const now = Date.now();
      const last = Utils.cooldowns.get(key);
      if (last && now - last < cmd.cooldown * 1000) return;
      Utils.cooldowns.set(key, now);

      // Run command
      try {
        await cmd.run({ api, event, args, prefix, admin, Utils });
      } catch (e) {
        console.error(chalk.red(`❌ Error in command ${cmd.name}:`), e);
        api.sendMessage(`⚠️ Error running command ${cmd.name}`, threadID);
      }
    }
  } catch (e) {
    console.error(chalk.red('❌ Event handler error:'), e);
  }
}

// ================== HELPERS ==================
function getCommand(name) {
  if (!name) return null;
  name = name.toLowerCase();
  for (const cmd of Utils.commands.values()) {
    if (cmd.name.toLowerCase() === name || cmd.aliases.includes(name)) {
      return cmd;
    }
  }
  return null;
}

function addThisUser(userid, enableCommands, state, prefix, admin) {
  const historyFile = './data/history.json';
  const sessionFile = `./data/session/${userid}.json`;

  if (!fs.existsSync('./data/session')) fs.mkdirSync('./data/session');
  if (!fs.existsSync(historyFile)) fs.writeFileSync(historyFile, '[]');

  const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  if (!fs.existsSync(sessionFile)) {
    history.push({
      userid,
      prefix,
      admin,
      enableCommands,
      time: 0,
    });
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
    fs.writeFileSync(sessionFile, JSON.stringify(state, null, 2));
  }
}

function createConfig() {
  const cfg = [
    {
      masterKey: { admin: [], devMode: false, restartTime: 15 },
      fcaOption: {
        forceLogin: true,
        listenEvents: true,
        logLevel: 'silent',
        updatePresence: true,
        selfListen: true,
        online: true,
        autoMarkDelivery: false,
        autoMarkRead: false,
      },
    },
  ];
  if (!fs.existsSync('./data')) fs.mkdirSync('./data');
  fs.writeFileSync('./data/config.json', JSON.stringify(cfg, null, 2));
  return cfg;
}
