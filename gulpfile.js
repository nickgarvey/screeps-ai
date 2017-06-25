const gulp = require('gulp');
const execSync = require('child_process').execSync;
const del = require('del');

gulp.task('typescript', function() {
    // results in files in out/
    execSync('tsc --outDir build/');
});


DEPLOY_DIR = "C:/Users/Nick Garvey/AppData/Local/Screeps/scripts/screeps.com/gulp_out";
gulp.task('steam_copy', ['typescript'], function() {
    return gulp.src('build/src/**/*.js')
        .pipe(gulp.dest(DEPLOY_DIR));
});

gulp.task('cleanup_build', ['steam_copy'], function() {
    del.sync(['build/']);
});

gulp.task('deploy_steam', ['cleanup_build']);
