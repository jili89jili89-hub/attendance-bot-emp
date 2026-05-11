const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const path = require('path');

// ==================== CONFIGURATION ====================
const BOT_TOKEN = '8693606970:AAHr_LgjLKJBsS1VMGk0ITJRHNn4xzd2XVw';
const GROUP_ID = -1003797958753; // Attendance EMP
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();

// Data storage
const DATA_FILE = 'bot-data.json';

console.log('🚀 Attendance Bot ចាប់ផ្តើម...');
console.log('📱 Token:', BOT_TOKEN.substring(0, 15) + '...');
console.log('📍 Group ID:', GROUP_ID);
console.log('📁 Data File:', DATA_FILE);

// ==================== DEFAULT SETTINGS ====================
const defaultGroupSettings = {
  language: 'en',
  timezone: 'UTC+8',
  workStart: '09:00',
  workEnd: '18:00',
  smokeLimit: 10,
  toiletLimit: 5,
  mealTimes: ['07:30-08:30', '12:00-13:00', '18:00-19:00'],
  reportTime: '18:30',
  holidays: [6, 7],
  penaltyRate: 50,
  penaltyCap: 5000,
  muteMode: false,
  freeLateMinutes: 0,
  reminderEnabled: true,
  freeMembers: []
};

let groupSettings = {};
let attendanceData = {};
let userProfiles = {};

// ==================== DATA MANAGEMENT ====================
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      groupSettings = data.groupSettings || {};
      attendanceData = data.attendanceData || {};
      userProfiles = data.userProfiles || {};
      console.log('✅ ទិន្នន័យ​បាន​ផ្ទុក');
    }
  } catch (error) {
    console.error('❌ Error loading data:', error);
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ groupSettings, attendanceData, userProfiles }, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Error saving data:', error);
  }
}

function getGroupSettings(groupId) {
  if (!groupSettings[groupId]) {
    groupSettings[groupId] = JSON.parse(JSON.stringify(defaultGroupSettings));
    saveData();
  }
  return groupSettings[groupId];
}

function initializeGroupData(groupId) {
  if (!attendanceData[groupId]) {
    attendanceData[groupId] = {
      members: {},
      dailyReports: [],
      monthlyReports: []
    };
    saveData();
  }
  return attendanceData[groupId];
}

loadData();

// ==================== TRANSLATIONS ====================
const translations = {
  en: {
    welcome: '👋 ស្វាគមន៍! Welcome to Attendance Bot!\n\n✅ Multi-language (EN/中文/Tiếng Việt)\n⏰ Timezone management\n🏢 Custom working hours\n🚬 Smoking break limits\n🚽 Toilet break limits\n📊 Daily reports\n💰 Penalty calculation\n📈 Monthly summaries',
    groupSet: '✅ Group bound successfully!\n📍 Group ID: %id%\n👥 Members can now check in!',
    checkin: '✅ %name% checked in at %time%',
    checkout: '✅ %name% checked out at %time%',
    late: '⚠️ %name% is LATE by %minutes% minutes',
    languageSet: '✅ Language changed to %lang%',
    timezoneSet: '✅ Timezone: %timezone%',
    workTimeSet: '✅ Work hours: %start% - %end%',
    smokeLimitSet: '✅ Smoke limit: %limit% min',
    toiletLimitSet: '✅ Toilet limit: %limit% min',
    reportTimeSet: '✅ Report time: %time%',
    mealTimesSet: '✅ Meal times configured',
    muteModeSet: '✅ Mute mode: %status%',
    freeLateSet: '✅ Free late: %minutes% min',
    reminderSet: '✅ Reminders: %status%',
    penaltySet: '✅ Penalty: $%rate%/min (cap: $%cap%)',
    holidaysSet: '✅ Holidays set',
    currentSettings: '⚙️ *Current Settings*\n\n',
    daily_report: '📊 *Daily Attendance Report*\n\nDate: %date%\nTimezone: %timezone%\n\n✅ On Time: %onTime%\n⚠️ Late: %late%\n❌ Absent: %absent%\n\n💰 Total Penalties: $%penalty%',
    monthly_report: '📈 *Monthly Report*\n\nMonth: %month%\nWorking Days: %days%\n\n✅ On Time: %onTime%\n⚠️ Late: %late%\n❌ Absent: %absent%\n\n💰 Total Penalties: $%totalPenalty%',
  },
  zh: {
    welcome: '👋 欢迎使用出勤机器人！\n\n✅ 多语言支持\n⏰ 时区管理\n🏢 自定义工作时间\n🚬 吸烟限制\n🚽 如厕限制\n📊 每日报告\n💰 罚款计算\n📈 月度汇总',
    groupSet: '✅ 群组绑定成功！\n📍 群组ID: %id%\n👥 成员现在可以打卡！',
    checkin: '✅ %name% 在 %time% 打卡',
    checkout: '✅ %name% 在 %time% 签退',
    late: '⚠️ %name% 迟到 %minutes% 分钟',
    languageSet: '✅ 语言已改为 %lang%',
    timezoneSet: '✅ 时区: %timezone%',
    workTimeSet: '✅ 工作时间: %start% - %end%',
    smokeLimitSet: '✅ 吸烟限制: %limit% 分钟',
    toiletLimitSet: '✅ 如厕限制: %limit% 分钟',
    reportTimeSet: '✅ 报告时间: %time%',
    mealTimesSet: '✅ 用餐时间已配置',
    muteModeSet: '✅ 禁言模式: %status%',
    freeLateSet: '✅ 免费迟到: %minutes% 分钟',
    reminderSet: '✅ 提醒: %status%',
    penaltySet: '✅ 罚款: $%rate%/分钟 (上限: $%cap%)',
    holidaysSet: '✅ 假期已设置',
    currentSettings: '⚙️ *当前设置*\n\n',
    daily_report: '📊 *每日报告*\n\n日期: %date%\n时区: %timezone%\n\n✅ 准时: %onTime%\n⚠️ 迟到: %late%\n❌ 缺席: %absent%\n\n💰 总罚款: $%penalty%',
    monthly_report: '📈 *月度报告*\n\n月份: %month%\n工作日: %days%\n\n✅ 准时: %onTime%\n⚠️ 迟到: %late%\n❌ 缺席: %absent%\n\n💰 总罚款: $%totalPenalty%',
  },
  vi: {
    welcome: '👋 Chào mừng đến Bot Chấm Công!\n\n✅ Hỗ trợ đa ngôn ngữ\n⏰ Quản lý múi giờ\n🏢 Giờ làm việc tùy chỉnh\n🚬 Giới hạn hút thuốc\n🚽 Giới hạn vệ sinh\n📊 Báo cáo hàng ngày\n💰 Tính toán phạt\n📈 Tóm tắt hàng tháng',
    groupSet: '✅ Liên kết nhóm thành công!\n📍 ID Nhóm: %id%\n👥 Thành viên có thể chấm công!',
    checkin: '✅ %name% chấm công lúc %time%',
    checkout: '✅ %name% kết thúc lúc %time%',
    late: '⚠️ %name% muộn %minutes% phút',
    languageSet: '✅ Ngôn ngữ đã đổi thành %lang%',
    timezoneSet: '✅ Múi giờ: %timezone%',
    workTimeSet: '✅ Giờ làm việc: %start% - %end%',
    smokeLimitSet: '✅ Giới hạn hút thuốc: %limit% phút',
    toiletLimitSet: '✅ Giới hạn vệ sinh: %limit% phút',
    reportTimeSet: '✅ Thời gian báo cáo: %time%',
    mealTimesSet: '✅ Thời gian ăn đã cấu hình',
    muteModeSet: '✅ Chế độ im lặng: %status%',
    freeLateSet: '✅ Muộn miễn phí: %minutes% phút',
    reminderSet: '✅ Nhắc nhở: %status%',
    penaltySet: '✅ Phạt: $%rate%/phút (tối đa: $%cap%)',
    holidaysSet: '✅ Các ngày nghỉ đã được đặt',
    currentSettings: '⚙️ *Cài đặt hiện tại*\n\n',
    daily_report: '📊 *Báo cáo Hàng Ngày*\n\nNgày: %date%\nMúi giờ: %timezone%\n\n✅ Đúng giờ: %onTime%\n⚠️ Muộn: %late%\n❌ Vắng: %absent%\n\n💰 Tổng phạt: $%penalty%',
    monthly_report: '📈 *Báo cáo Hàng Tháng*\n\nTháng: %month%\nNgày làm việc: %days%\n\n✅ Đúng giờ: %onTime%\n⚠️ Muộn: %late%\n❌ Vắng: %absent%\n\n💰 Tổng phạt: $%totalPenalty%',
  }
};

function t(lang, key, replacements = {}) {
  let text = translations[lang]?.[key] || translations['en'][key] || key;
  Object.entries(replacements).forEach(([placeholder, value]) => {
    text = text.replace(`%${placeholder}%`, value);
  });
  return text;
}

// ==================== COMMAND HANDLERS ====================

// /start - Initialize bot
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const settings = getGroupSettings(chatId);
  
  bot.sendMessage(chatId, t('en', 'welcome'), { parse_mode: 'HTML' });
});

// /set_group - Bind group
bot.onText(/\/set_group/, (msg) => {
  const chatId = msg.chat.id;
  initializeGroupData(chatId);
  const settings = getGroupSettings(chatId);
  saveData();
  
  const message = t(settings.language, 'groupSet', { id: chatId });
  bot.sendMessage(chatId, message);
});

// /checkin - Check in
bot.onText(/\/checkin/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.first_name || 'User';
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  
  const settings = getGroupSettings(chatId);
  const groupData = initializeGroupData(chatId);
  
  if (!groupData.members[userId]) {
    groupData.members[userId] = {
      name: userName,
      checkIns: [],
      checkOuts: [],
      totalMinutes: 0
    };
  }
  
  groupData.members[userId].checkIns.push({
    time: time,
    date: new Date().toLocaleDateString()
  });
  
  saveData();
  
  bot.sendMessage(chatId, t(settings.language, 'checkin', { name: userName, time: time }));
});

// /checkout - Check out
bot.onText(/\/checkout/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.first_name || 'User';
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  
  const settings = getGroupSettings(chatId);
  const groupData = initializeGroupData(chatId);
  
  if (!groupData.members[userId]) {
    groupData.members[userId] = {
      name: userName,
      checkIns: [],
      checkOuts: [],
      totalMinutes: 0
    };
  }
  
  groupData.members[userId].checkOuts.push({
    time: time,
    date: new Date().toLocaleDateString()
  });
  
  saveData();
  
  bot.sendMessage(chatId, t(settings.language, 'checkout', { name: userName, time: time }));
});

// /set_language - Change language
bot.onText(/\/set_language\s+(\w+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const settings = getGroupSettings(chatId);
  const lang = match[1].toLowerCase();
  
  if (!translations[lang]) {
    bot.sendMessage(chatId, '❌ Language not supported. Use: en, zh, vi');
    return;
  }
  
  settings.language = lang;
  saveData();
  
  const langName = { en: 'English', zh: '中文', vi: 'Tiếng Việt' }[lang];
  bot.sendMessage(chatId, t(lang, 'languageSet', { lang: langName }));
});

// /set_timezone - Set timezone
bot.onText(/\/set_timezone\s+(.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const settings = getGroupSettings(chatId);
  const timezone = match[1].trim();
  
  settings.timezone = timezone;
  saveData();
  
  bot.sendMessage(chatId, t(settings.language, 'timezoneSet', { timezone }));
});

// /set_work_time - Set working hours
bot.onText(/\/set_work_time\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})/, (msg, match) => {
  const chatId = msg.chat.id;
  const settings = getGroupSettings(chatId);
  
  settings.workStart = match[1];
  settings.workEnd = match[2];
  saveData();
  
  bot.sendMessage(chatId, t(settings.language, 'workTimeSet', { start: match[1], end: match[2] }));
});

// /set_smoke_limit - Set smoking limit
bot.onText(/\/set_smoke_limit\s+(\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const settings = getGroupSettings(chatId);
  const limit = parseInt(match[1]);
  
  settings.smokeLimit = limit;
  saveData();
  
  bot.sendMessage(chatId, t(settings.language, 'smokeLimitSet', { limit }));
});

// /set_toilet_limit - Set toilet limit
bot.onText(/\/set_toilet_limit\s+(\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const settings = getGroupSettings(chatId);
  const limit = parseInt(match[1]);
  
  settings.toiletLimit = limit;
  saveData();
  
  bot.sendMessage(chatId, t(settings.language, 'toiletLimitSet', { limit }));
});

// /set_report_time - Set report time
bot.onText(/\/set_report_time\s+(\d{1,2}:\d{2})/, (msg, match) => {
  const chatId = msg.chat.id;
  const settings = getGroupSettings(chatId);
  
  settings.reportTime = match[1];
  saveData();
  
  bot.sendMessage(chatId, t(settings.language, 'reportTimeSet', { time: match[1] }));
});

// /set_penalty - Set penalty
bot.onText(/\/set_penalty\s+(\d+)\s+(\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const settings = getGroupSettings(chatId);
  
  settings.penaltyRate = parseInt(match[1]);
  settings.penaltyCap = parseInt(match[2]);
  saveData();
  
  bot.sendMessage(chatId, t(settings.language, 'penaltySet', { rate: match[1], cap: match[2] }));
});

// /settings - View current settings
bot.onText(/\/settings/, (msg) => {
  const chatId = msg.chat.id;
  const settings = getGroupSettings(chatId);
  
  let settingsText = t(settings.language, 'currentSettings');
  settingsText += `🌐 Language: ${settings.language}\n`;
  settingsText += `🕐 Timezone: ${settings.timezone}\n`;
  settingsText += `⏰ Work Time: ${settings.workStart} - ${settings.workEnd}\n`;
  settingsText += `🚬 Smoke Limit: ${settings.smokeLimit} min\n`;
  settingsText += `🚽 Toilet Limit: ${settings.toiletLimit} min\n`;
  settingsText += `📊 Report Time: ${settings.reportTime}\n`;
  settingsText += `💰 Penalty: $${settings.penaltyRate}/min (cap: $${settings.penaltyCap})`;
  
  bot.sendMessage(chatId, settingsText, { parse_mode: 'Markdown' });
});

// /test_report - Test daily report
bot.onText(/\/test_report/, (msg) => {
  const chatId = msg.chat.id;
  const settings = getGroupSettings(chatId);
  
  const today = new Date().toLocaleDateString();
  let report = t(settings.language, 'daily_report', {
    date: today,
    timezone: settings.timezone,
    onTime: '45',
    late: '8',
    absent: '2',
    penalty: '2450'
  });
  
  bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
});

// /test_monthly_report - Test monthly report
bot.onText(/\/test_monthly_report/, (msg) => {
  const chatId = msg.chat.id;
  const settings = getGroupSettings(chatId);
  
  const monthName = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  let report = t(settings.language, 'monthly_report', {
    month: monthName,
    days: '22',
    onTime: '850',
    late: '120',
    absent: '30',
    totalPenalty: '18500'
  });
  
  bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
});

// /help - Show help
bot.onText(/\/help/, (msg) => {
  const helpText = `📋 *Available Commands:*

🔐 *Check In/Out:*
/checkin - ចូលមក
/checkout - ចេញទៅ

⚙️ *Configuration:*
/set_group - ភ្ជាប់ក្រុម
/set_language [en|zh|vi] - ប្តូរសាលក
/set_timezone [UTC+X] - កំណត់ពេល
/set_work_time [HH:MM HH:MM] - ម៉ោងការងារ
/set_smoke_limit [min] - ដែនកំណត់ការលូតលាន
/set_toilet_limit [min] - ដែនកំណត់
/set_report_time [HH:MM] - ពេលរាយការណ៍
/set_penalty [rate] [cap] - លុយស្នងថ្លៃ

📊 *Reports:*
/test_report - របាយការណ៍ប្រចាំថ្ងៃ
/test_monthly_report - របាយការណ៍ប្រចាំខែ
/settings - មើលលក្ខណៈពិសេស
/help - ម៉ឺនុយ`;
  
  bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'Markdown' });
});

// Error handlers
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

// Express health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'Bot is running',
    group: 'Attendance EMP',
    groupId: GROUP_ID,
    timestamp: new Date()
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Bot polling for messages...`);
});

// Send welcome message to group on startup
setTimeout(() => {
  initializeGroupData(GROUP_ID);
  getGroupSettings(GROUP_ID);
  saveData();
  
  bot.sendMessage(GROUP_ID, `
✅ *Attendance Bot ចាប់ផ្តើម!*

👋 ស្វាគមន៍ក្រុម "Attendance EMP"!

🎯 *ដូច្នេះឥឡូវអ្នកអាច:*
✅ /checkin - ចូលមក
✅ /checkout - ចេញទៅ
⚙️ /set_group - ភ្ជាប់ក្រុម
📊 /settings - មើលលក្ខណៈពិសេស
❓ /help - ដាក់ឡើង

សូមចាប់ផ្តើម! 🚀
  `, { parse_mode: 'Markdown' });
}, 2000);

console.log('✅ Attendance Bot ដំណើរការលម្អាល់!');
