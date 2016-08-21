/**
 * Different localizations for terminal application.
 *
 * How to add any other language support:
 * 1. Add localization sign as a key to nested objects (please, use 2-letter code of the country);
 * 2. Fill dictionary object below with new language units;
 * 3. Build the project and try it!
 *
 * Do not forget to check that all language units are filled. For case of non-existing language
 * unit you will receive warning text instead of expected phrase.
 *
 * This constant includes all terminal localizations. Properties of this object is an ID's by
 * which it is possible to get required localized string with this.get(ID) method.
 *
 * Symbols "%s" or "%n" will be replaced by string or number respectively if arguments to "get"
 * function are passed.
 */
export default {
    "oldHelp": {
        en: `Caché WEB Terminal v/* @echo package.version */\r\n\r\n` +
        "\x1B[4mAvailable commands:\x1B[0m\r\n" +
        "\x1B[33m/help\x1B[0m\x1B[32GShow the help information you are reading now.\r\n" +
        "\x1B[33m/autocomplete\x1B[0m [sys]\x1B[32GPerforms autocomplete data loading. The system autocomplete" +
        " file will be generated only the first time command execute. To generate system " +
        "autocomplete again, use " +
        "\x1B[1msys\x1B[0m parameter.\r\n" +
        "\x1B[33m/echo\x1B[0m [param1] [param2] ...\x1B[32GEcho each argument of this command." +
        "\r\n\x1B[33m/rename\x1B[0m [name]\x1B[32GSpecify a name for the terminal instance. This name " +
        "will be shown after terminal startup and as a page title. Empty argument will remove specified name." +
        "\r\n\x1B[33m/trace\x1B[0m [global/filePath]\x1B[32GStart tracing global or file. To stop " +
        "tracing, enter command without arguments. To stop tracing particular file or " +
        "global, enter trace command again.\r\n" +
        "\x1B[33m/sql\x1B[0m\x1B[32GEnter or exit SQL mode.\r\n" +
        "\x1B[33m/reset\x1B[0m\x1B[32GReset terminal application to defaults.\r\n" +
        "{command} \x1B[33m/favorite\x1B[0m {phrase}\x1B[32GSave command for future use.\r\n" +
        "\x1B[33m/favorite\x1B[0m {phrase}\x1B[32GLoad previously saved command.\r\n" +
        "{definition} \x1B[33m/define\x1B[0m {phrase}\x1B[32GReplace each next {phrase} with {definition}. To " +
        "get more information, call command without parameters.\r\n" +
        "\x1B[33m/VERSION\x1B[0m\x1B[32GOutput terminal application VERSION.\r\n" +
        "\x1B[33m/update\x1B[0m\x1B[32GCheck for updates and prompt to update if new VERSION is available.\r\n" +
        "\x1B[33m/settings\x1B[0m\x1B[32GShow or change terminal settings.\r\n" +
        "\x1B[33m/about\x1B[0m\x1B[32GProject information.\r\n\r\n" +
        "\x1B[4mControl keys:\x1B[0m\r\n" +
        "\x1B[33mTAB\x1B[0m\x1B[32GComplete input if autocomplete variant is available.\r\n" +
        "\x1B[33mCTRL\x1B[0m\x1B[32GLeft/right control will switch next/previous available" +
        " autocomplete variant.\r\n",
        ru: `Caché WEB Terminal v/* @echo package.version */\r\n\r\n` +
        "\x1B[4mДоступные команды:\x1B[0m\r\n" +
        "\x1B[33m/help\x1B[0m\x1B[32GПоказать вспомагательную информацию, которую вы сейчас читаете.\r\n" +
        "\x1B[33m/autocomplete\x1B[0m [sys]\x1B[32GПодгружает данные для автодополнения. Файлы системного автодополнения" +
        " будут сгенерированы только при первом вызове команды. Если вы внесли изменения " +
        "в ваш код или хотите обновить автодополнение системных классов, воспользуйтесь параметром " +
        "\x1B[1msys\x1B[0m.\r\n" +
        "\x1B[33m/echo\x1B[0m [параметр1] [второй] ...\x1B[32GОтображает каждый аргумент команды." +
        "\r\n\x1B[33m/rename\x1B[0m [name]\x1B[32GУстановить имя для экземпляра терминала. Это имя " +
        "будет показано после загрузки терминала и как заголовок страницы. Пустой аргумент уберёт установленное имя." +
        "\r\n\x1B[33m/trace\x1B[0m [глобал/путь]\x1B[32GНаблюдать за изменениями в файле или глобале. Чтобы " +
        "перестать наблюдать за изменениями, введите команду ещё раз. Команда без аргументов" +
        " остановит наблюдение за всеми файлами и глобалами.\r\n" +
        "\x1B[33m/sql\x1B[0m\x1B[32GПереключиться или выйти из SQL-режима.\r\n" +
        "\x1B[33m/reset\x1B[0m\x1B[32GВернуть терминал в первоначальное состояние.\r\n" +
        "{команда} \x1B[33m/favorite\x1B[0m {фраза}\x1B[32GСохранить команду для дальнейшего использования.\r\n" +
        "\x1B[33m/favorite\x1B[0m {фраза}\x1B[32GВосстановит ранее загруженную команду.\r\n" +
        "{определение} \x1B[33m/define\x1B[0m {фраза}\x1B[32GЗаменять куждую {фразу} {определением}. Чтобы " +
        "получить больше информации, вызовите команду без аргументов.\r\n" +
        "\x1B[33m/VERSION\x1B[0m\x1B[32GВывести информацию о версии терминала.\r\n" +
        "\x1B[33m/update\x1B[0m\x1B[32GПроверить наличие обновлений и спросить у пользователя, нужно " +
        "ли выполнить обновление, если доступна новая версия.\r\n" +
        "\x1B[33m/settings\x1B[0m\x1B[32GПоказать или изменить настройки терминала.\r\n" +
        "\x1B[33m/about\x1B[0m\x1B[32GИнформация о проекте.\r\n\r\n" +
        "\x1B[4mУправляющие клавиши:\x1B[0m\r\n" +
        "\x1B[33mTAB\x1B[0m\x1B[32GЗавершить ввод, если доступен вариант автодополнения.\r\n" +
        "\x1B[33mCTRL\x1B[0m\x1B[32GЛевый/правый CTRL перейдёт к следующему/предыдущему" +
        " доступному варианту автодополнения.\r\n"
    },
    2: {
        en: "Connection to Caché Server established.",
        ru: "Соединение с сервером Caché установлено."
    },
    3: {
        en: "Unable to send data to server.",
        ru: "Невозможно отправить данные на сервер."
    },
    4: {
        en: "WebSocket connection closed. Code %n, reason: %s.",
        ru: "Соединение WebSocket закрыто. Код %n, причина: %s."
    },
    5: {
        en: "Unable to trace %s.",
        ru: "Невозможно наблюдать за %s."
    },
    6: {
        en: "WebSocket connection error (%s). Trying to connect again in %n seconds...",
        ru: "Ошибка подключения WebSocket (%s). Повторная попытка подключения через %n секунд..."
    },
    7: {
        en: "Start tracing %s.",
        ru: "Наблюдение за %s начато."
    },
    8: {
        en: "Stop tracing %s.",
        ru: "Наблюдение за %s закончено."
    },
    9: {
        en: "Refresh page to apply reset.",
        ru: "Обновите страницу чтобы применить сброс."
    },
    10: {
        en: "Authorization successful.",
        ru: "Авторизация прошла успешно."
    },
    11: {
        en: "Usage:\r\n{your command} \x1B[1m/favorite\x1B[0m {name}" +
        "\x1B[35GTo save command.\r\n\x1B[1m/favorite\x1B[0m {name} \x1B[35GTo load " +
        "command.\r\nPreviously saved names: %s.",
        ru: "Употребление:\r\n{команда} \x1B[1m/favorite\x1B[0m {имя}" +
        "\x1B[35GДля сохранения команды.\r\n\x1B[1m/favorite\x1B[0m {имя} \x1B[35GДля загрузки " +
        "команды.\r\nРанее сохранены команды под именами: %s."
    },
    12: {
        en: "No command saved for \"%s\".\r\nPreviously saved: %s.",
        ru: "Команда с именем \"%s\" не сохранена.\r\nРанее сохранённые: %s."
    },
    13: {
        en: "%s\x1B[1m defined as \x1B[0m%s",
        ru: "%s\x1B[1m определено как \x1B[0m%s"
    },
    14: {
        en: "Definitions removed.",
        ru: "Определения удалены."
    },
    15: {
        en: "\x1B[4mUsage:\x1B[0m\r\n\x1B[1m/define\x1B[0m {everything}" +
        " {phrase}\x1B[35GTo define {phrase} as {everything}.\r\n\x1B[1m/define\x1B[0m " +
        "clear\x1B[35GClears all definitions.\r\n\x1B[4mExample:\x1B[0m "
        + "\x1B[2m##class(%Library.File).Exists( \x1B[0m\x1B[1m/define\x1B[0m \x1B[2m?f(\x1B[0m \r\n" +
        "This will set shorten expression for checking if file exists. Then, " +
        "commands like \x1B[2mw ?f(\"C:\")\x1B[0m will be automatically replaced with " +
        "\x1B[2mw ##class(%Library.File).Exists(\"C:\")\x1B[0m when submitting. " +
        "To clear definitions, give \"clear\" parameter.\r\n\x1B[4mList of definitions:\x1B[0m %s.",
        ru: "\x1B[4mИспользование:\x1B[0m\r\n\x1B[1m/define\x1B[0m {выражение}" +
        " {определение}\x1B[35GКаждое вхождение {определения} в строку ввода будет заменено " +
        "на соответствующее {выражение}.\r\n\x1B[1m/define\x1B[0m " +
        "clear\x1B[35GУдалит все ранее добавленные определения.\r\n\x1B[4mПример:\x1B[0m "
        + "\x1B[2m##class(%Library.File).Exists( \x1B[0m\x1B[1m/define\x1B[0m \x1B[2m?f(\x1B[0m \r\n" +
        "Это установит сокращённое выражение для проверки существования файла. После, " +
        "команды вида \x1B[2mw ?f(\"C:\")\x1B[0m будут автоматически преобразованы в " +
        "\x1B[2mw ##class(%Library.File).Exists(\"C:\")\x1B[0m при отправке. " +
        "Чтобы удалить определения, передайте параметр \"clear\".\r\n\x1B[4m" +
        "Список определений:\x1B[0m %s."
    },
    16: {
        en: "Caché WEB Terminal v%s\r\nChecking for updates...",
        ru: "Caché WEB Terminal v%s\r\nПроверка обновлений..."
    },
    17: {
        en: "",
        ru: ""
    },
    18: {
        en: "Merging autocomplete database for %s...",
        ru: "Объединение базы данных автодополнения для %s..."
    },
    19: {
        en: "Classes merged: %n",
        ru: "Классов объединено: %n"
    },
    20: {
        en: "Globals merged: %n",
        ru: "Глобалов объединено: %n"
    },
    21: {
        en: "No autocomplete file found on server. Requesting...",
        ru: "Файл автодополнения на сервере не найден. Запрос файла..."
    },
    22: {
        en: "Authorization failed.",
        ru: "Авторизация не удалась."
    },
    23: {
        en: "A new VERSION of Caché WEB Terminal available. Would you " +
        "like to install it? (Y/n)",
        ru: "Новая версия Caché WEB Terminal доступна. Хотите ли вы " +
        "установить её? (Y/n)"
    },
    24: {
        en: "Updating...",
        ru: "Обновление..."
    },
    25: {
        en: "Caché WEB Terminal is up-to-date.",
        ru: "На данный момент установлена последняя версия Caché WEB Terminal."
    },
    26: {
        en: "\x1B[4mCurrent settings:\x1B[0m\r\n%s \x1B[25G= %s (available: %s)\r\n%s \x1B[25G= %s " +
        "(available: %s)\r\n%s \x1B[25G= %s\r\n%s \x1B[25G= %s\r\n%s \x1B[25G= %s" +
        "\r\nTo change values, enter command with argument \x1B[3m{NAME}={VALUE}\x1B[0m.",
        ru: "\x1B[4mТекущие настройки:\x1B[0m\r\n%s \x1B[25G= %s (доступны: %s)\r\n%s \x1B[25G= %s " +
        "(доступны: %s)\r\n%s \x1B[25G= %s\r\n%s \x1B[25G= %s\r\n%s \x1B[25G= %s" +
        "\r\nЧтобы изменить значения, введите команду с аргументом \x1B[3m{ИМЯ}={ЗНАЧЕНИЕ}\x1B[0m."
    },
    27: {
        en: "Terminal locale changed to %s.",
        ru: "Язык терминала изменён на %s."
    },
    28: {
        en: "Unable to change locale to %s.",
        ru: "Невозможно изменить язык на %s."
    },
    29: {
        en: "Start generating autocomplete",
        ru: "Начинается генерация автодополнения"
    },
    30: {
        en: "Wrong namespace:",
        ru: "Неправильная область:"
    },
    31: {
        en: "Unable to create directory csp/WebTerminal/js/autocomplete.",
        ru: "Невозможно создать директорию csp/WebTerminal/js/autocomplete."
    },
    32: {
        en: "Classes scanned:",
        ru: "Сканировано классов:"
    },
    33: {
        en: "Generation complete.",
        ru: "Генерация завершена."
    },
    34: {
        en: "Request",
        ru: "Запрос"
    },
    35: {
        en: "Updating terminal... Connection will be lost, so just reload terminal.",
        ru: "Обновление терминала... Соединение будет разорвано, потому просто перезагрузите терминал."
    },
    36: { // free
        en: "Importing and compiling files...",
        ru: "Импортирование и компиляция файлов..."
    },
    37: { // free
        en: "Clearing temporary files...",
        ru: "Очистка временных файлов..."
    },
    38: {
        en: "Client query unrecognized:",
        ru: "Запрос клиента не опознан:"
    },
    39: {
        en: "Please, refresh the page to apply updates.",
        ru: "Пожалуйста, обновите страницу чтобы изменения вступили в силу."
    },
    40: {
        en: "An error occurred when reading data.",
        ru: "Возникла ошибка при чтении данных."
    },
    41: {
        en: "Theme changed to %s.",
        ru: "Внешний вид терминала изменён на %s."
    },
    42: {
        en: "Unable to change theme to %s.",
        ru: "Невозможно изменить тему на %s."
    },
    43: {
        en: `Caché WEB Terminal v/* @echo package.version */\r\nAuthor:\x1B[20GZitRo ` +
        "(+NikitaSavchenko)\r\nProject:\x1B[20Ghttps://intersystems-ru.github.io/" +
        "webterminal\r\nRepository:\x1B[20Ghttps://github.com/intersystems-ru/" +
        `webterminal\r\n2013-${ new Date().getFullYear() } ©`,
        ru: `Caché WEB Terminal v/* @echo package.version */\r\nАвтор:\x1B[20GZitRo ` +
        "(+NikitaSavchenko)\r\nПроект:\x1B[20Ghttps://intersystems-ru.github.io/" +
        "webterminal\r\nРепозиторий:\x1B[20Ghttps://github.com/intersystems-ru/" +
        `webterminal\r\n2013-${ new Date().getFullYear() } ©`
    },
    44: {
        en: "Syntax highlighting enabled.",
        ru: "Подсветка синтаксиса включена."
    },
    45: {
        en: "Syntax highlighting disabled.",
        ru: "Подсветка синтаксиса выключена."
    },
    46: {
        en: "Progress indicator enabled.",
        ru: "Индикатор выполнения включён."
    },
    47: {
        en: "Progress indicator disabled.",
        ru: "Индикатор выполнения выключен."
    },
    48: {
        en: "Autocomplete enabled.",
        ru: "Автодополнение включено."
    },
    49: {
        en: "Autocomplete disabled.",
        ru: "Автодополнение выключено."
    },
    50: {
        en: "Useless :)\r\nEnable autocomplete first.",
        ru: "Бесполезно :)\r\nВключите сперва автодополнение."
    },
    51: {
        en: "Unknown option: %s.",
        ru: "Неизвестная опция: %s."
    },
    52: { // @deprecated - AC module local storage use
        en: "Loading autocomplete from local storage...",
        ru: "Загрузка автодополнения из локального хранилища..."
    },
    53: { // @deprecated - AC module local storage use
        en: "Loaded.",
        ru: "Загружено."
    },
    54: {
        en: "System %s, user %s.",
        ru: "Система %s, пользователь %s."
    },
    55: {
        en: "System %s, user %s, name: %s.",
        ru: "Система %s, пользователь %s, имя: %s."
    },
    56: {
        en: "Terminal instance name changed successfully. Please, reload the page to see" +
        " the changes.",
        ru: "Экземпляр терминала переименован успешно. Пожалуйста, обновите страницу чтобы" +
        " увидеть изменения."
    },
    "storageErr": {
        en: `Storage error: local storage is not supported by your browser. Please, consider `
        + `updating your browser.`,
        ru: `Ошибка хранилища: локальное хранилище не поддерживается браузером. Пожалуйста, `
        + `обновите ваш браузер.`
    },
    "noLocale": {
        en: `No such locale "%s".`,
        ru: `Нет локализации для "%s"`
    },
    "wsErr": {
        en: "WebSocket error: %s",
        ru: "Ошибка WebSocket: %s"
    },
    "serParseErr": {
        en: "Unable to parse server response: %s",
        ru: "Невозможно обработать ответ сервера: %s"
    },
    "reConn": {
        en: "Attempting to restore session in %n seconds..."
    },
    "seeYou": {
        en: "See you!",
        ru: "До новых встреч!"
    },
    "eInt": {
        en: "WebTerminal internal error %s",
        ru: "Внутренняя ошибка веб-терминала %s"
    },
    "noJob": {
        en: "Unable to start new Job",
        ru: "Невозможно запустить новый Job"
    },
    "wsConnLost": {
        en: "WebTerminal lost connection with server (code %n)."
    },
    "plRefPageSes": {
        en: "Please, refresh the web page to start a new session."
    },
    "noUpdUrl": {
        en: "Unable to get update URL. Please, update \x1b!URL=%s (manually)."
    },
    "updReady": {
        en: "\x1b[36mNew update is available.\x1b[0m \x1b!URL=%s (Click here) to install it now. Changelist:"
    },
    "updStart": {
        en: "Updating WebTerminal... %s -> %s"
    },
    "rSerUpd": {
        en: "Requesting server to update..."
    },
    "sUpdSt": {
        en: "Update started, please, do not close this window."
    },
    "sUpdRURL": {
        en: "Requesting %s"
    },
    "sUpdGetOK": {
        en: "Response downloaded."
    },
    "sUpdSCode": {
        en: "Unable to update WebTerminal: HTTPS request returned code %s."
    },
    "sUpdWTF": {
        en: "Writing response to a temporary file..."
    },
    "sUpdLoad": {
        en: "Importing new XML file..."
    },
    "sUpdCleanLog": {
        en: "Deleting log file %s..."
    },
    "sUpdClean": {
        en: "Deleting temporary file %s..."
    },
    "sUpdDone": {
        en: "Update completed! Please, \x1b!URL=javascript:location.reload() (reload) the page."
    },
    "askEnSpec": {
        en: "Please, enter the special command. Try entering \x1b[(special)m/help\x1b[0m first.",
        ru: "Пожалуйста, введите специальную команду. Начните с ввода \x1b[(special)m/help\x1b[0m, например."
    },
    "noSpecComm": {
        en: "There is no special command \x1b[(special)m/%s\x1b[0m. Please, enter \x1b[(special)m/help\x1b[0m to get a list of available commands.",
        ru: "Специальная команда \x1b[(special)m/%s\x1b[0m не существует. Пожалуйста, введите \x1b[(special)m/help\x1b[0m чтобы узнать список доступных команд."
    },
    "help": {
        en:
`\x1b[1mCaché WEB Terminal v\x1b[(keyword)m/* @echo package.version */\x1b[0m
\r
\r\x1B[4mAvailable commands:\x1B[0m
\r\x1B[(special)m/help\x1B[0m\x1B[32GDisplay the short documentation (like you just did).
\r\x1B[(special)m/info\x1B[0m\x1B[32GShow the information about the WebTerminal project.`,
        ru: "Помощь на русском языке временно отсутствует!"
    },
    "info": {
        en:
`Caché WEB Terminal v/* @echo package.version */
\rAuthor:\x1B[32G\x1b!URL=https://github.com/zitros (ZitRo) (Nikita Savchenko)
\rProject:\x1B[32G\x1b!URL=https://intersystems-ru.github.io/webterminal (Homepage)
\rRepository:\x1B[32G\x1b!URL=https://github.com/intersystems-ru/webterminal (GitHub)
\rBug/Feature Tracker:\x1B[32G\x1b!URL=https://github.com/intersystems-ru/webterminal/issues (GitHub)
\r2013-${ new Date().getFullYear() } ©`,
        ru:
`Caché WEB Terminal v/* @echo package.version */
\rАвтор:\x1B[32G\x1b!URL=https://github.com/zitros (ZitRo) (Никита Савченко)
\rПроект:\x1B[32G\x1b!URL=https://intersystems-ru.github.io/webterminal (Главная страница)
\rРепозиторий:\x1B[32G\x1b!URL=https://github.com/intersystems-ru/webterminal (GitHub)
\rБаг/Фич трекер:\x1B[32G\x1b!URL=https://github.com/intersystems-ru/webterminal/issues (GitHub)
\r2013-${ new Date().getFullYear() } ©`
    },
    "beforeInit": {
        en: "Terminal load complete. Getting auth key...",
        ru: "Терминал загружен. Получение ключа для авторизации..."
    },
    "unSerRes": {
        en: "Unknown server response: %s",
        ru: "Неопознанный ответ сервера: %s"
    },
    "wsRefuse": {
        en: "Server refused WebSocket connection with the next message: %s",
        ru: "Сервер отклонил соединение через WebSocket со следующим сообщением: %s"
    }
};