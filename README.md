# one-s-rest

Этот проект реализует REST API для работы с 1С 7.7 через COM, используя пакет winax.

## Требования

- Windows (32-бит)
- Microsoft Visual Studio 2017 с компонентами C++ и Windows SDK (x86)
- Node.js v18.12.0 (32-бит) в папке `..\one-s-node` (https://nodejs.org/dist/v18.12.0/node-v18.12.0-win-x86.zip)
- Установленный OLE DB провайдер 1С 7.7 (например SRV1CV77)

## Сборка и установка

1. Очищаем проект и кеш npm:
   ```powershell
   Remove-Item -Recurse -Force node_modules, package-lock.json
   npm cache clean --force
   ```

2. Проверяем, что используется 32-битная версия Node.js:
   ```powershell
   ..\one-s-node\node.exe -p "process.arch + ' @ ' + process.version"
   # => ia32 @ v18.12.0
   ```

3. Устанавливаем `winax` как 32-битный модуль с пересборкой из исходников:
   ```powershell
   $env:npm_config_build_from_source = 'true'
   $env:npm_config_arch             = 'ia32'
   $env:npm_config_target_arch      = 'ia32'
   $env:npm_config_target           = 'v18.12.0'
   $env:npm_config_disturl          = 'https://nodejs.org/download/release'

   ..\one-s-node\npm.cmd install winax --build-from-source --msvs_version=2017 --force
   ```

4. Проверяем соответствие ABI модуля версии Node.js:
   ```powershell
   ..\one-s-node\node.exe -p "process.versions.modules"
   # => 108
   ```

5. Запускаем REST API:
   ```powershell
   # Обычный запуск (некоторые методы 1С могут быть недоступны)
   ..\one-s-node\node.exe index.js

   # Запуск через WSH-обёртку Winax (проксирует все COM-методы, включая Connect):
   ..\one-s-node\node.exe node_modules\winax\NodeWScript.js index.js
   ```

## Автоматическая пересборка `winax`

Для упрощения процессов пересборки включён файл `rebuild-winax.bat`, который выполняет все необходимые шаги:

```bat
@echo off
setlocal enabledelayedexpansion

echo.
echo [1/5] Удаление старой папки node_modules\winax...
rmdir /s /q node_modules\winax

echo.
echo [2/5] Очистка кеша npm...
npm cache clean --force

echo.
echo [3/5] Установка переменных окружения для сборки...
set "npm_config_build_from_source=true"
set "npm_config_arch=ia32"
set "npm_config_target_arch=ia32"
set "npm_config_target=v18.12.0"
set "npm_config_disturl=https://nodejs.org/download/release"

echo.
echo [4/5] Установка winax из исходников...
..\one-s-node\npm.cmd install winax --build-from-source --msvs_version=2017 --force
if %errorlevel% neq 0 (
  echo [ERROR] Не удалось пересобрать winax.
  pause
  exit /b 1
)

echo.
echo [5/5] Проверка ABI модуля...
..\one-s-node\node.exe -p "process.versions.modules"

echo.
echo [SUCCESS] winax успешно пересобран!
pause
endlocal
```

Запуск:
```bat
rebuild-winax.bat
```

## Тестирование API

1. Проверка доступности сервера (не требует 1С):
   ```powershell
   curl http://localhost:3001/ping
   # pong
   ```

2. Выполнение запроса к базе 1С через ADODB/OLE DB:
    ```powershell
    curl http://localhost:3001/data
    # -> [ { "Test": 1 } ] или { error: ... }
    ```

> 1С thick-client UI запускать **не нужно** — COM-сервер будет поднят автоматически;
> база `one-s-trukr` должна существовать и содержать каталог `Контрагенты`.
>
> Для проверки работоспособности без реальной базы можно временно заменить
> в `index.js` текст запроса на:
> ```js
> query.Text = "ВЫБРАТЬ 1 КАК Test";
> ```
