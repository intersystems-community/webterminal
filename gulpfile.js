var gulp = require("gulp"),
    rimraf = require("gulp-rimraf"),
    replace = require("gulp-replace"),
    uglify = require("gulp-uglify"),
    concat = require("gulp-concat"),
    minifyCSS = require("gulp-minify-css"),
    htmlReplace = require("gulp-html-replace"),
    foreach = require("gulp-foreach"),
    fs = require("fs"),
    path = require("path"),

    pkg = require("./package.json"),
    source = "webSource",
    buildTo = "build";

var themes = [],
    extra = {
        themes: ""
    };

function themesReady () { // triggered when build is done
    themes = fs.readdirSync("./" + buildTo + "/web/css/terminal-theme");
    extra.themes = themes.map(function (n) {
        return ', "' + n.replace(/\..*$/, "") + '": "css/terminal-theme/' + n + '"';
    }).join("");
}

var specialReplace = function () {
    return replace(/[^\s]*\/\*build\.replace:(.*)\*\//g, function (part, match) {
        var s = match.toString();
        return s.replace(/pkg\.([a-zA-Z]+)/g, function (p,a) { return pkg[a]; })
            .replace(/extra\.([a-zA-Z]+)/g, function (p,a) { return extra[a]; });
    });
};

gulp.task("clean", function () {
    return gulp.src("./" + buildTo, { read: false })
        .pipe(rimraf());
});

gulp.task("copy-html", ["clean"], function () {
    return gulp.src("./" + source + "/index.html")
        .pipe(htmlReplace({
            "css": "css/terminal.css",
            "js": "js/terminal.js"
        }))
        .pipe(gulp.dest("./" + buildTo + "/web"));
});

gulp.task("copy-js", ["clean", "prepare-css"], function () {
    return gulp.src("./" + source + "/js/**/*.js")
        .pipe(concat("terminal.js"))
        .pipe(specialReplace())
        .pipe(uglify({
            output: {
                ascii_only: true,
                width: 25000,
                max_line_len: 25000
            },
            preserveComments: "some"
        }))
        .pipe(replace(//g, "\\x0B"))
        .pipe(replace(/\x1b/g, "\\x1B"))
        .pipe(gulp.dest("./" + buildTo + "/web/js/"));
});

gulp.task("copy-css-basic", ["clean"], function () {
    return gulp.src([
        "./" + source + "/css/*.css"
    ]).pipe(concat("terminal.css"))
        .pipe(minifyCSS({ keepSpecialComments: 0 }))
        .pipe(gulp.dest("./" + buildTo + "/web/css/"));
});

gulp.task("copy-css-themes", ["clean"], function () {
    return gulp.src([
        "./" + source + "/css/terminal-theme/*.css"
    ]).pipe(minifyCSS({ keepSpecialComments: 0 }))
        .pipe(gulp.dest("./" + buildTo + "/web/css/terminal-theme/"));
});

// Need css themes directory copied to collect themes names.
gulp.task("prepare-css", ["copy-css-basic", "copy-css-themes"], function (cb) {
    themesReady();
    cb();
});

gulp.task("copy-export", ["clean"], function () {
    return gulp.src(["./export/*.*", "!./export/template.xml", "!./export/WebTerminal/**"])
        .pipe(gulp.dest("./" + buildTo + "/etc"));
});

gulp.task("copy-readme", ["clean"], function () {
    return gulp.src("./readme.md")
        .pipe(gulp.dest("./" + buildTo));
});

gulp.task("export", [ "copy-html", "copy-js", "prepare-css", "copy-readme" ], function () {
    var projectTemplate = '<Project name="WEBTerminal" LastModified="'
        + (new Date()).toISOString().replace(/T/, " ").replace(/Z/, "") + '">\r\n'
        + '<Items>\r\n',
        files = [];
    return gulp.src("export/WebTerminal/**/*.xml")
        .pipe(foreach(function (stream, file) {
            files.push(path.relative(path.join(path.dirname(__filename), "export"), file.path)
                .replace(/[\\\/]/g, ".").replace(/\.xml$/, ""));
            return stream
                .pipe(replace(/^<\?xml[^]*?<Class/i, "<Class"))
                .pipe(replace(/<\/Export>\s*$/i, ""));
        }))
        .pipe(concat("CacheWebTerminal-v" + pkg["version"] + ".xml"))
        .pipe(specialReplace())
        .pipe(replace(
            /\{\{replace:css}}/,
            function () {
                return fs.readFileSync("./" + buildTo + "/web/css/terminal.css", "utf-8");
            }
        ))
        .pipe(replace(
            /\{\{replace:js}}/,
            function () {
                return fs.readFileSync("./" + buildTo + "/web/js/terminal.js", "utf-8");
            }
        ))
        .pipe(replace(
            /\{\{replace:html}}/,
            function () { return fs.readFileSync("./" + buildTo + "/web/index.html", "utf-8"); }
        ))
        .pipe(replace(
            /\{\{replace:themes}}([^]*)\{\{replace:end}}/g,
            function (p, content) {
                return themes.map(function (n) {
                    return content.replace("{{replace:themeName}}", n.replace(/\..*$/, ""))
                        .replace("{{replace:themeData}}", function () {
                            return fs.readFileSync(
                                "./" + buildTo + "/web/css/terminal-theme/" + n
                            );
                        });
                }).join("\n\n");
            }
        ))
        .pipe(replace(
            /^/,
            '<?xml version="1.0" encoding="UTF-8"?>\r\n<Export generator="Cache" version="25">\r\n'
        )).pipe(foreach(function (stream) {
            return stream.pipe(replace(/$/, projectTemplate + files.map(function (fileName) {
                return '<ProjectItem name="' + fileName + '" type="CLS"></ProjectItem>'
            }).join("\r\n") + '\r\n</Items>\r\n</Project>\r\n</Export>'))
        }))
        .pipe(gulp.dest("./" + buildTo));
});

gulp.task("default", ["export", "copy-export"]);