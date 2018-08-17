/// CONFIG
/// -------------------------------------
const gulp              = require('gulp'),

/// Images and SVG
    concat              = require('gulp-concat'),
    svgo                = require('gulp-svgo'),
    clean               = require('gulp-clean'),
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

    doiuse              = require('doiuse'),
    argv                = require('yargs').argv,
    notify              = require('gulp-notify'),
    browserSync         = require('browser-sync').create(),
    childProcess        = require('child_process'),
    reload              = browserSync.reload;

/// PATHS
/// -------------------------------------
// We can proxy any website (and manipulate CSS), or make a standalone site (HTML, images, and CSS):
//  - if we're running a proxy site, only generate CSS from Sass, by outputting /styles to /css (Gulpfile.js should be within the "assets" folder).
//  - if we're running a standlone site, everything (html, templates and styles) is in "app" folder and outputs to separate "_site"

const
                        // argv.site ? "running proxy" : "running standalone localhost"
    path                    = './',
    path_src                = path + 'src',
    path_dist               = path + 'dist',
    scss_input_all          = path_src + '/styles/**/*.scss',
    scss_input_root         = path_src + '/styles/*.scss',

    app_folder              = '/_site',
    path_app                = argv.site ?       path_dist                   : path_dist + app_folder,
    app_assets              = argv.site ?       ''                          : '/assets',
    path_assets             = argv.site ?       path_app                    : path_app + app_assets,

    proxysite               = argv.site ?       `${argv.site}`              : "localhost",
    css_output              = argv.site ?       path_assets + '/css'        : path_assets + '/css',
    cleanfiles              = argv.site ?       css_output + '/*.css'       : css_output + '/*.css',
    wipefolder              = argv.site ?       css_output + ''             : css_output + '/',
    cssmaps_output          = argv.site ?       './maps'                    : '../maps',
    svg_input               = path_src + '/img/svg/**/*.svg',
    svg_output              = path_assets + '/img/svg/',

    jekyll_site             = path_src + '/html',
    // Adds CSS to Jekyll's build folder (so it'll be included in Jekylls initial publish)
    jekyllcss_output        = path_src + '/html' + '/assets/css',
    jekyll_input_all        = [ jekyll_site + '/**/*.html',
                                jekyll_site + '/**/*.yml',
                                jekyll_site + '/**/*.php',
                                jekyll_site + '/**/*.md',
                                jekyll_site + '/**/*.mv'];

// alternative to argv
/////// queries the task name:
/////// devEnv = process.argv[process.argv.length-1] !== 'prod';

/// Server Port
/// -------------------------------------
portfinder.basePort = 3000;

/// CSS and PLUGIN OPTIONS
/// -------------------------------------
const cleancssOptionsBeautify = {
    // https://github.com/jakubpawlowicz/clean-css
    format: 'beautify',
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

// const cssnextOptions = {
//     /// browserslist is now set in package.json so linters and others can access the same config
//     // browsers: ['last 1 Chrome versions'],
//     cascade: false,//use Visual Cascade, if CSS is uncompressed
//     features: {
//         customProperties: {
//             preserve: true,
//             warnings: false
//         }
//     }
// };

const csspresetenvOptions = {
    stage: 2
};

const plumberOptions = {
    errorHandler: function (err) {
        console.log(err);
        browserSync.notify("<div style='font-family: Comic Sans MS, Comic Sans, cursive;font-size: 22px;margin-bottom: 10px;'><img src='" + img1 + "' style='vertical-align:text-bottom;'' /> There's an <span style='color: hotpink'>error </span> with your Sass...</div>More details in your console <br><br><pre style='font-size: 15px;text-align: left;'>" + err.message + "</pre>", 6000);
        this.emit('end');
    }
};

/// TASKS
/// -------------------------------------

gulp.task('info', function () {
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

gulp.task('styles', function () {
    return gulp.src(scss_input_root)
        .pipe(plumber(plumberOptions))
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
        .pipe(sourcemaps.write(cssmaps_output))
        .pipe(gulp.dest(css_output, {"mode": "0777"}))
        // Run Jekyll, only if no site argument from the commandline
        .pipe(gulpif(!argv.site, gulp.dest(jekyllcss_output, {"mode": "0777"})))
        .pipe(browserSync.stream());
});

gulp.task('styles_only', function () {
    return gulp.src(scss_input_root)
        .pipe(plumber(plumberOptions))
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
        .pipe(sourcemaps.write(cssmaps_output))
        .pipe(gulp.dest(css_output, {"mode": "0777"}))
        .pipe(browserSync.stream());
});

gulp.task('styles_production', function () {
    return gulp.src(scss_input_root)
        .pipe(plumber(plumberOptions))
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
        .pipe(gulp.dest(css_output, { "mode": "0777" }))
        .pipe(browserSync.stream());
});

gulp.task('clean', function() {
    if (argv.site) {
        return gulp.src([cleanfiles], {read: false})
        .pipe(clean());
    } else {
        return gulp.src([wipefolder], {read: false})
        .pipe(clean());
    }
});

/// Build the Jekyll Site
gulp.task('jekyll-build', function (done) {
    // Detect if Windows to run correct Jekyll
    const jekyllSystem = process.platform === "win32" ? "jekyll.bat" : "jekyll";

    browserSync.notify('Building Jekyll');
    return childProcess.spawn(jekyllSystem, ['build'], {stdio: 'inherit'})
        .on('close', done);
});

/// Rebuild Jekyll & do page reload
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    // An issue with Jekyll, when run, it scraps all the contents of the _site directory.
    // So we output a second copy of the CSS (using styles task) to the Jekyll HTML folder,
    // so it includes with the html files, then reload
    browserSync.reload();
});

/// Wait for jekyll-build, then launch the Server
gulp.task('browser-sync', ['jekyll-build'], function() {
    browserSync.init(null, {
        server: {
            baseDir: path_app
        },
        notify: false
        // host: 'localhost:' + serverPort
    });
});

/// launch the server via proxy
gulp.task('browser-syncproxy', function() {
    portfinder.getPort(function (err, port) {
        serverPort = port;

        browserSync.init({
            open: 'external',
            host: proxysite,
            proxy: proxysite,
            port: serverPort,//3000
            notify: false
        });
    });
});

gulp.task('watchstyles', function () {
    // Watch .sass files
    gulp.watch(scss_input_all, ['styles']);
});

gulp.task('watchhtml', function () {
    // Watch .html files
    gulp.watch([jekyll_input_all], ['jekyll-rebuild']);
});

// MAIN TASKS
// =================================
gulp.task('default', function() {
    console.log("No default task is set");
});

// start it with "gulp sass" if you're running Jekyll
// or "gulp sass --site www.sitename.test" to run as a proxy
// or "gulp sass --site www.sitename.test --no-notify" to run as a proxy and without "Browsersync connected" popup
gulp.task('sass', ['clean'], function () {
    if(argv.site){
        // Build Sass and browserSync as proxy, doesn't run jekyll
        gulp.start('styles', 'browser-syncproxy', 'watchstyles', 'info');
    } else {
        // Build Sass and browserSync, includes Autoprefixes and Sourcemaps
        gulp.start('styles', 'browser-sync', 'watchstyles', 'watchhtml', 'info');
    }
});

// Uncompressed CSS-only (no site or proxy)
// cmdline: "gulp sassonly --site none"
gulp.task('sassonly', ['clean'], function () {
    gulp.start('styles_only', 'watchstyles', 'info');
});

// Compressed CSS-only (no site or proxy, no sass maps)
// cmdline: "gulp production --site none"
gulp.task('production', ['clean'], function () {
    gulp.start('styles_production', 'watchstyles', 'info');
});

const img1 = "data:image/png;base64,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";
