module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
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
            }
        },
        concat: {
            dist: {
                files: {
                    "build/webSource/js/terminal.js": ["build/webSource/js/temp/*.js"],
                    "build/webSource/css/base.css": ["webSource/css/base.css"],
                    "build/webSource/css/terminal.css": ["webSource/css/terminal*.css"]
                }
            }
        },
        uglify: {
            options: {
                wrap: "terminal"
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

    grunt.registerTask("default", ["clean:build", "copy", "preprocess",
        "concat", "uglify", "clean:tempJS"]);

};