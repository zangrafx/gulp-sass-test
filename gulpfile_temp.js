"use strict";

var autoprefixer = require("autoprefixer-core"),
    bless = require("gulp-bless"),
    browserSync = require("browser-sync").create(),
    concat = require("gulp-concat"),
    fs = require("fs"),
    gg = require("gore-gulp"),
    gulp = require("gulp"),
    gutil = require("gulp-util"),
    merge = require("merge-stream"),
    nunjucks = require("gulp-nunjucks"),
    path = require("path"),
    pckg = require(path.resolve(__dirname, "package.json")),
    plumber = require("gulp-plumber"),
    postcss = require("gulp-postcss"),
    Promise = require("bluebird"),
    rename = require("gulp-rename"),
    replace = require("gulp-replace"),
    sass = require("gulp-sass"),
    sourcemaps = require("gulp-sourcemaps"),
    spritesmith = require("gulp.spritesmith"),
    tmp = require("tmp");

gg({
    "baseDir": __dirname,
    "dependencies": [
        "nunjucks"
    ]
}).setup(gulp);


gulp.task("nunjucks", function () {
    return gulp.src(path.resolve(__dirname, "web_modules", pckg.name, "sfdr-*", "**", "*.twig"))
        .pipe(nunjucks())
        .pipe(concat("sfdr-views.min.js"))
        .pipe(replace("window.", "self."))
        .pipe(gulp.dest("s"));
});

gulp.task("sprite", function () {
    // Generate our spritesheet
    var spriteData = gulp.src("src/sprites/*.png").pipe(spritesmith({
        imgName: "sprite.png",
        cssName: "_sprite.scss",
        imgPath: "/i/sprites/sprite.png"
    }));

    // Pipe image stream through image optimizer and onto disk
    var imgStream = spriteData.img
        .pipe(gulp.dest("i/sprites/"));

    // Pipe CSS stream through CSS optimizer and onto disk
    var cssStream = spriteData.css
        .pipe(gulp.dest("sass/mixins/"));

    // Return a merged stream to handle both `end` events
    return merge(imgStream, cssStream);
});


// BrowserSync proxy + watching scss/html files

gulp.task("watch", ["css"], function () {
    browserSync.init({
        "port": 18089,
        "logConnections": false,
        "proxy": "localhost:19255"
    });
    gulp.watch("sass/**/*.scss", ["sass"]);
    gulp.watch(["Views/**/*.cshtml", "s/**/*.*", "i/**/*.png", "i/**/*.jpg", "m/**/*.*"]).on("change", browserSync.reload);
});

// Static Server + watching scss/html files
gulp.task("static", ["css"], function () {
    browserSync.init({
        "port": 18082,
        "startPath": "/iconic-page.html",
        "server": {
            "baseDir": "./"
        }
    });
    gulp.watch("sass/**/*.scss", ["sass"]);
    gulp.watch(["Views/**/*.cshtml", "s/**/*.js", "i/**/*.png", "i/**/*.jpg", "m/**/*.*"]).on("change", browserSync.reload);
});

gulp.task("watch2", ["css"], function () {
    gulp.watch("sass/**/*.scss", ["sass"]);
});

// Compile sass into CSS & auto-inject into browsers
// warning: use gulp-plumber in case some other task depends on 'sass' done

// todo: remove sourcemaps.write/sourcemaps.init from middle after https://github.com/floridoo/gulp-sourcemaps/issues/124 is fixed

gulp.task("sass", function () {
    var processors = [
        autoprefixer({browsers: ["last 3 versions", "ie >= 8", "android >= 2.3.3"]})
    ];
    return gulp.src("sass/**/*.scss")
        .pipe(plumber(function (err) {
            gutil.log(gutil.colors.red("Sass error:"));
            gutil.log(gutil.colors.yellow(err.message));
            this.emit("end");
        }))
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(sourcemaps.write())
        .pipe(sourcemaps.init({
          loadMaps: true
        }))
        .pipe(postcss(processors))
        .pipe(sourcemaps.write("./maps"))
        .pipe(gulp.dest("css"))
        .pipe(browserSync.stream({match: "**/*.css"}));
});

// compile Sass and then split css for IE if over 4k rules
gulp.task("css", ["sass"], function () {
    var orig = path.resolve(__dirname, "css", "main.css");

    return Promise.fromNode(function (cb) {
        tmp.dir(cb);
    }).spread(function (tmpDir) {
        return new Promise(function (resolve, reject) {
            gulp.src(orig)
                .pipe(bless({
                    imports: false,
                    log: true
                }))
                .pipe(gulp.dest(tmpDir))
                .on("error", reject)
                .on("finish", function () {
                    resolve(tmpDir);
                });
        });
    }).then(function (tmpDir) {
        return Promise.fromNode(function (cb) {
            fs.readdir(tmpDir, cb);
        }).then(function (files) {
            if (files.length > 1) {
                return new Promise(function (resolve, reject) {
                    gulp.src(path.resolve(tmpDir, "main.css"))
                        .pipe(rename({
                            "basename": "main_1"
                        }))
                        .pipe(gulp.dest(path.resolve(__dirname, "css")))
                        .on("error", reject)
                        .on("finish", resolve);
                });
            }
        });
    });
});


gulp.task("build", ["css", "nunjucks", "webpack.development"]);
gulp.task("build-scripts", ["webpack.development"]);
gulp.task("deploy", ["css", "nunjucks", "webpack.production"]);
gulp.task("default", ["watch"]);
