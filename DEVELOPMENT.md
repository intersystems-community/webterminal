Contributing
============

## Any fixes or propositions are welcome, just a couple of guidelines:
* Use spaces instead of tabs;
* Comment well every new contribution.

## Building tips
0. Ensure that you have NodeJS (npm) installed, and executed the following:
    1. <code>npm install</code> (to install all required dependencies).
1. To test your changes in sources without exporting:
    1. Comment/replace <code>$$$ISOK(..RequireAuthorization())</code> in %WebTerminal.Engine studio class;
    2. Open <code>index.html</code> file from local server (execute `node localServer/run.js`). You may also need to change the debug port 57772 in TerminalController.js.
    3. OR, just build & import terminal application into Cach? each time you make change.
2. After changes tested, export the project to studio:
    1. Run <code>gulp</code> command to build the project;
    3. Find build/CacheWebTerminal-v*.xml file and import it to the studio.
3. By making changes in studio files (*.cls, *.mac) just export the code into appropriate files in repository. (insert changes by copying them into `export/template.xml` file)
4. If you commented line as the first step says, fo not forget to uncomment it.

## Applications Integration
If you want to integrate WebTerminal with your application, follow the next tips & tricks:
   * An <code>NS</code> parameter of GET request can set default namespace. For example, URL `../terminal/?NS=USER` will open terminal in USER namespace.
   * In order to use IFrame to insert terminal on page, you may need to add <code>sandbox="allow-same-origin allow-scripts"</code> attribute to IFrame tag to enable storage and scripts which are required.
   * To get latest version of terminal, you can parse [latestVersion](http://intersystems-ru.github.io/webterminal/latestVersion) file which is always available on WEB and then request XML to import from `http://intersystems-ru.github.io/webterminal/files/WebTerminal-<b>{FILE PART}</b>.xml`.
   * Web Terminal is able to auto-update itself, just execute `/update` command in the terminal.