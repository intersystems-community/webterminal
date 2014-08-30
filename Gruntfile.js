module.exports = function(grunt) {

    var fs = require("fs"),
        exportData = {};

    if (grunt["cli"].tasks[0] === "export") {
        exportData = {
            BASE_CSS: fs.readFileSync("build/webSource/css/base.css"),
            TERMINAL_CSS: fs.readFileSync("build/webSource/css/terminal.css"),
            THEME_CACHE_CSS: fs.readFileSync("build/webSource/css/terminal-theme-cache.css"),
            FAVICON_ICO: fs.readFileSync("build/webSource/favicon.ico").toString("base64"),
            INDEX_CSP: fs.readFileSync("build/webSource/index.html").toString("utf-8")
                .replace("é", "&eacute;")
                .replace("createTerminal(", "createTerminal('#(%session.CSPSessionCookie)#'"),
            TERMINAL_JS: fs.readFileSync("build/webSource/js/terminal.js").toString("utf-8")
                .replace(/[\x1B]/g, function(s) { return "\\x" + s.charCodeAt(0).toString(16) })
        };
    }

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        EXPORT: exportData,
        clean: {
            build: {
                src: [ "build" ]
            },
            tempJS: {
                src: [ "build/webSource/js/temp" ]
            }
        },
        copy: {
            main: {
                files: [
                    {
                        expand: true,
                        src: ["webSource/*"],
                        dest: "build/",
                        filter: "isFile"
                    },
                    {
                        expand: true,
                        cwd: "webSource/js/",
                        src: ["*.js"],
                        dest: "build/webSource/js/temp/",
                        filter: "isFile"
                    }
                ]
            },
            cache: {
                files: [
                    {
                        expand: true,
                        cwd: "classes/",
                        src: ["*.cls"],
                        dest: "build/classes/",
                        filter: "isFile"
                    },
                    {
                        expand: true,
                        cwd: "programs/",
                        src: ["*"],
                        dest: "build/programs/",
                        filter: "isFile"
                    }
                ]
            }
        },
        preprocess: {
            context: {
                VERSION: "<%= pkg.version %>",
                RELEASE_NUMBER: "<%= pkg.releaseNumber %>"
            },
            html: {
                src: "build/webSource/index.html",
                dest: "build/webSource/index.html"
            },
            js: {
                src: "build/webSource/js/temp/*.js",
                options: {
                    inline : true,
                    context: {
                        VERSION: "\"<%= pkg.version %>\"",
                        RELEASE_NUMBER: "<%= pkg.releaseNumber %>"
                    }
                }
            },
            xml: {
                src: "export/exportTemplate.xml",
                dest: "build/CWTWebSource.xml",
                options: {
                    context: {
                        BASE_CSS: "<%= EXPORT.BASE_CSS %>",
                        TERMINAL_CSS: "<%= EXPORT.TERMINAL_CSS %>",
                        THEME_CACHE_CSS: "<%= EXPORT.THEME_CACHE_CSS %>",
                        FAVICON_ICO: "<%= EXPORT.FAVICON_ICO %>",
                        INDEX_CSP: "<%= EXPORT.INDEX_CSP %>",
                        TERMINAL_JS: "<%= EXPORT.TERMINAL_JS %>"
                    }
                }
            }
        },
        concat: {
            dist: {
                files: {
                    "build/webSource/js/terminal.js": ["build/webSource/js/temp/*.js"],
                    "build/webSource/css/base.css": ["webSource/css/base.css"],
                    "build/webSource/css/terminal.css": [
                        "webSource/css/terminal.css",
                        "webSource/css/terminal-extra.css",
                        "webSource/css/terminal-graphic.css"
                    ],
                    "build/webSource/css/terminal-theme-cache.css": [
                        "webSource/css/terminal-theme-cache.css"
                    ]
                }
            }
        },
        uglify: {
            options: {
                wrap: "terminal",
                onlyASCII: true,
                maxLineLen: 30000,
                ASCIIOnly: true,
                beautify: true
            },
            dist: {
                files: {
                    "build/webSource/js/terminal.js": ["build/webSource/js/terminal.js"]
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-preprocess");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-copy");

    grunt.registerTask("default", ["clean:build", "copy", "preprocess:html", "preprocess:js",
        "concat", "uglify", "clean:tempJS"]);

    grunt.registerTask("export", ["preprocess:xml"]);

};