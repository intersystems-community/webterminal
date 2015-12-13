Contributing
============

## Any fixes or propositions are welcome, just a couple of guidelines:
* Use spaces instead of tabs;
* Comment well every new contribution;
* Feel free to create a discussion or a new issue for every new contribution.

## Building tips
0. Ensure that you have NodeJS (npm as well) installed, and executed the following:
    1. `npm install` (to install all required dependencies).
1. Having changes made, export the project:
    1. Run `gulp` command to build the project;
    3. Find `build/CacheWebTerminal-v*.xml` file and import it to the studio.
2. By making changes in studio files (*.cls, *.mac) just export the code into appropriate files in repository. (insert changes by copying them into `export/template.xml` file)

## Applications Integration
If you want to integrate WebTerminal with your application, follow the next tips & tricks:
   * A `NS` parameter of GET request can set default namespace. For example, URL `../terminal/?NS=USER` will open terminal in USER namespace.
   * In order to use IFrame to insert terminal on page, you may need to add `sandbox="allow-same-origin allow-scripts"` attribute to IFrame tag to enable storage and scripts which are required.
   * To get latest version of terminal, you can parse [latestVersion](http://intersystems-ru.github.io/webterminal/latestVersion) file which is always available on WEB and then request XML to import from `http://intersystems-ru.github.io/webterminal/files/WebTerminal-<b>{FILE PART}</b>.xml`.
   * Web Terminal is able to auto-update itself, just execute `/update` command in the terminal.