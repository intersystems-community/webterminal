import gulp from "gulp";
import pkg from "./package.json";
import htmlReplace from "gulp-html-replace";
import cssNano from "gulp-cssnano";
import concat from "gulp-concat";
import uglify from "gulp-uglify";
import replace from "gulp-replace";
import rimraf from "gulp-rimraf";
import rename from "gulp-rename";
import preprocess from "gulp-preprocess";
import fs from "fs";

let INSTALLER_CLASS_NAME = `${ pkg["packageName"] }.Installer`;

let dir = __dirname,
    dest = `${dir}/build`,
    source = `${dir}/source`,
    context = {
        context: {
            package: pkg,
            compileAfter: "", // is set during "pre-cls" task.
            themes: "" // is set after css move task
        }
    },
    themes = [];

function themesReady () { // triggered when build is done
    themes = fs.readdirSync(`${ dest }/client/css/terminal-theme`);
    context.context.themes = themes.map(function (n) {
        return ', "' + n.replace(/\..*$/, "") + '": "css/terminal-theme/' + n + '"';
    }).join("");
}

gulp.task("clean", function () {
    return gulp.src(dest, { read: false })
        .pipe(rimraf());
});

gulp.task("html", ["clean"], function () {
    return gulp.src(`${ source }/client/index.html`)
        .pipe(htmlReplace({
            "css": "css/terminal.css",
            "js": "js/terminal.js"
        }))
        .pipe(gulp.dest(`${ dest }/client`));
});

gulp.task("js", ["clean", "css"], function () {
    return gulp.src(`${ source }/client/js/**/*.js`)
        .pipe(concat("terminal.js"))
        .pipe(preprocess(context))
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
        .pipe(gulp.dest(`${ dest }/client/js`));
});

gulp.task("copy-css-basic", ["clean"], function () {
    return gulp.src(`${ source }/client/css/*.css`)
        .pipe(concat("terminal.css"))
        .pipe(cssNano())
        .pipe(gulp.dest(`${ dest }/client/css`));
});

gulp.task("copy-css-themes", ["clean"], function () {
    return gulp.src(`${ source }/client/css/terminal-theme/*.css`)
        .pipe(preprocess(context))
        .pipe(cssNano())
        .pipe(gulp.dest(`${ dest }/client/css/terminal-theme/`));
});

// Need css themes directory copied to collect themes names.
gulp.task("css", ["copy-css-basic", "copy-css-themes"], function (cb) {
    themesReady();
    cb();
});

gulp.task("pre-cls", ["js", "js", "html", "css", "readme"], () => {
    return gulp.src([`${ source }/cache/**/*.cls`])
        .pipe(rename((f) => {
            f.basename = `${ pkg["packageName"] }.${ f.dirname === "." ? "" : f.dirname + "." }${
                f.basename
            }`;
            f.dirname = ".";
            if (f.basename !== INSTALLER_CLASS_NAME)
                context.context.compileAfter +=
                    (context.context.compileAfter ? "," : "") + f.basename;
        }))
        .pipe(gulp.dest(`${dest}/cache`));
});

gulp.task("cls", ["pre-cls"], () => {
    return gulp.src([`${dest}/cache/**/*.cls`])
        .pipe(preprocess(context))
        .pipe(gulp.dest(`${dest}/cache`));
});

gulp.task("readme", ["clean"], function () {
    return gulp.src(`${ dir }/readme.md`)
        .pipe(gulp.dest(`${ dest }`));
});

gulp.task("default", ["cls"]);