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
    buildTo = "build";

var themes = [],
    extra = {
        themes: ""
    };

function readyToExport () { // triggered when build is done
    themes = fs.readdirSync("./" + buildTo + "/web/css/terminal-theme");
    extra.themes = themes.map(function (n) {
        return ', "' + n.replace(/\..*$/, "") + '": "css/terminal-theme/' + n + '"';
    }).join("")
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

gulp.task("copy-export", ["clean"], function () {
    return gulp.src(["./export/*.*", "!./export/template.xml"])
        .pipe(gulp.dest("./" + buildTo + "/etc"));
});

gulp.task("export", ["copy-html", "copy-js", "copy-css-themes", "copy-css-basic" ], function () {
    readyToExport();
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
        .pipe(rename(function (path) { path.basename = "CacheWebTerminal-v" + pkg["version"]; }))
        .pipe(gulp.dest("./" + buildTo));
});

gulp.task("default", ["export", "copy-export"]);