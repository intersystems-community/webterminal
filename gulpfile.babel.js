import gulp from "gulp";
import pkg from "./package.json";
import cssNano from "gulp-cssnano";
import uglify from "gulp-uglify";
import replace from "gulp-replace";
import rimraf from "gulp-rimraf";
import scss from "gulp-sass";
import rename from "gulp-rename";
import preprocess from "gulp-preprocess";
import browserify from "browserify";
import "babelify";
import sourceStream from "vinyl-source-stream";
import buffer from "vinyl-buffer";
import fs from "fs";
import preprocessify from "preprocessify";
//import sourcemaps from "gulp-sourcemaps";
import { getAutomaton } from "./src/client/js/parser/_build";

let INSTALLER_CLASS_NAME = `${ pkg["packageName"] }.Installer`;

let dir = __dirname,
    dest = `${dir}/build`,
    source = `${dir}/src`,
    context = {
        includeBase: dest,
        context: {            
            package: pkg,
            compileAfter: "", // is set during "pre-cls" task.
            themes: "", // is set after css move task
            autocompleteAutomaton: [],
            ruleMappings: {}
        }
    },
    themes = []; // reassigned

function themesReady () { // triggered when build is done
    themes = fs.readdirSync(`${ dest }/client/css/themes`);
    context.context.themes = themes.map(function (n) {
        return ', "' + n.replace(/\..*$/, "") + '": "css/themes/' + n + '"';
    }).join("");
}

gulp.task("prepare", function (cb) {
    let aut = [];
    console.log(`Compiling autocomplete and highlight rules...`);
    try {
        aut = getAutomaton();
        context.context.autocompleteAutomaton = JSON.stringify(aut.automaton);
        context.context.ruleMappings = JSON.stringify(aut.ruleMappings);
    } catch (e) {
        console.error.apply(console, e);
        cb(e);
    }
    console.log(`Automaton ready and has ${ aut.automaton.length } states with ${
        aut.automaton.reduce((a, b) =>
             (typeof a === "number" ? a : a.length) + (typeof b === "number" ? b : b.length))
    } rules.`);
    cb();
});

gulp.task("clean", ["prepare"], function () {
    return gulp.src(dest, { read: false })
        .pipe(rimraf());
});

gulp.task("html", ["clean"], function () {
    return gulp.src(`${ source }/client/index.html`)
        .pipe(preprocess(context))
        .pipe(gulp.dest(`${ dest }/client`));
});

gulp.task("scss", ["clean"], () => {
    return gulp.src([`${source}/client/scss/index.scss`])
        .pipe(preprocess(context))
        .pipe(scss())
        .pipe(cssNano({
            zindex: false
        }))
        .pipe(gulp.dest(`${dest}/client/css`));
});

gulp.task("js", ["clean", "css"], function () {
    let bundler = browserify({
        entries: `${source}/client/js/index.js`,
        debug: true
    }).transform(preprocessify, {
        includeExtensions: ['.js'],
        context: context.context
    });
    bundler.transform("babelify", { presets: ["es2015"] });
    return bundler.bundle()
        .on("error", function (err) { console.error("An error occurred during bundling:", err); })
        .pipe(sourceStream("index.js"))
        .pipe(buffer())
        //.pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify({
            output: {
                ascii_only: true,
                width: 25000,
                max_line_len: 15000
            },
            preserveComments: "some"
        }))
        .pipe(replace(/\x0b|\x1b/g, e => `\\x${ e === "\x0b" ? 0 : 1 }b`))
        .pipe(replace(/[\x00-\x08]/g, e =>  `\\x0${ e.charCodeAt(0) }`))
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest(`${ dest }/client/js`));
});

gulp.task("copy-css-themes", ["clean"], function () {
    return gulp.src(`${ source }/client/scss/themes/*.*`)
        .pipe(preprocess(context))
        .pipe(scss())
        .pipe(cssNano())
        .pipe(gulp.dest(`${ dest }/client/css/themes/`));
});

// Need css themes directory copied to collect themes names.
gulp.task("css", ["scss", "copy-css-themes"], function (cb) {
    themesReady();
    cb();
});

gulp.task("cls", ["js", "js", "html", "css", "readme"], () => {
    return gulp.src([`${ source }/cls/**/*.cls`])
        .pipe(preprocess(context))
        .pipe(gulp.dest(`${dest}/cls`));
});

gulp.task("readme", ["clean"], function () {
    return gulp.src(`${ dir }/readme.md`)
        .pipe(gulp.dest(`${ dest }`));
});

gulp.task("default", ["cls"]);