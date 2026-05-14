const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const BOT_TOKEN = '8693606970:AAHr_LgjLKJBsS1VMGk0ITJRHNn4xzd2XVw';
const GROUP_ID = -1003797958753;
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();

console.log('🚀 HR Button Bot v3.0 Starting...');

let userSessions = {};

const translations = {
  km: {
    welcome: '👋 សូមស្វាគមន៍ក្នុងប្រព័ន្ធលម្អាល់!',
    selectAction: '📋 សូមជ្រើសរើសលម្អាល់របស់លោក/នាង:',
    startWork: '✅ បកលុយល្អៗ',
    outWork: '🚪 ចេញពីការងារ',
    eatRice: '🍚 ឈានលូតលាន',
    requestOff: '📅 សូមស្នើលូតលាន',
    requestLoad: '📊 សូមស្នើការងារបន្ថែម',
    toilet: '🚽 លូតលាន',
    back: '🔙 ត្រលប់មក',
    enterName: '👤 សូមបញ្ចូលឈ្មោះ:',
    confirmed: '✅ បានបញ្ជាក់!',
    startWorkMsg: '✅ សូមស្វាគមន៍!\n👤 ឈ្មោះ: %name%\n🕐 ពេលវេលា: %time%\n📍 ស្ថានភាព: បកលុយល្អៗ!',
    outWorkMsg: '✅ សូមស្វាគមន៍!\n👤 ឈ្មោះ: %name%\n🕐 ពេលវេលា: %time%\n📍 សូមឱ្យថាសម្រាប់ការបំពេញបេសកកម្ម!',
    eatRiceMsg: '🍚 %name% ចូលលូតលាន\n⏳ ពេលចាប់ផ្តើម: %time%',
    toiletStartMsg: '⏱️ %name% ចូលលូតលាន\n⏳ ពេលចាប់ផ្តើម: %time%\n(ដែនកំណត់: 5 នាទី)',
    requestOffMsg: '📅 សូមស្នើលូតលាន\n👤 ឈ្មោះ: %name%\n🕐 ពេលវេលា: %time%',
    requestLoadMsg: '📊 សូមស្នើការងារបន្ថែម\n👤 ឈ្មោះ: %name%\n🕐 ពេលវេលា: %time%',
  },
  en: {
    welcome: '👋 Welcome to HR Assistant System!',
    selectAction: '📋 Please select an action:',
    startWork: '✅ Start Work',
    outWork: '🚪 Out Work',
    eatRice: '🍚 Eat Rice',
    requestOff: '📅 Request Off Day',
    requestLoad: '📊 Request Load',
    toilet: '🚽 Toilet',
    back: '🔙 Back',
    enterName: '👤 Please enter your name:',
    confirmed: '✅ Confirmed!',
    startWorkMsg: '✅ Welcome!\n👤 Name: %name%\n🕐 Time: %time%\n📍 Status: Good work!',
    outWorkMsg: '✅ Goodbye!\n👤 Name: %name%\n🕐 Time: %time%\n📍 Thank you for your work!',
    eatRiceMsg: '🍚 %name% taking a break\n⏳ Start time: %time%',
    toiletStartMsg: '⏱️ %name% started toilet break\n⏳ Start time: %time%\n(Limit: 5 minutes)',
    requestOffMsg: '📅 Request Off Day\n👤 Name: %name%\n🕐 Time: %time%',
    requestLoadMsg: '📊 Request Load\n👤 Name: %name%\n🕐 Time: %time%',
  },
  zh: {
    welcome: '👋 欢迎使用HR助理系统!',
    selectAction: '📋 请选择操作:',
    startWork: '✅ 开始工作',
    outWork: '🚪 下班',
    eatRice: '🍚 吃饭',
    requestOff: '📅 请假',
    requestLoad: '📊 加班申请',
    toilet: '🚽 厕所',
    back: '🔙 返回',
    enterName: '👤 请输入您的名字:',
    confirmed: '✅ 已确认!',
    startWorkMsg: '✅ 欢迎!\n👤 姓名: %name%\n🕐 时间: %time%\n📍 状态: 祝工作愉快!',
    outWorkMsg: '✅ 再见!\n👤 姓名: %name%\n🕐 时间: %time%\n📍 感谢您完成任务!',
    eatRiceMsg: '🍚 %name% 在休息中\n⏳ 开始时间: %time%',
    toiletStartMsg: '⏱️ %name% 开始休息\n⏳ 开始时间: %time%\n(限制: 5分钟)',
    requestOffMsg: '📅 请假申请\n👤 姓名: %name%\n🕐 时间: %time%',
    requestLoadMsg: '📊 加班申请\n👤 姓名: %name%\n🕐 时间: %time%',
  }
};

function t(lang, key, replacements = {}) {
  let text = translations[lang]?.[key] || translations['km'][key] || key;
  Object.entries(replacements).forEach(([k, v]) => {
    text = text.replace(`%${k}%`, v);
  });
  return text;
}

function getKeyboard(lang) {
  return {
    reply_markup: {
      keyboard: [
        [
          { text: t(lang, 'startWork') },
          { text: t(lang, 'outWork') },
          { text: t(lang, 'eatRice') }
        ],
        [
          { text: t(lang, 'requestOff') },
          { text: t(lang, 'requestLoad') }
        ],
        [
          { text: t(lang, 'toilet') },
          { text: t(lang, 'back') }
        ]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

bot.onText(/^\/start$/, (msg) => {
  const userId = msg.from.id;
  const lang = 'km';
  userSessions[userId] = { lang: lang, state: 'idle' };
  bot.sendMessage(msg.chat.id, t(lang, 'welcome') + '\n\n' + t(lang, 'selectAction'), getKeyboard(lang));
});

bot.on('message', (msg) => {
  if (msg.text.startsWith('/')) return;
  const userId = msg.from.id;
  const text = msg.text;
  const session = userSessions[userId] || { lang: 'km', state: 'idle' };
  const lang = session.lang;
  
  if (text === t(lang, 'startWork')) {
    userSessions[userId] = { lang: lang, state: 'waiting_name', action: 'startwork' };
    bot.sendMessage(msg.chat.id, t(lang, 'enterName'));
  }
  else if (text === t(lang, 'outWork')) {
    userSessions[userId] = { lang: lang, state: 'waiting_name', action: 'outwork' };
    bot.sendMessage(msg.chat.id, t(lang, 'enterName'));
  }
  else if (text === t(lang, 'eatRice')) {
    userSessions[userId] = { lang: lang, state: 'waiting_name', action: 'eatrice' };
    bot.sendMessage(msg.chat.id, t(lang, 'enterName'));
  }
  else if (text === t(lang, 'toilet')) {
    userSessions[userId] = { lang: lang, state: 'waiting_name', action: 'toilet' };
    bot.sendMessage(msg.chat.id, t(lang, 'enterName'));
  }
  else if (text === t(lang, 'requestOff')) {
    userSessions[userId] = { lang: lang, state: 'waiting_name', action: 'requestoff' };
    bot.sendMessage(msg.chat.id, t(lang, 'enterName'));
  }
  else if (text === t(lang, 'requestLoad')) {
    userSessions[userId] = { lang: lang, state: 'waiting_name', action: 'requestload' };
    bot.sendMessage(msg.chat.id, t(lang, 'enterName'));
  }
  else if (text === t(lang, 'back')) {
    userSessions[userId] = { lang: lang, state: 'idle' };
    bot.sendMessage(msg.chat.id, t(lang, 'selectAction'), getKeyboard(lang));
  }
  else if (session.state === 'waiting_name' && text && !text.startsWith('/')) {
    const name = text;
    const time = new Date().toLocaleTimeString();
    const action = session.action;
    
    let responseMsg = '';
    if (action === 'startwork') {
      responseMsg = t(lang, 'startWorkMsg', { name: name, time: time });
    } else if (action === 'outwork') {
      responseMsg = t(lang, 'outWorkMsg', { name: name, time: time });
    } else if (action === 'eatrice') {
      responseMsg = t(lang, 'eatRiceMsg', { name: name, time: time });
    } else if (action === 'toilet') {
      responseMsg = t(lang, 'toiletStartMsg', { name: name, time: time });
    } else if (action === 'requestoff') {
      responseMsg = t(lang, 'requestOffMsg', { name: name, time: time });
    } else if (action === 'requestload') {
      responseMsg = t(lang, 'requestLoadMsg', { name: name, time: time });
    }
    
    bot.sendMessage(-1003797958753, responseMsg);
    bot.sendMessage(msg.chat.id, t(lang, 'confirmed') + '\n' + responseMsg, getKeyboard(lang));
    userSessions[userId] = { lang: lang, state: 'idle' };
  }
});

app.get('/', (req, res) => {
  res.json({ status: '✅ Online', version: '3.0' });
});

app.listen(PORT, () => console.log('✅ Server on port ' + PORT));

setTimeout(() => {
  bot.sendMessage(-1003797958753, '✅ HR Button Bot v3.0 Online!\n\n📋 7 Easy Buttons:\n✅ Start Work\n🚪 Out Work\n🍚 Eat Rice\n📅 Request Off\n📊 Request Load\n🚽 Toilet\n🔙 Back\n\n🌐 Languages: ខ្មែរ / English / 中文').catch(() => {});
}, 2000);