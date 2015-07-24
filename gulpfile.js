"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");
var path = require("path");
var sourcemaps = require("gulp-sourcemaps");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer-core");
var browserSync = require("browser-sync").create();

// Static Server + watching scss/html files
gulp.task("serve", ["sass"], function () {

    browserSync.init({
        server: "./"
    });

    gulp.watch("sass/**/*.scss", ["sass"]);
    gulp.watch("index.html").on("change", browserSync.reload);
});

gulp.task("sass", function () {
    var processors = [
        autoprefixer({browsers: ["last 3 versions", "ie >= 8", "android >= 2.3.3"]})
    ];
    gulp.src(path.join(__dirname, "/sass/**/*.scss"))
        .pipe(sourcemaps.init())
        .pipe(sass().on("error", sass.logError))
        .pipe(postcss(processors))
        .pipe(sourcemaps.write("./maps"))
        .pipe(gulp.dest(path.join(__dirname, "/css/")))
        .pipe(browserSync.stream({match: "**/*.css"}));
});

gulp.task("sass:watch", function () {
    gulp.watch("./scss/**/*.scss", ["sass"]);
});
