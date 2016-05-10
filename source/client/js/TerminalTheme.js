/**
 * Terminal themes controller.
 *
 * Any new styles can be added in the next way:
 *  1. Create CSS file in the following path: webSource/css/terminal-theme/THEME_NAME.css
 *  2. Build project and test.
 *
 * @param {Terminal} TERMINAL
 * @constructor
 */
var TerminalTheme = function (TERMINAL) {

    /**
     * @type {Terminal}
     */
    this.TERMINAL = TERMINAL;

    this.AVAILABLE_THEMES = {
        "": "", // also default - keep
        "default": "" // , "cache": "css/terminal-theme-cache.css"
        /**//*build.replace:extra.themes*/
    };

    /**
     * @type {string}
     * @private
     */
    this._CURRENT_THEME = "default";

    this.initialize();

};

TerminalTheme.prototype.STORAGE_NAME = "terminal-theme";

TerminalTheme.prototype.initialize = function () {

    var theme;

    if (theme = this.TERMINAL.storage.get(this.STORAGE_NAME)) {
        this.setTheme(theme);
    }

};

/**
 * @returns {string}
 */
TerminalTheme.prototype.getCurrentTheme = function () {

    return this._CURRENT_THEME || "default";

};

/**
 * Get list of available themes.
 *
 * @returns {String[]}
 */
TerminalTheme.prototype.getAvailableList = function () {

    var array = [],
        i;

    for (i in this.AVAILABLE_THEMES) {
        if (i) array.push(i);
    }

    return array;

};

/**
 * Set theme of the terminal.
 *
 * @param {string} themeName
 * @returns {boolean}
 */
TerminalTheme.prototype.setTheme = function (themeName) {

    var themeFile;

    if (!this.AVAILABLE_THEMES.hasOwnProperty(themeName)) return false;

    if (themeFile = this.AVAILABLE_THEMES[themeName]) {
        this.TERMINAL.elements.themeLink.setAttribute("href", themeFile);
        this._CURRENT_THEME = themeName;
        this.TERMINAL.storage.set(this.STORAGE_NAME, themeName);
    } else {
        this.TERMINAL.storage.remove(this.STORAGE_NAME);
        this._CURRENT_THEME = "default";
        this.TERMINAL.elements.themeLink.removeAttribute("href");
    }

    return true;

};