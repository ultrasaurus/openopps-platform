// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var bro = require('gulp-bro');
var stringify = require('stringify');
var html = require('html-browserify');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

// Lint Task
gulp.task('lint', function () {
  return gulp.src('js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Compile Our Sass
gulp.task('sass', function () {
  return gulp.src('assets/styles/main.scss')
    .pipe(sass())
    .pipe(gulp.dest('dist/styles'));
});

// Concatenate & Minify JS
gulp.task('scripts', function () {
  if (process.env.NODE_ENV == 'production') {
    gulp.src('assets/js/backbone/app.js')
      .pipe(babel())
      .pipe(bro({ transform: stringify }))
      .pipe(rename('bundle.min.js'))
      .pipe(gulp.dest('dist/js'));
  } else {
    gulp.src('assets/js/backbone/app.js')
      .pipe(babel())
      .pipe(bro())
      .pipe(rename('bundle.js'))
      .pipe(gulp.dest('dist/js'));
  }
});

// Move additional resources
gulp.task('move', function () {
  gulp.src(['./assets/files/**'])
    .pipe(gulp.dest('dist/files'));
  gulp.src(['./assets/fonts/**'])
    .pipe(gulp.dest('dist/fonts'));
  gulp.src(['./assets/images/**'])
    .pipe(gulp.dest('dist/images'));
  gulp.src(['./assets/locales/**'])
    .pipe(gulp.dest('dist/locales'));
  gulp.src(['./assets/*.*'])
    .pipe(gulp.dest('dist'));
});

// Watch Files For Changes
gulp.task('watch', function () {
  gulp.watch('assets/js/backbone/*.js', ['lint', 'scripts']);
  gulp.watch('assets/styles/*', ['sass']);
});

// Build task
gulp.task('build', ['lint', 'sass', 'scripts', 'move']);

//Default task
gulp.task('default', ['lint', 'sass', 'scripts', 'move', 'watch']);
