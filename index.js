const express = require('express');
const oneC = require('./onec');

const app = express();
const PORT = 3001;

const v7 = oneC.connect1C('Test');

app.get('/find', (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({ error: 'Укажите параметр ?code=...' });
    }

    const catalog = v7.CreateObject('Справочник.Контрагенты');
    if (!catalog) {
      return res.status(500).json({ error: 'Не удалось открыть справочник Контрагенты.' });
    }

    const item = catalog.НайтиПоКоду(code);

    if (!item) {
      return res.status(404).json({ message: `Контрагент с кодом ${code} не найден.` });
    }

    const name = catalog.Наименование + ''

    console.log('✅ Контрагент найден', name);
    
    res.json({
      message: 'Контрагент найден.',
      data: {
        code: code,
        name: name
      }
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});

// === Правильное завершение сервера и закрытие 1С ===
process.on('SIGINT', () => {
  console.log('\n🛑 Получен SIGINT. Завершаем сервер...');
  oneC.disconnect1C();
  oneC.kill1C();
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен SIGTERM. Завершаем сервер...');
  oneC.disconnect1C();
  oneC.kill1C();
  process.exit();
});
