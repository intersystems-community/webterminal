# Caché Web Terminal
Web-based Caché terminal for InterSystems products. Access your database from everywhere!

+ Visit the [project's page](http://intersystems-ru.github.io/webterminal) for more details. 
+ **Download** the latest version from [here](http://intersystems-ru.github.io/webterminal/#downloads).
+ Read more and discuss WebTerminal on [InterSystems Developer Community](https://community.intersystems.com/post/cach%C3%A9-webterminal-v4-release).
+ Read [complete documentation](http://intersystems-ru.github.io/webterminal/#docs) about WebTerminal.

### Preview

Syntax highlighting & intelligent autocomplete!

![2016-09-18_212035](https://cloud.githubusercontent.com/assets/4989256/18618027/33a4b544-7de6-11e6-9bf5-a535a2dc4bca.png)

Embedded SQL mode!

![2016-09-18_212244](https://cloud.githubusercontent.com/assets/4989256/18618029/33a7183e-7de6-11e6-9a98-cceacca7b078.png)

Even more features!

![2016-09-18_212325](https://cloud.githubusercontent.com/assets/4989256/18618028/33a4c246-7de6-11e6-9ee9-4970223b0b31.png)

### Key Features
<table>
	<tr>
		<td class="info">Native browser application</td>
		<td>Allows to access Caché terminal both from desktop and mobile devices.</td>
	</tr>
	<tr>
		<td class="info">Autocompletion</td>
		<td>Type faster. Autocomplete is available for class names, variable and global names, methods, properties, etc.</td>
	</tr>
	<tr>
		<td class="info">Tracing</td>
		<td>Monitor any changes in globals or files.</td>
	</tr>
	<tr>
		<td class="info">SQL mode</td>
		<td>A convenient way to execute SQL queries.</td>
	</tr>
	<tr>
		<td class="info">Syntax highlighting</td>
		<td>Intelligently highlighted input both for COS and SQL.</td>
	</tr>
	<tr>
		<td class="info">Favorites</td>
		<td>Save commands you execute frequently.</td>
	</tr>
	<tr>
		<td class="info">Security</td>
		<td>All you need is to protect /terminal/ web application, and all sessions are guaranteed to be secure.</td>
	</tr>
	<tr>
		<td class="info">Self-updating</td>
		<td>WebTerminal of version 4 and higher prompts to update automatically when new version is available, so you will never miss the important update.</td>
	</tr>
	<tr>
		<td class="info">Explore!</td>
		<td>Enjoy using WebTerminal!</td>
	</tr>
</table>

Installation
------------

Download the latest version from the <a href="http://intersystems-ru.github.io/webterminal/#downloads">project page</a> and import downloaded XML file into any namespace. Compile imported items and the WebTerminal is ready!

Usage
-----

After installation, you will be able to access application at `http://[host]:[port]/terminal/` (slash at the end is required).
Type `/help` there to get more information.

Integration and WebTerminal's API
---------------------------------

To embed WebTerminal to any other web application, you can use `<iframe>` tag. Example:

```html
<iframe id="terminal" src="http://127.0.0.1:57772/terminal/?ns=SAMPLES&clean=1"></iframe>
```

Note that terminal URL may include optional GET parameters, which are the next:

+ `ns=USER` Namespace to open terminal in. If the logged user has no access to this namespace,
the error message will appear and no namespace changes will occur.
+ `clean` Start the WebTerminal without any additional information printed. It is not recommended to
use this option if you are using terminal as a stand-alone tool (for everyday use), as you can miss
important updates.

To use WebTerminal's API, you need to get WebTerminal instance first. Use iframe's
`onTerminalInit` function to get it.

```js
document.querySelector("#terminal").contentWindow.onTerminalInit(function (terminal) {
    // now work with terminal object here!
});
```

This function is triggered after WebTerminal establish an authorized connection.  
The next table demonstrates available API. Left column are `terminal` object properties.

<table>
	<tr>
		<td>Function</td>
		<td>Description</td>
	</tr>
	<tr>
        <td>execute(<b>command</b>, [<b>options</b>], [<b>callback</b>])</td>
        <td>
            Executes the COS <b>command</b> right as if it is entered
            to the terminal. However, <b>options</b> provide an
            additional flags setup.<br/>
            <b>options.echo</b> (<b>false</b> by default) - prints the
            <b>command</b> on the screen.<br/>
            <b>options.prompt</b> (<b>false</b> by default) - prompts
            the user after execution (prints "NAMESPACE > " as well). If <b>callback</b> is passed, 
            the output buffer will come as a first argument of the <b>callback</b> function.
        </td>
    </tr>
    <tr>
            <td>onOutput([<b>options</b>], <b>callback</b>)</td>
            <td>
                By default, <b>callback</b>(<u>strings</u>) will be called before the user is
                prompted for input, and <code>strings</code> array will always contain an array of 
                chunks of all the text printed between the prompts. For example, if user writes 
                <code>write 123</code> and presses "Enter", the <code>strings</code> will contain
                this array: <code>["\r\n", "123", "\r\n"]</code>. However, when user enters
                <code>write 1, 2, 3</code>, <code>strings</code> will result with 
                <code>["\r\n", "1", "2", "3", "\r\n"]</code>. You can join this array with 
                <code>join("")</code> array method to get the full output.<br/>
                Optional <code>options</code> object may include <code>stream</code> property, which
                is <code>false</code> by default. When set to <code>true</code>, <b>callback</b> 
                will be fired every time something is printed to the terminal simultaneously.
            </td>
        </tr>
	<tr>
        <td>onUserInput(<b>callback</b>)</td>
        <td>
            <b>callback</b>(<u>text</u>, <u>mode</u>) is fired right after user presses enter. 
            Argument <code>text</code> is a <code>String</code> of user input, and
            <code>mode</code> is a <code>Number</code>, which can be compared
            with one of the terminal mode constants, such as <code>MODE_PROMPT</code>.
        </td>
    </tr>
    <tr>
        <td>print(<b>text</b>)</td>
        <td>
            Prints <b>text</b> which can include special characters and
            escape sequences. This function is input-safe, and you can
            print event when terminal is requesting for input without
            disrupting input. In this case the input will reappear
            right after <b>text</b> printed. 
        </td>
    </tr>
</table>

<table>
    <tr>
		<td>Constant</td>
		<td>Description</td>
	</tr>
    <tr><td>MODE_PROMPT</td><td>Regular input (COS command)</td></tr>
    <tr><td>MODE_SQL</td><td>Input in SQL mode (SQL command)</td></tr>
    <tr><td>MODE_READ</td><td>Prompt issued by COS <code>read c</code> command</td></tr>
    <tr><td>MODE_READ_CHAR</td><td>Prompt issued by COS <code>read *c</code> command</td></tr>
    <tr><td>MODE_SPECIAL</td><td>Special CWT's input (commands like /help, /config etc)</td></tr>
</table>

The next example demonstrates a way to intercept terminal's input:

```js
let iFrame = document.querySelector("#terminal");

function myInitHandler (terminal) {
    terminal.execute("set hiddenVariable = 7", {
        echo: false // the default is false, this is just a demo
    });
    terminal.onUserInput((text, mode) => {
        if (mode !== terminal.MODE_PROMPT)
            return;
        terminal.print("\r\nYou've just entered the next command: " + text);
    });
    terminal.onOutput((chunks) => {
        // If you "write 12", chunks are ["\r\n", "12", "\r\n"].
        // If you "write 1, 2", chunks are ["\r\n", "1", "2", "\r\n"].
        if (chunks.slice(1, -1).join("") === "duck") { // if the user enters: write "duck"
            alert(`You've found a secret phrase!`);
        }
    });
}

// At first, handle iFrame load event. Note that the load handler won't work
// if this code is executed at the moment when iFrame is already initialized.
iFrame.addEventListener("load", function () {
    iFrame.contentWindow.onTerminalInit(myInitHandler); // handle terminal initialization
});
```

WebTerminal Project Development
-------------------------------

We are glad to see anyone who want to contribute to Caché Web Terminal development! Check our 
[developer's guide](http://intersystems-ru.github.io/webterminal/#docs.5).

To be short, the "hot start" is extremely easy. Having latest [Git](https://git-scm.com/) and
[NodeJS](https://nodejs.org/en/) installed (tested on NodeJS v4-8), execute the following:

```sh
git clone https://github.com/intersystems-ru/webterminal
cd webterminal # enter repository directory
import         # build & import the project. YOU NEED TO EDIT CONSTANTS IN THIS FILE FIRST
```

Now, in `build` folder you will find `WebTerminal-v*.xml` file. Every time you
changes is ready to be tested, just run `import` again. 
