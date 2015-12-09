# Caché Web Terminal (v3.0 alpha is available)
Web-based terminal application for InterSystems Caché database. Access your database from everywhere!

Visit [project page](http://intersystems-ru.github.io/webterminal) for more details.

### Installation
Download latest version from <a href="http://intersystems-ru.github.io/webterminal/#downloads">project page</a> and import XML file into %SYS namespace. Make sure that you have enabled write access to CACHELIB database during installation process. Later you can update application by typing "/update" command.

### Usage
After installation, you will be able to access application at `http://[host]:[port]/terminal/` (slash at the end is required).
Type "/help" there to get more information.

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
		<td>Second version of terminal can be automatically updated by one command.</td>
	</tr>
	<tr>
		<td class="info">Explore!</td>
		<td>Hope you will find this useful.</td>
	</tr>
</table>
