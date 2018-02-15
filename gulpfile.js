// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var eslint = require('gulp-eslint');
var sass = require('gulp-sass');
var bro = require('gulp-bro');
var stringify = require('stringify');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify-es').default;
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var bourbon 	= require('bourbon').includePaths;
var neat		= require('bourbon-neat').includePaths;
var octo = require('@octopusdeploy/gulp-octo');

var releaseFiles = [
  '**/*',
  '!.nyc_output/**/*',
  '!./{assets,assets/**}',
  '!./{bin,bin/**}',
  '!./{coverage,coverage/**}',
  '!dist/js/{maps,maps/**}',
  '!./{docs,docs/**}',
  '!./{test,test/**}',
];

// Lint Task
gulp.task('lint', function () {
  return gulp.src('js/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

// Compile Our Sass
gulp.task('sass', function () {
  return gulp.src('assets/styles/main.scss')
    .pipe(sass({
      includePaths: [bourbon, neat],
    }))
    .pipe(gulp.dest('dist/styles'));
});

// Concatenate & Minify JS
gulp.task('scripts', function () {
  gulp.src('assets/js/backbone/app.js')
    .pipe(babel())
    .pipe(bro({ transform: stringify }))
    .pipe(rename('bundle.min.js'))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('dist/js'));
});

// Move additional resources
gulp.task('move', function () {
  gulp.src(['./assets/files/**'])
    .pipe(gulp.dest('dist/files'));
  gulp.src(['./assets/fonts/**'])
    .pipe(gulp.dest('dist/fonts'));
  gulp.src(['./assets/images/**'])
    .pipe(gulp.dest('dist/images'));
  gulp.src(['./assets/img/**'])
    .pipe(gulp.dest('dist/img'));
  gulp.src(['./assets/locales/**'])
    .pipe(gulp.dest('dist/locales'));
  gulp.src(['./assets/*.*'])
    .pipe(gulp.dest('dist'));
  gulp.src(['./assets/js/vendor/fontawesome-all.js'])
    .pipe(gulp.dest('dist/js'));
});

// Watch Files For Changes
gulp.task('watch', function () {
  gulp.watch('assets/js/backbone/**', ['lint', 'scripts']);
  gulp.watch('assets/js/utils/**', ['lint', 'scripts']);
  gulp.watch('assets/styles/**', ['sass']);
});

// Build task
gulp.task('build', ['lint', 'sass', 'scripts', 'move']);

// Build a release
gulp.task('release', ['build'], function () {
  var pack = gulp.src(releaseFiles)
    .pipe(octo.pack('zip'));
  if(process.env.OctoHost && process.env.OctoKey) {
    pack.pipe(octo.push({
      host: process.env.OctoHost,
      apiKey: process.env.OctoKey,
    }));
  } else {
    pack.pipe(gulp.dest('./bin'));
  }
});

//Default task
gulp.task('default', ['lint', 'sass', 'scripts', 'move', 'watch']);
