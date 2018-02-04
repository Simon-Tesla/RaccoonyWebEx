const webpack = require("webpack-stream");
const gulp = require("gulp");
const zip = require("gulp-zip");
const del = require("del");
const exists = require("path-exists").sync;
const merge = require("gulp-merge-json");
const ts = require("gulp-typescript");

const outputDir = 'dist';
const packageName = 'raccoony';

gulp.task("clean", () => {
    return del([outputDir]);
});


gulp.task("copy_ext", ["clean"], () => {
    // TODO: figure out how to get the typings to work when including browser-polyfill as a module
    return gulp.src(["src/**", "node_modules/webextension-polyfill/dist/browser-polyfill.js"])
        .pipe(gulp.dest(`${outputDir}/ext/`));
});

gulp.task("typescript:compile", ["clean"], () => {
    var failed = false;
    var tsProject = ts.createProject('tsconfig.json');
    var tsResult = gulp.src(['app/**/*.ts', 'app/**/*.tsx'])
        .pipe(tsProject())
        .on("error", function () { failed = true; })
        .on("finish", function () { failed && process.exit(1); });

    return tsResult.js.pipe(gulp.dest(`app/`));
})

function autopack(filename) {
    return gulp.src([`app/${filename}`])
        .pipe(webpack({
            "output": { filename }
        }))
        .pipe(gulp.dest(`${outputDir}/ext/`));
}

gulp.task("pack_ext:inject", ["typescript:compile"], () => autopack("page_inject.js"));
gulp.task("pack_ext:background", ["typescript:compile"], () => autopack("background.js"));
//gulp.task("pack_ext:options", ["typescript:compile"], () => autopack("options.js"));
gulp.task("pack_ext", ["pack_ext:inject", "pack_ext:background" /*, "pack_ext:options"*/]);


function createTasksForPlatform(platform) {
    const platformDir = `ext_${platform}`;
    gulp.task(`pack_manifest:${platform}`, ["clean"], () => {
        return gulp.src(["manifest/manifest.json", `manifest/${platform}.json`])
            .pipe(merge({
                "fileName": "manifest.json"
            }))
            .pipe(gulp.dest(`${outputDir}/${platformDir}/`));
    });

    gulp.task(`copy_final:${platform}`, ["copy_ext", "pack_ext"], () => {
        return gulp.src(`${outputDir}/ext/**`)
            .pipe(gulp.dest(`${outputDir}/${platformDir}/`));
    });

    gulp.task(`zip_ext:${platform}`, [`copy_final:${platform}`, `pack_manifest:${platform}`], () => {
        return gulp.src(`${outputDir}/${platformDir}/**`)
            .pipe(zip(`${packageName}_${platform}.zip`))
            .pipe(gulp.dest(outputDir));
    });

    gulp.task(`build:${platform}`, [`zip_ext:${platform}`]);
}

createTasksForPlatform("chrome");
createTasksForPlatform("firefox");
gulp.task("build", ["build:chrome", "build:firefox"]);


// Default task

gulp.task("default", ["build"]);
