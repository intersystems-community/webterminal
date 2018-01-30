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
        en: "Attempting to restore session in %n seconds...",
        ru: "Попытка восстановления сессии через %n секунд..."
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
        en: "WebTerminal lost connection with server (code %n%s).",
        ru: "Веб-терминал потерял соединение с сервером (код %n%s)"
    },
    "plRefPageSes": {
        en: "Please, refresh the web page to start a new session.",
        ru: "Пожалуйста, обновите страницу чтобы начать новую сессию."
    },
    "noUpdUrl": {
        en: "Unable to get update URL. Please, update \x1b!URL=%s (manually).",
        ru: "Не получается получить URL обновления. Пожалуйста, выполните обновление \x1b!URL=%s (вручную)."
    },
    "updReady": {
        en: "\x1b[36mNew update is available.\x1b[0m \x1b!URL=%s (Click here) to install it now. Changelist:",
        ru: "\x1b[36mДоступно обновление.\x1b[0m \x1b!URL=%s (Нажмите тут) чтобы установить его сейчас. Список изменений:"
    },
    "updStart": {
        en: "Updating WebTerminal... %s -> %s",
        ru: "WebTerminal обновляется... %s -> %s"
    },
    "rSerUpd": {
        en: "Requesting server to update...",
        ru: "Просим сервер обновиться..."
    },
    "sUpdSt": {
        en: "Update started, please, \x1b[4mdo not close this window\x1b[0m.",
        ru: "Обновление началось, пожалуйста, \x1b[4mне закрывайте это окно.\x1b[0m"
    },
    "sUpdRURL": {
        en: "Requesting %s",
        ru: "Запрашиваем %s"
    },
    "sUpdGetOK": {
        en: "Response downloaded.",
        ru: "Ответ загружен."
    },
    "sUpdSCode": {
        en: "Unable to update WebTerminal: HTTPS request ended with the code %s.",
        ru: "Невозможно обновить веб-терминал: HTTPS-запрос завершился с кодом %s."
    },
    "sUpdWTF": {
        en: "Writing WebTerminal's new version a temporary file...",
        ru: "Записываем новую версию веб-терминала во временный файл..."
    },
    "sUpdErr": {
        en: "Update \x1b[31mfailed\x1b[0m! Error: %s",
        ru: "Обновление \x1b[31mне получилось\x1b[0m! Ошибка: %s"
    },
    "sUpdRes": {
        en: "Update failed. Possibly, the new WebTerminal version is not compatible with your "
            + "system anymore, or the update was not tested for this system. Please report this "
            + "issue \x1b!URL=https://github.com/intersystems-community/webterminal/issues (here) and "
            + "attach the update log. You can try waiting some time (finite or infinite) until this"
            + " problem is identified and fixed.",
        ru: `Обновление не удалось. Возможно, новая версия веб-терминала больше не совместима `
            + `с вашей системой, или обновление не было протестировано для неё. Пожалуйста, обратитесь в `
            + `\x1b!URL=https://github.com/intersystems-community/webterminal/issues (поддержку) с `
            + `вопросом, прикрепив лог обновления или подождите некоторое количество времени `
            + `(конечное или бесконечное), пока проблема не будет выявлена и исправлена.`
    },
    "sUpdBack": {
        en: "Backing up current version to %s...",
        ru: "Сохраняем резервную копию текущей версии в %s..."
    },
    "sUpdRemLoad": {
        en: "Deleting old version and importing a new one...",
        ru: "Удаляем прошлую версию и импортируем новую..."
    },
    "sUpdNoFile": {
        en: "No file %s",
        ru: "Нет файла %s"
    },
    "sUpdCleanLog": {
        en: "Deleting log file %s...",
        ru: "Удаляем файл с логами %s..."
    },
    "sUpdClean": {
        en: "Deleting temporary file %s...",
        ru: "Удаляем временный файл %s..."
    },
    "sUpdDone": {
        en: "Update completed! Please, \x1b!URL=javascript:location.reload() (reload) the page.",
        ru: "Обновление завершено! Пожалуйста, \x1b!URL=javascript:location.reload() (обновите) страницу."
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
`\x1b[1mCaché WEB Terminal \x1b[(keyword)mv/* @echo package.version */\x1b[0m
\r
\r\x1B[4mAvailable commands:\x1B[0m
\r\x1B[(special)m/help\x1B[0m\x1B[20GDisplay the short documentation (like you just did).
\r\x1B[(special)m/clear\x1B[0m\x1B[20GClears the screen and all the history.
\r\x1B[(special)m/config\x1B[0m ...\x1B[20GAllows you to configure WebTerminal's behavior. Enter this command to get more information.
\r\x1B[(special)m/favorite\x1B[0m ...\x1B[20GAllows you to save or restore any frequently used commands. Enter this command to get more information.
\r\x1B[(special)m/info\x1B[0m\x1B[20GShow the information about the WebTerminal project.
\r\x1B[(special)m/logout\x1B[0m\x1B[20GLog out the current WebTerminal user and prompt for the authentication again.
\r\x1B[(special)m/sql\x1B[0m\x1B[20GSwitches terminal to SQL mode. Type SQL commands instead of COS. To exit SQL mode, enter this command again.
\r\x1B[(special)m/trace\x1B[0m ...\x1B[20GEnables global/file tracing. Type this command to get more information.
\r\x1B[(special)m/update\x1B[0m\x1B[20GChecks for available updates.
\r
\r\x1b[4mKeys:\x1b[0m
\r\x1B[(special)mCtrl + C\x1B[0m\x1B[20GInterrupt the command execution.
\r\x1B[(special)mTAB\x1B[0m\x1B[20GComplete the input with proposed autocomplete variant.
\r\x1B[(special)mRight/left CTRL\x1B[0m\x1B[20GSwitch autocomplete variant when multiple are available.
\r
\rPress \x1B!URL=http://intersystems-community.github.io/webterminal/#docs (here) to see the full documentation.`,
        ru: `\x1b[1mCaché WEB Terminal \x1b[(keyword)mv/* @echo package.version */\x1b[0m
\r
\r\x1B[4mДоступные команды:\x1B[0m
\r\x1B[(special)m/help\x1B[0m\x1B[20GОтобразить короткую документацию (как вы только что сделали).
\r\x1B[(special)m/clear\x1B[0m\x1B[20GПолностью очищает экран и его историю.
\r\x1B[(special)m/config\x1B[0m ...\x1B[20GПозволяет настраивать поведение веб-терминала. Введите эту команду, чтобы получить больше информации.
\r\x1B[(special)m/favorite\x1B[0m ...\x1B[20GПозволяет сохранять и загружать любые часто используемые команды. Введите эту команду, чтобы получить больше информации.
\r\x1B[(special)m/info\x1B[0m\x1B[20GПоказать информацию про проект веб-терминала.
\r\x1B[(special)m/logout\x1B[0m\x1B[20GВыйти из текущего сеанса и снова пройти аутентификацию.
\r\x1B[(special)m/sql\x1B[0m\x1B[20GПереключить терминал в режим SQL. Далее вводите SQL команды вместо COS. Чтобы выйти из режима SQL, введите эту команду ещё раз.
\r\x1B[(special)m/trace\x1B[0m ...\x1B[20GВключает трассировку глобала/файла. Введите эту команду, чтобы получить больше информации.
\r\x1B[(special)m/update\x1B[0m\x1B[20GПроверяет наличие обновлений.
\r
\r\x1b[4mКлавиши:\x1b[0m
\r\x1B[(special)mCtrl + C\x1B[0m\x1B[20GПрервать выполнение команды.
\r\x1B[(special)mTAB\x1B[0m\x1B[20GЗавершить ввод предложенным вариантом.
\r\x1B[(special)mПравый/левый CTRL\x1B[0m\x1B[20GПереключить вариант автодополнения, когда их доступно несколько.
\r
\rНажмите \x1B!URL=http://intersystems-community.github.io/webterminal/#docs (здесь) чтобы ознакомиться с полной документацией.`
    },
    "info": {
        en:
`Caché WEB Terminal v/* @echo package.version */
\rAuthor:\x1B[32G\x1b!URL=https://github.com/zitros (Nikita Savchenko) (ZitRo)
\rProject:\x1B[32G\x1b!URL=https://intersystems-community.github.io/webterminal (Homepage)
\rDocumentation:\x1B[32G\x1B!URL=http://intersystems-community.github.io/webterminal/#docs (On the project's homepage)
\rRepository:\x1B[32G\x1b!URL=https://github.com/intersystems-community/webterminal (GitHub)
\rBug/Feature Tracker:\x1B[32G\x1b!URL=https://github.com/intersystems-community/webterminal/issues (GitHub)
\r2013-${ new Date().getFullYear() } © Nikita Savchenko`,
        ru:
`Caché WEB Terminal v/* @echo package.version */
\rАвтор:\x1B[32G\x1b!URL=https://github.com/zitros (Никита Савченко) (ZitRo)
\rПроект:\x1B[32G\x1b!URL=https://intersystems-community.github.io/webterminal (Страница проекта)
\rДокументация:\x1B[32G\x1B!URL=http://intersystems-community.github.io/webterminal/#docs (На странице проекта)
\rРепозиторий:\x1B[32G\x1b!URL=https://github.com/intersystems-community/webterminal (GitHub)
\rБаг/Фич трекер:\x1B[32G\x1b!URL=https://github.com/intersystems-community/webterminal/issues (GitHub)
\r2013-${ new Date().getFullYear() } © Никита Савченко`
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
    },
    "wsReadErr": {
        en: "WebSocket read error",
        ru: "Ошибка WebSocket при чтении"
    },
    "wsParseErr": {
        en: "WebSocket message parse error",
        ru: "Ошбика десереализации WebSocket-фрейма"
    },
    "wsAbnormal": {
        en: "WebSocket abnormal exit occurred",
        ru: "Произошло нетрадиционное закрытие WebSocket-соединения"
    },
    "availConfLoc": {
        en: "WebTerminal's local configuration (persists in the browser):",
        ru: "Локальная конфигурация веб-терминала (хранится в браузере):"
    },
    "availConfGlob": {
        en: "WebTerminal's global configuration (persists on the server):",
        ru: "Глобальная конфигурация веб-терминала (хранится на сервере):"
    },
    "confHintSet": {
        en: "To change any option, enter \x1b[(special)m/config\x1b[0m \x1b[(variable)mkey\x1b" +
            "[0m = \x1b[(constant)mvalue\x1b[0m. Enter \x1b[(special)m/config\x1b[0m \x1b[(global)mdefault\x1b[0m to reset \x1b[4mlocal\x1b[0m configuration.",
        ru: "Чтобы изменить опцию, введите \x1b[(special)m/config\x1b[0m \x1b[(variable)mключ\x1b" +
        "[0m = \x1b[(constant)mзначение\x1b[0m. Введите \x1b[(special)m/config\x1b[0m \x1b[(global)mdefault\x1b[0m чтобы сбросить \x1b[4mлокальную\x1b[0m конфигурацию."
    },
    "confNoKey": {
        en: "No option \x1b[(variable)m%s\x1b[0m.",
        ru: "Нет опции \x1b[(variable)m%s\x1b[0m."
    },
    "confInvVal": {
        en: "Invalid value for \x1b[(variable)m%s\x1b[0m. Only the next values available: %s",
        ru: "Недопустимое значение для \x1b[(variable)m%s\x1b[0m. Допустимы только следующие значения: %s"
    },
    "firstLaunchMessage": {
        en: "Welcome to WebTerminal! Type \x1b[(special)m/help\x1b[0m special command to see how to use all the features.",
        ru: "Добро пожаловать в веб-терминал! Введите специальную команду \x1b[(special)m/help\x1b[0m чтобы узнать обо всех его особенностях."
    },
    "badSQL": {
        en: "Mistake in SQL statement, %s",
        ru: "Ошибка в SQL-запросе, %s"
    },
    "sqlMaxRows": {
        en: "The maximum number of rows displayed is %s. Adjust the limit by typing <span class='m special'>/config</span> <span class='m variable'>sqlMaxResults</span> = <span class='m constant'>100500</span> if you need more.",
        ru: "Выведено максимум %s результатов. Если необходимо отображать больше результатов, вы можете изменить этот лимит, набрав <span class='m special'>/config</span> <span class='m variable'>sqlMaxResults</span> = <span class='m constant'>100500</span>."
    },
    "sqlNoData": {
        en: "Nothing to display",
        ru: "Тут ничего нет"
    },
    "tracingUsage": {
        en: "To watch for changes in file, enter \x1b[(special)m/trace\x1b[0m \x1b[(string)m/path/to/file\x1b[0m.\r\n"
            + "For changes in global dimentions use \x1b[(special)m/trace\x1b[0m \x1b[(global)m^globalName\x1b[0m.\r\n"
            + "To stop watching for changes, enter \x1b[(special)m/trace\x1b[0m \x1b[(global)mstop\x1b[0m.",
        ru: "Чтобы следить за изменениями в файле, введите \x1b[(special)m/trace\x1b[0m \x1b[(string)m/path/to/file\x1b[0m.\r\n"
            + "Для наблюдения за измерениями глобалов используйте \x1b[(special)m/trace\x1b[0m \x1b[(global)m^globalName\x1b[0m.\r\n"
            + "Чтобы остановить наблюдение, введите \x1b[(special)m/trace\x1b[0m \x1b[(global)mstop\x1b[0m."
    },
    "traceStopOK": {
        en: "Tracing stopped.",
        ru: "Все наблюдения остановлены."
    },
    "traceStopNotOK": {
        en: "Nothing is being traced.",
        ru: "Нет активных наблюдений."
    },
    "traceBad": {
        en: "Unable to trace %s.",
        ru: "Невозможно трассировать %s."
    },
    "traceStart": {
        en: "Starting tracing %s.",
        ru: "Начинаем наблюдать за %s."
    },
    "traceStop": {
        en: "Stopping tracing %s.",
        ru: "Завершаем наблюдать за %s."
    },
    "traceSight": {
        en: "Currently tracing %s.",
        ru: "На данный момент наблюдаем за %s."
    },
    "favDesc": {
        en: "To save the command, enter \x1b[(special)m/favorite\x1b[0m \x1b[(constant)mname\x1b[0m \x1b[(keyword)mdo\x1b[0m \x1b[(string)many COS code\x1b[0m."
            + "\r\nTo load the command, enter \x1b[(special)m/favorite\x1b[0m \x1b[(constant)mname\x1b[0m."
            + "\r\nTo delete saved commands, use \x1b[(special)m/favorite\x1b[0m \x1b[(wrong)mdelete\x1b[0m \x1b[(constant)mname\x1b[0m."
            + "\r\nTo delete all saved commands, use just \x1b[(special)m/favorite\x1b[0m \x1b[(wrong)mdelete\x1b[0m.",
        ru: "Для того чтобы запомнить команду, введите \x1b[(special)m/favorite\x1b[0m \x1b[(constant)mимя\x1b[0m \x1b[(keyword)mdo\x1b[0m \x1b[(string)mлюбой COS код\x1b[0m."
            + "\r\nДля того чтобы загрузить команду, введите \x1b[(special)m/favorite\x1b[0m \x1b[(constant)mимя\x1b[0m."
            + "\r\nЧтобы удалять сохранённые команды, используйте \x1b[(special)m/favorite\x1b[0m \x1b[(wrong)mdelete\x1b[0m \x1b[(constant)mимя\x1b[0m."
            + "\r\nЧтобы удалить все команды, введите \x1b[(special)m/favorite\x1b[0m \x1b[(wrong)mdelete\x1b[0m.",
    },
    "favs": {
        en: "Saved commands:",
        ru: "Сохранённые команды:"
    },
    "favSet": {
        en: "Command \x1b[(constant)m%s\x1b[0m saved.",
        ru: "Команда \x1b[(constant)m%s\x1b[0m сохранена."
    },
    "favDelOK": {
        en: "Command \x1b[(constant)m%s\x1b[0m deleted.",
        ru: "Комманда \x1b[(constant)m%s\x1b[0m удалена."
    },
    "favDelNotOK": {
        en: "No \x1b[(constant)m%s\x1b[0m command.",
        ru: "Комманда \x1b[(constant)m%s\x1b[0m не была задана."
    },
    "favDel": {
        en: "All commands are deleted.",
        ru: "Все команды удалены."
    },
    "favKey": {
        en: "Name",
        ru: "Имя"
    },
    "favVal": {
        en: "Value",
        ru: "Значение"
    },
    "noFav": {
        en: "Command \x1b[(constant)m%s\x1b[0m has never been saved.",
        ru: "Команда \x1b[(constant)m%s\x1b[0m не была сохранена ранее."
    },
    "jsErr": {
        en: "JavaScript error occurred: %s",
        ru: "Произошла ошибка JavaScript: %s"
    },
    "wsNormalClose": {
        en: "Session ended.",
        ru: "Сессия закончена."
    },
    "logOut": {
        en: "Logging out...",
        ru: "Выходим..."
    },
    "unLogOut": {
        en: "Your browser is too old or too weird to support log out functionality. Please, restart the browser manually.",
        ru: "Ваш браузер слишком странный или старый, и он не поддерживает функциональность выхода. Пожалуйста, перезапустите браузер вручную."
    },
    "unNS": {
        en: "Unable to change namespace to %s.",
        ru: "Не получается поменять область на %s."
    },
    "cpTerm": {
        en: "Terminal process was terminated.",
        ru: "Процесс терминала был завершён."
    }
};
