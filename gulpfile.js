// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

// Lint Task
gulp.task('lint', function() {
  return gulp.src('js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Compile Our Sass
gulp.task('sass', function() {
  return gulp.src('assets/styles/main.scss')
    .pipe(sass())
    .pipe(gulp.dest('dist/css'));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
  if (process.env.NODE_ENV == 'production') {
  return gulp.src('assets/js/backbone/app.js')
    .pipe(uglify())
    .pipe(rename('bundle.min.js'))
    .pipe(gulp.dest('dist/js'));
  } else {
    return gulp.src('assets/js/backbone/app.js')
      .pipe(rename('bundle.js'))
      .pipe(gulp.dest('dist/js'));
  }
});

// Watch Files For Changes
gulp.task('watch', function() {
  gulp.watch('assets/js/backbone/*.js', ['lint', 'scripts']);
  gulp.watch('assets/styles/*', ['sass']);
});

//Default task
gulp.task('default', ['lint', 'sass', 'scripts', 'watch']);
