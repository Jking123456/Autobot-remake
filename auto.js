const fs = require('fs'); const path = require('path'); const login = require('./Rico/index'); const express = require('express'); const app = express(); const chalk = require('chalk'); const bodyParser = require('body-parser'); const script = path.join(__dirname, 'script'); const cron = require('node-cron');

const config = fs.existsSync('./data') && fs.existsSync('./data/config.json') ? JSON.parse(fs.readFileSync('./data/config.json', 'utf8')) : createConfig();

const Utils = { commands: new Map(), handleEvent: new Map(), account: new Map(), cooldowns: new Map(), };

fs.readdirSync(script).forEach((file) => { const scripts = path.join(script, file); const stats = fs.statSync(scripts); if (stats.isDirectory()) { fs.readdirSync(scripts).forEach((file) => { try { const { config, run, handleEvent } = require(path.join(scripts, file)); if (config) { const { name = [], role = '0', version = '1.0.0', hasPrefix = true, aliases = [], description = '', usage = '', credits = '', cooldown = '5' } = Object.fromEntries(Object.entries(config).map(([k, v]) => [k.toLowerCase(), v])); aliases.push(name); if (run) Utils.commands.set(aliases, { name, role, run, aliases, description, usage, version, hasPrefix, credits, cooldown }); if (handleEvent) Utils.handleEvent.set(aliases, { name, handleEvent, role, description, usage, version, hasPrefix, credits, cooldown }); } } catch (e) { console.error(chalk.red(Error installing command from file ${file}: ${e.message})); } }); } else { try { const { config, run, handleEvent } = require(scripts); if (config) { const { name = [], role = '0', version = '1.0.0', hasPrefix = true, aliases = [], description = '', usage = '', credits = '', cooldown = '5' } = Object.fromEntries(Object.entries(config).map(([k, v]) => [k.toLowerCase(), v])); aliases.push(name); if (run) Utils.commands.set(aliases, { name, role, run, aliases, description, usage, version, hasPrefix, credits, cooldown }); if (handleEvent) Utils.handleEvent.set(aliases, { name, handleEvent, role, description, usage, version, hasPrefix, credits, cooldown }); } } catch (e) { console.error(chalk.red(Error installing command from file ${file}: ${e.message})); } } });

app.use(express.static(path.join(__dirname, 'public'))); app.use(bodyParser.json()); app.use(express.json());

const routes = [ { path: '/', file: 'index.html' }, { path: '/step_by_step_guide', file: 'guide.html' }, { path: '/online_user', file: 'online.html' }, ];

routes.forEach(route => { app.get(route.path, (req, res) => { res.sendFile(path.join(__dirname, 'public', route.file)); }); });

app.get('/info', (req, res) => { const data = Array.from(Utils.account.values()).map(acc => ({ name: acc.name, profileUrl: acc.profileUrl, thumbSrc: acc.thumbSrc, time: acc.time })); res.json(JSON.parse(JSON.stringify(data, null, 2))); });

app.listen(3000, () => { console.log(Server is running at http://localhost:5000); });

process.on('unhandledRejection', (reason) => { console.error('Unhandled Promise Rejection:', reason); });

async function accountLogin(state, enableCommands = [], prefix, admin = []) { return new Promise((resolve, reject) => { login({ appState: state }, async (error, api) => { if (error) return reject(error); const userid = await api.getCurrentUserID();

try {
    const userInfo = await api.getUserInfo(userid);
    const { name, profileUrl, thumbSrc } = userInfo[userid];
    Utils.account.set(userid, { name, profileUrl, thumbSrc, time: 0 });
  } catch (err) {
    return reject(err);
  }

  api.setOptions(config[0].fcaOption);

  try {
    const listenEmitter = api.listenMqtt(async (error, event) => {
      if (error) return console.error('API Listen Error:', error);

      // ✅ Group Ban Check
      const bannedGroupsPath = path.join(__dirname, 'script', 'commands', 'bannedGroups.json');
      let bannedGroups = [];
      if (fs.existsSync(bannedGroupsPath)) {
        try {
          bannedGroups = JSON.parse(fs.readFileSync(bannedGroupsPath, 'utf-8'));
        } catch (e) {
          console.error("Failed to read bannedGroups.json:", e.message);
        }
      }
      if (event.threadID && bannedGroups.includes(event.threadID)) {
        api.sendMessage("🚫 This group is banned from using AutoBot.", event.threadID);
        return;
      }

      // [ Insert the rest of your original event handling logic here... ]
    });
  } catch (e) {
    console.error("Error in listener setup:", e);
  }

  resolve();
});

}); }

function createConfig() { const config = [{ masterKey: { admin: [], devMode: false, database: false, restartTime: 15 }, fcaOption: { forceLogin: true, listenEvents: true, logLevel: "silent", updatePresence: true, selfListen: true, userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64", online: true, autoMarkDelivery: false, autoMarkRead: false } }]; if (!fs.existsSync('./data')) fs.mkdirSync('./data'); fs.writeFileSync('./data/config.json', JSON.stringify(config, null, 2)); return config; }

main();

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
