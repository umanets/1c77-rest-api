const { Object: COMObject } = require('winax');
const { execSync } = require('child_process');
var winax = require('winax');

let v7 = null;
let v7PID = null;

function get1CV7PIDs() {
  try {
    const output = execSync('tasklist /FI "IMAGENAME eq 1cv7.exe" /FO CSV /NH', { encoding: 'utf8' });
    return output
      .split(/\r?\n/)
      .filter(line => line.trim())
      .map(line => {
        const cols = line.split(',');
        const pidStr = cols[1].replace(/"/g, '').trim();
        return parseInt(pidStr, 10);
      });
  } catch (error) {
    console.warn('⚠️ Не удалось получить список процессов 1С:', error.message);
    return [];
  }
}

function connect1C(userName, password = "") {
  const dbPath = process.env.ONEC_DB_PATH;
  if (!dbPath) {
    throw new Error('ONEC_DB_PATH is not set (path to the 1C 7.7 database folder)');
  }
  const beforePIDs = get1CV7PIDs();
  v7 = new COMObject('V77.Application');
  let initParams = `/d ${dbPath}`;
  if (userName) {
    initParams += ` /n "${userName}""`;
  }

  if (password) {
    initParams += ` /p "${password}""`;
  }
  const isConnected = v7.Initialize(v7.RMTrade, initParams, 'NO_SPLASH_SHOW');
  const afterPIDs = get1CV7PIDs();
  const newPIDs = afterPIDs.filter(pid => !beforePIDs.includes(pid));
  if (newPIDs.length > 0) {
    v7PID = newPIDs[0];
    console.log(`🆔 PID процесса 1С: ${v7PID}`);
  } else {
    console.warn('⚠️ Не удалось определить PID процесса 1С');
  }
  if (!isConnected) {
    console.error('❌ Не удалось подключиться к базе 1С.');
    process.exit(1);
  }
  console.log('✅ Подключение к 1С установлено');
  return v7;
}

function disconnect1C() {
  if (v7) {
    try {
      v7.ЗавершитьРаботуСистемы(1);
      v7 = 0;
      winax.release(v7);
      global.gc && global.gc();
      console.log('🧹 Подключение к 1С закрыто.');
    } catch (error) {
      console.error('⚠️ Ошибка при отключении от 1С:', error);
    }
  }
}

function kill1C() {
  if (v7PID) {
    try {
      console.log(`🛑 Принудительно завершаем 1С, PID: ${v7PID}`);
      execSync(`taskkill /PID ${v7PID} /F /T`);
      console.log(`✅ Процесс 1С остановлен, PID: ${v7PID}`);
    } catch (error) {
      console.error('⚠️ Ошибка при остановке 1С:', error);
    } finally {
      v7PID = null;
    }
  } else {
    console.warn('⚠️ PID процесса 1С не определен, пропускаем kill1C');
  }
}

module.exports = {
  connect1C,
  disconnect1C,
  kill1C,
};