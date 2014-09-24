Contributing
============

## Any fixes or propositions are welcome, just a couple of guidelines:
* Use spaces instead of tabs;
* Comment well every new contribution.

## Building tips
0. Ensure that you have NodeJS (npm) installed, and executed the following:
    * <code>npm install</code> (to install all required dependencies).
1. To test your changes in sources without exporting:
    1. Comment/replace <code>$$$ISOK(..RequireAuthorization())</code> in %WebTerminal.Engine studio class;
    2. Run <code>index.html</code> file from any local server. You may also need to change the debug port 57772 in TerminalController.js. 
2. After changes tested, export the project to studio:
    1. Run <code>grunt</code> command to build the project;
    2. If there is no errors, then run <code>grunt export</code> task;
    3. Find build/CWTWebSource.xml file and import it to the studio.
3. By making changes in studio files (*.cls, *.mac) just copy source code into appropriate files in repository.
4. If you commented line as the first step says, DO NOT FORGET to uncomment it.