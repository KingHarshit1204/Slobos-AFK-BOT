const mineflayer = require('mineflayer');
const { Movements, pathfinder, goals } = require('mineflayer-pathfinder');
const { GoalBlock } = goals;
const config = require('./settings.json');
const express = require('express');

// ============================================================
// KEEP ALIVE SERVER
// ============================================================
const app = express();
const PORT = process.env.PORT || 5000;
let botState = { connected: false, startTime: Date.now() };

app.get('/', (req, res) => res.send(`<body style="background:#0f172a;color:#2dd4bf;text-align:center;padding:50px;"><h1>👑 King Harshit's 1.19.3 Bot</h1></body>`));
app.listen(PORT, '0.0.0.0', () => console.log(`[Server] Live on ${PORT}`));

// ============================================================
// BOT LOGIC (LOCKED TO 1.19.3)
// ============================================================
let bot = null;
let activeIntervals = [];

function clearAllIntervals() {
  activeIntervals.forEach(id => clearInterval(id));
  activeIntervals = [];
}

function createBot() {
  if (bot) {
    clearAllIntervals();
    bot.removeAllListeners();
    try { bot.end(); } catch (e) {}
  }

  console.log(`[Bot] Connecting to 1.19.3 Server: ${config.server.ip}...`);

  bot = mineflayer.createBot({
    host: config.server.ip,
    port: config.server.port,
    username: config['bot-account'].username,
    version: config.server.version, // FIXED TO 1.19.3 from settings.json
    checkTimeoutInterval: 60000
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    botState.connected = true;
    console.log(`[+] Spawned on 1.19.3! Glory to King Harshit!`);
    
    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot, mcData);
    startRoyalModules(bot, mcData, defaultMove);
  });

  bot.on('end', (reason) => {
    botState.connected = false;
    console.log(`[-] Disconnected (${reason}). Rejoining in 5s...`);
    setTimeout(createBot, 5000);
  });

  bot.on('error', (err) => console.log(`[Error] ${err.message}`));
}

function startRoyalModules(bot, mcData, defaultMove) {
  // 1. KING HARSHIT CHAT
  const messages = config.utils['chat-messages'].messages;
  let i = 0;
  activeIntervals.push(setInterval(() => {
    if (botState.connected) {
      bot.chat(messages[i]);
      i = (i + 1) % messages.length;
    }
  }, 45000));

  // 2. RANDOM BLOCK INTERACTION (ANTI-BAN)
  activeIntervals.push(setInterval(async () => {
    if (!botState.connected) return;
    try {
      const block = bot.findBlock({
        matching: (b) => ['grass_block', 'dirt', 'stone', 'cobblestone'].includes(b.name),
        maxDistance: 4
      });
      if (block) await bot.dig(block);
    } catch (e) {}
  }, 15000 + Math.random() * 15000));

  // 3. RANDOM JUMP/LOOK
  activeIntervals.push(setInterval(() => {
    if (!botState.connected) return;
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 500);
    bot.look(Math.random() * Math.PI * 2, 0);
  }, 10000));
}

createBot();
