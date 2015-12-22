# Caché Web Terminal
Web-based terminal application for InterSystems Caché database. Access your database from everywhere!

Visit [project page](http://intersystems-ru.github.io/webterminal) for more details.

### Installation
Download the latest version from <a href="http://intersystems-ru.github.io/webterminal/#downloads">project page</a>
and import XML file into %SYS namespace. Later you can update application only by typing `/update` command.

### Usage
After installation, you will be able to access application at `http://[host]:[port]/terminal/` (slash at the end is required).
Type `/help` there to get more information.

### Features
<table>
	<tr>
		<td class="info">Native browser application</td>
		<td>This allows to access terminal both from desktop or mobile devices. No Telnet, only HTTP and WebSocket.</td>
	</tr>
	<tr>
		<td class="info">Autocompletion</td>
		<td>Enables you to complete your input faster. Except keywords, autocomplete also available for classes, properties and globals.</td>
	</tr>
	<tr>
		<td class="info">Tracing</td>
		<td>Monitor any changes in globals or files.</td>
	</tr>
	<tr>
		<td class="info">SQL mode</td>
		<td>Execute SQL queries simply by switching to SQL mode.</td>
	</tr>
	<tr>
		<td class="info">Syntax highlighting</td>
		<td>Visually attractive highlighted input.</td>
	</tr>
	<tr>
		<td class="info">Appearance</td>
		<td>Change the appearance of web-terminal or even code you own.</td>
	</tr>
	<tr>
		<td class="info">Favorites</td>
		<td>Remember your best commands for later execution.</td>
	</tr>
	<tr>
		<td class="info">Definitions</td>
		<td>Define any piece of code as short expression and make your administering experience faster.</td>
	</tr>
	<tr>
		<td class="info">Security</td>
		<td>Access to WebSocket is granted only if client will pass a session key given by csp page.</td>
	</tr>
	<tr>
		<td class="info">Self-update</td>
		<td>Terminal v3.1.4 can be automatically updated by `/update` command.</td>
	</tr>
	<tr>
		<td class="info">Explore!</td>
		<td>Hope you will find this useful.</td>
	</tr>
</table>

### Development
We are glad to see anyone who want to contribute to Caché WEB Terminal development! Check the 
[developer's](https://github.com/intersystems-ru/webterminal/blob/master/DEVELOPMENT.md) guide.

In short, the "hot start" is extremely easy. Having latest [Git](https://git-scm.com/) and [NodeJS](https://nodejs.org/en/) installed,
execute the following:

```sh
git clone <this repository URL>  # clone this repository into new directory
cd <cloned repository name>      # enter just created directory
npm install -g gulp              # install the global module "gulp" to build the project
npm install                      # install all project's dependencies
gulp                             # build the project
```

Now, in `build` folder you will find `CacheWebTerminal-v*.xml` file ready to import. Every time you
changes is ready to be tested, just run `gulp` command and import generated XML into Caché. 
