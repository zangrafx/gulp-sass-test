"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");
var sourcemaps = require("gulp-sourcemaps");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer-core");

gulp.task("sass", function () {
    var processors = [
        autoprefixer({browsers: ["last 3 versions", "ie >= 8", "android >= 2.3.3"]})
    ];
    gulp.src("./scss/**/*.scss")
        .pipe(sourcemaps.init())
        .pipe(sass().on("error", sass.logError))
        .pipe(postcss(processors))
        .pipe(sourcemaps.write("./maps"))
        .pipe(gulp.dest("./css"));
});

gulp.task("sass:watch", function () {
    gulp.watch("./scss/**/*.scss", ["sass"]);
});
