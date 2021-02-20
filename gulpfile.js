const webpack = require("webpack-stream");
const gulp = require("gulp");
const zip = require("gulp-zip");
const del = require("del");
const exists = require("path-exists").sync;
const merge = require("gulp-merge-json");
const ts = require("gulp-typescript");
const webExt = require("web-ext");

const sourceDir = 'app'; //TODO: move under src or something to be consistent
const staticsDir = 'src'; //TODO: use statics or something
const jsOutDir = 'build';
const outputDir = 'dist';
const packageName = 'raccoony';

gulp.task("clean:dist", () => {
    return del([`${outputDir}/ext/`].concat(['chrome', 'firefox'].map(d => `${outputDir}/ext_${d}`)));
});

gulp.task("clean:source", () => {
    return del([jsOutDir])
});

gulp.task("clean", gulp.parallel("clean:source", "clean:dist"));

gulp.task("copy_ext", gulp.series(() => {
    // TODO: figure out how to get the typings to work when including browser-polyfill as a module
    // TODO: upgrade browser-polyfill and web-ext-typings
    return gulp.src([`${staticsDir}/**`, "node_modules/webextension-polyfill/dist/browser-polyfill.js"])
        .pipe(gulp.dest(`${outputDir}/ext/`));
}));

gulp.task("typescript:compile", () => {
    // TODO: figure out how to get source maps to work
    // https://github.com/ivogabe/gulp-typescript
    var failed = false;
    var tsProject = ts.createProject('tsconfig.json');
    var tsResult = gulp.src([`${sourceDir}/**/*.ts`, `${sourceDir}/**/*.tsx`])
        .pipe(tsProject())
        .on("error", function () { failed = true; })
        .on("finish", function () { failed && process.exit(1); });

    return tsResult.js.pipe(gulp.dest(`${jsOutDir}/`));
});

function createBundleJsFile(filename) {
    return gulp.src([`${jsOutDir}/${filename}`])
        .pipe(webpack({
            // Both "production" and "development" versions of webpack's output significantly modify the JS source. 
            // The "none" output is most like the original JS.
            "mode": "none",
            "output": { filename },
        }))
        .pipe(gulp.dest(`${outputDir}/ext/`));
}

gulp.task("pack_ext:inject", () => createBundleJsFile("page_inject.js"));
gulp.task("pack_ext:background", () => createBundleJsFile("background.js"));
gulp.task("pack_ext:options", () => createBundleJsFile("options.js"));
gulp.task("pack_ext:context_inject", () => createBundleJsFile("contextMenuInject.js"));
gulp.task("pack_ext", gulp.parallel("pack_ext:inject", "pack_ext:background", "pack_ext:options", "pack_ext:context_inject"));

function createTasksForPlatform(platform) {
    const platformDir = `ext_${platform}`;
    gulp.task(`pack_manifest:${platform}`, () => {
        return gulp.src(["manifest/manifest.json", `manifest/${platform}.json`])
            .pipe(merge({
                "fileName": "manifest.json"
            }))
            .pipe(gulp.dest(`${outputDir}/${platformDir}/`));
    });

    gulp.task(`copy_final:${platform}`, () => {
        return gulp.src(`${outputDir}/ext/**`)
            .pipe(gulp.dest(`${outputDir}/${platformDir}/`));
    });

    gulp.task(`zip_ext:${platform}`, () => {
        return gulp.src(`${outputDir}/${platformDir}/**`)
            .pipe(zip(`${packageName}_${platform}.zip`))
            .pipe(gulp.dest(outputDir));
    });

    gulp.task(`build:${platform}`, gulp.series(
        `copy_final:${platform}`, 
        `pack_manifest:${platform}`,
        `zip_ext:${platform}`
    ));
}

createTasksForPlatform("chrome");
createTasksForPlatform("firefox");

gulp.task("build:package", gulp.series("typescript:compile", 'copy_ext', 'pack_ext'))

gulp.task("build:allplatforms", gulp.parallel("build:chrome", "build:firefox"));

gulp.task("build", gulp.series(
    "clean", 
    "build:package",
    "build:allplatforms"
));

gulp.task("sign:firefox", () => {
    return webExt.cmd.sign(
        {
            sourceDir: `${outputDir}/ext_firefox`,
            artifactsDir: `${outputDir}`,
            apiKey: process.env.AMO_USER,
            apiSecret: process.env.AMO_SECRET,
        },
        {
            shouldExitProgram: false
        })
        .then((extensionRunner) => {
            console.log(extensionRunner);
        }).catch((error) => {
            throw error;
        });
});

gulp.task("sign", gulp.series("build", "sign:firefox"));

// TODO: add a task for calling web-ext run

// Default task

gulp.task("default", gulp.series("build"));

