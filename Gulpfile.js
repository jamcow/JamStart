/// CONFIG
/// -------------------------------------

const gulp              = require('gulp'),

    /// Images and SVG
    concat              = require('gulp-concat'),
    svgo                = require('gulp-svgo'),
    clean               = require('gulp-clean'),
    del                 = require('del'),
    useref              = require('gulp-useref'),
    sourcemaps          = require('gulp-sourcemaps'),
    plumber             = require('gulp-plumber'),
    portfinder          = require('portfinder'),
    gulpif              = require('gulp-if'),
    size                = require('gulp-size'),

    /// Sass/CSS
    sass                = require('gulp-sass'),
    cleanCSS            = require('gulp-clean-css'),
    postcss             = require('gulp-postcss'),
        postcss_import            = require('postcss-import'),
        postcss_url               = require('postcss-url'),
        postcss_svg               = require('postcss-svg'),
        postcss_cachebuster       = require('postcss-cachebuster'),
        postcss_preset_env        = require('postcss-preset-env'),
        postcss_pseudoelements    = require('postcss-pseudoelements'),
        postcss_browser_reporter  = require('postcss-browser-reporter'),
        postcss_reporter          = require('postcss-reporter'),

    /// JS/Typescript
    typescript          = require('gulp-typescript'),
    tslint              = require('gulp-tslint'),

    doiuse              = require('doiuse'),
    argv                = require('yargs').argv,
    notify              = require('gulp-notify'),
    browserSync         = require('browser-sync').create(),
    childProcess        = require('child_process'),
    reload              = require('browser-sync').reload;

/// PATHS
/// -------------------------------------

// We can proxy any website (and manipulate CSS), or make a standalone site (HTML, images, and CSS):
//  - if we're running a proxy site, only generate CSS from Sass, by outputting /styles to /css (Gulpfile.js should be within the "assets" folder).
//  - if we're running a standlone site, everything (html, templates and styles) is in "app" folder and outputs to separate "_site"

var config = require('./config.json');
var cfg = argv.site ? config.settings_siteproxy : config.settings_jekyllsite;
var proxysite = argv.site ? `${argv.site}` : "localhost";

/// Server Port
/// -------------------------------------

// It will automatically find a free port to run from, but starting from this port number:
portfinder.basePort = 3000;

/// MAIN TASKS
/// -------------------------------------

// start it with:
// "gulp start" if you're running Jekyll
// "gulp start --site www.sitename.test" to run as a proxy
// "gulp start --site www.sitename.test --no-notify" to run as a proxy and without "Browsersync connected" popup

gulp.task('start', ['t_clear'], function () {
    if(argv.site){
        // Build Sass and browserSync as proxy, doesn't run jekyll
        gulp.start('t_styles_sass', 't_htmly', 't_typescript', 't_browserSyncProxy', 't_watch-files', 't_info');
    } else {
        // Build Sass and browserSync, includes Autoprefixes and Sourcemaps
        gulp.start('t_styles_sass', 't_typescript', 't_browserSyncJekyll', 't_watch-files', 't_watch-JekyllHtml', 't_info');
    }
});

// Uncompressed CSS-only (no site or proxy)
// "gulp sassonly --site none"
gulp.task('sassonly', ['t_clear'], function () {
    gulp.start('t_styles_only', 't_watch-files', 't_info');
});

// Compressed CSS-only (no site or proxy, no sass maps)
// "gulp production --site none"
gulp.task('production', ['t_clear'], function () {
    gulp.start('t_styles_production', 't_watch-files', 't_info');
});

/// CSS and PLUGIN OPTIONS
/// -------------------------------------

const cleancssOptionsBeautify = {
    // https://github.com/jakubpawlowicz/clean-css
    // format: 'beautify',
    level: {
        1: {
            specialComments: '1'
        },
        2: {
            all: true
        }
    }
};

const cleancssOptionsMinify = {
    // format: 'beautify',
    level: {
        1: {
            specialComments: '1'
        },
        2: {
            all: true
        }
    }
};

const sassOptions = {
    errLogToConsole: false,
    outputStyle: 'expanded',//expanded compact compressed
    // includePaths: ['css', 'scss'],
    onError: browserSync.notify
};

const csspresetenvOptions = {
    stage: 3
    // features: {
    //     'custom-properties': {
    //         preserve: true,
    //         warnings: false
    //     }
    // }
};

const plumberOptionsSass = {
    errorHandler: function (err) {
        console.log(err);
        browserSync.notify("<div style='font-family: Comic Sans MS, Comic Sans, cursive;font-size: 22px;margin-bottom: 10px;'><img src='" + img1 + "' style='vertical-align:text-bottom;'' /> There's an <span style='color: hotpink'>error </span> with your Sass...</div>More details in your console <br><br><pre style='font-size: 15px;text-align: left;'>" + err.message + "</pre>", 6000);
        this.emit('end');
    }
};

const plumberOptionsJS = {
    errorHandler: function (err) {
        console.log(err);
        browserSync.notify("<div style='font-family: Comic Sans MS, Comic Sans, cursive;font-size: 22px;margin-bottom: 10px;'>There's an <span style='color: hotpink'>Typescript/JS error </span>...</div><br><br><pre style='font-size: 15px;text-align: left;'>" + err.message + "</pre>", 4000);
        this.emit('end');
    }
};

/// TASKS
/// -------------------------------------

gulp.task('t_info', function () {
    console.log('############################################');
    console.log('Your Node Version: ' + process.version);
    console.log('This process is pid ' + process.pid);
    console.log('This processor architecture is ' + process.arch);
    console.log('This platform is ' + process.platform);
    const jekyllplatform = process.platform === "win32" ? "jekyll.bat (Windows)" : "jekyll (OSX)";
    if (!argv.site) {
        console.log('Jekyll platform to run ' + jekyllplatform);
    }
    console.log('Running a proxy via: ' + proxysite);
    // console.log('Will run on port: ' + serverPort);
    console.log('############################################');
});

/// Compile Typescript
/// -------------------------------------

var tsProject = typescript.createProject('./tsconfig.json');

gulp.task('t_typescript', function() {
    return gulp.src(cfg.ts_input_all)
    .pipe(plumber(plumberOptionsJS))
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(tslint())
    .pipe(tsProject())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(cfg.js_output, {"mode": "0777"}))
    .pipe(browserSync.reload({stream: true}));
});

/// Compile Styles (SCSS to CSS)
/// -------------------------------------

gulp.task('t_styles_sass', function () {
    return gulp.src(cfg.scss_input_root)
        .pipe(plumber(plumberOptionsSass))
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions))
        .pipe(postcss([
            postcss_import(),
            postcss_url(),
            postcss_preset_env(csspresetenvOptions),
            postcss_pseudoelements({single: false}),
            // postcss_cachebuster(),
            // postcss_reporter(),
            postcss_browser_reporter({selector: 'body:before'})
        ]))
        .pipe(cleanCSS(cleancssOptionsBeautify, (details) => {
            if (details.errors.length > 0) {
                console.error(`CleanCSS Errors: ${details.errors}`);
            }
            if (details.warnings.length > 0) {
                // console.warn(`CleanCSS Warnings: ${details.warnings}`);
            }
        }))
        .pipe(sourcemaps.write(cfg.cssmaps_output))
        .pipe(gulp.dest(cfg.css_output, {"mode": "0777"}))
        .pipe(browserSync.stream());
});

/// Compile Styles (SCSS to CSS) no proxy or site
/// -------------------------------------

gulp.task('t_styles_only', function () {
    return gulp.src(cfg.scss_input_root)
        .pipe(plumber(plumberOptionsSass))
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions))
        .pipe(postcss([
            postcss_import(),
            postcss_url(),
            postcss_preset_env(csspresetenvOptions),
            postcss_pseudoelements({single: false}),
        ]))
        .pipe(cleanCSS(cleancssOptionsBeautify, (details) => {
            if (details.errors.length > 0) {
                console.error(`\nCleanCSS Errors: ${details.errors}`);
            }
        }))
        .pipe(sourcemaps.write(cfg.cssmaps_output))
        .pipe(gulp.dest(cfg.css_output, {"mode": "0777"}))
        .pipe(browserSync.stream());
});

/// Compile Styles (SCSS to CSS) no proxy or site, production settings (no sourcesmaps etc)
/// -------------------------------------

gulp.task('t_styles_production', function () {
    return gulp.src(cfg.scss_input_root)
        .pipe(plumber(plumberOptionsSass))
        .pipe(sass(sassOptions))
        .pipe(postcss([
              postcss_import(),
              postcss_url(),
              postcss_preset_env(csspresetenvOptions),
              postcss_pseudoelements({ single: false }),
              postcss_browser_reporter()
        ]))
        .pipe(cleanCSS(cleancssOptionsMinify, (details) => {
            console.log(`\n--------------oO CleanCSS Oo--------------`);
            console.log(`${details.name} original: ${details.stats.originalSize}`);
            console.log(`${details.name} minified: ${details.stats.minifiedSize}`);
            console.log(`Time to minify: ${details.stats.timeSpent}ms`);
            console.log(`Compression Ratio: ${(details.stats.efficiency * 100).toFixed(2)}%`);
            if (details.errors.length > 0) {
                console.error(`\nCleanCSS Errors: ${details.errors}`);
            }
            if (details.warnings.length > 0) {
                console.error(`CleanCSS Warnings: ${details.warnings}`);
            }
        }))
        .pipe(gulp.dest(cfg.css_output, { "mode": "0777" }))
        .pipe(browserSync.stream());
});

/// Clearing up (delete files/folder)
/// -------------------------------------

gulp.task('t_clear', function(cb) {
    if (argv.site) {
        return gulp.src(cfg.cleanfiles, {read: false})
        .pipe(clean());
    } else {
        // return gulp.src(cfg.wipefolder, {read: false})
        // .pipe(clean());
        return del(cfg.wipefolder, cb);
        // return del(cfg.cleanfiles, cb);
    }
});

/// Build the Jekyll Site
/// -------------------------------------

gulp.task('t_jekyll-build', function (done) {
    // Detect if Windows to run the correct Jekyll
    const jekyllSystem = process.platform === "win32" ? "jekyll.bat" : "jekyll";

    browserSync.notify('Building Jekyll');
    return childProcess.spawn(jekyllSystem, ['build'], {stdio: 'inherit'})
        .on('close', done);
});

/// Rebuild Jekyll & do page reload
/// -------------------------------------

gulp.task('t_jekyllRebuild', ['t_jekyll-build'], function () {
    // An issue with Jekyll, when run, it scraps all the contents of the _site directory.
    // So we tell _config.yml to ignore folders (JS, and CSS)
    browserSync.reload();
});

/// Wait for jekyll-build, then launch the Server
/// -------------------------------------

gulp.task('t_browserSyncJekyll', ['t_jekyll-build'], function() {
    browserSync.init(null, {
        server: {
            baseDir: cfg.jekyll_path_app
        },
        notify: true
        // host: 'localhost:' + serverPort
    });
});

/// launch the server via proxy
gulp.task('t_browserSyncProxy', function() {
    portfinder.getPort(function (err, port) {
        serverPort = port;

        browserSync.init({
            open: 'external',
            host: proxysite,
            proxy: proxysite,
            port: serverPort,//3000
            notify: true
        });
    });
});

gulp.task('t_htmly', function() {
    gulp.src(cfg.html_input_all)
        // .pipe(reload({stream: true}));
        .pipe(browserSync.stream());
});

gulp.task('t_watch-files', function () {
    // Watch .sass files
    // Absolute paths prevent new files from being watched, thus use {cwd: './'} to solve
    gulp.watch(cfg.ts_input_all, {cwd: './'}, ['t_typescript']);
    gulp.watch(cfg.scss_input_all, {cwd: './'}, ['t_styles_sass']);
    gulp.watch(cfg.html_input_all, {cwd: './'}, ['t_htmly']);
});

gulp.task('t_watch-JekyllHtml', function () {
    // Watch .html files
    gulp.watch([cfg.jekyll_input_all], {cwd: './'}, ['t_jekyllRebuild']);
});

// TASKS
// =================================
gulp.task('default', function() {
    console.log("No default task is set");
});

// alternative to argv
/////// queries the task name:
/////// devEnv = process.argv[process.argv.length-1] !== 'prod';

const img1 = "data:image/png;base64,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";
