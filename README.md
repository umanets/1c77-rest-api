# one-s-rest

Этот проект реализует REST API для работы с 1С 7.7 через COM, используя пакет winax.

## Требования

- Windows (32-бит)
- Microsoft Visual Studio 2017 с компонентами C++ и Windows SDK (x86)
- Node.js v18.12.0 (32-бит) в папке `..\one-s-node` (https://nodejs.org/dist/v18.12.0/node-v18.12.0-win-x86.zip)

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


6. Выполнение запроса к базе 1С через ADODB/OLE DB:
    ```powershell
    curl http://localhost:3001/find?code=51
    # -> [ { "Test": 1 } ] или { error: ... }
    ```

> 1С thick-client UI запускать **не нужно** — COM-сервер будет поднят автоматически;
> база `one-s-trukr` должна существовать и содержать каталог `Контрагенты`.
