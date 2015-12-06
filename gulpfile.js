var gulp = require("gulp"),
    rimraf = require("gulp-rimraf"),
    replace = require("gulp-replace"),
    uglify = require("gulp-uglify"),
    concat = require("gulp-concat"),
    minifyCSS = require("gulp-minify-css"),
    htmlReplace = require("gulp-html-replace"),
    rename = require("gulp-rename"),
    fs = require("fs"),

    pkg = require("./package.json"),
    source = "webSource",
    buildTo = "build2";

var specialReplace = function () {
    return replace(/[^\s]+\/\*build\.replace:(.*)\*\//g, function (part, match) {
        var s = match.toString();
        return s.replace(/pkg\.([a-zA-Z]+)/g, function (p,a) { return pkg[a]; });
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

gulp.task("copy-js", ["clean"], function () {
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
        "./" + source + "/css/base.css",
        "./" + source + "/css/terminal.css",
        "./" + source + "/css/terminal-extra.css",
        "./" + source + "/css/terminal-graphic.css"
    ]).pipe(concat("terminal.css"))
        .pipe(minifyCSS({ keepSpecialComments: 0 }))
        .pipe(gulp.dest("./" + buildTo + "/web/css/"));
});

gulp.task("copy-css-themes", ["clean"], function () {
    return gulp.src([
        "./" + source + "/css/terminal-theme-cache.css"
    ]).pipe(minifyCSS({ keepSpecialComments: 0 }))
        .pipe(gulp.dest("./" + buildTo + "/web/css/"));
});

gulp.task("export", ["copy-html", "copy-js", "copy-css-themes", "copy-css-basic" ], function () {
    return gulp.src("export/template.xml")
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
        .pipe(rename(function (path) { path.basename = "CacheWebTerminal-v" + pkg["version"]; }))
        .pipe(gulp.dest("./" + buildTo));
});

gulp.task("default", ["export"]);