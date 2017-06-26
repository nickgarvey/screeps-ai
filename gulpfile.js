const gulp = require('gulp');
const execSync = require('child_process').execSync;
const fs = require('fs');
const del = require('del');
const glob = require('glob');
const util = require('util');

gulp.task('typescript', function() {
    // results in files in out/
    // TODO this should not use global typescript
    execSync('tsc --outDir build/');
});

gulp.task('make_dist', function(f) {
    if (!fs.existsSync('dist')) {
        fs.mkdir('dist', f);
    } else {
        f();
    }
});

gulp.task('minify', ['typescript', 'make_dist'], (cb) => {
    const UGLIFY_PATH = "node_modules/uglify-js-es6/bin/uglifyjs";
    glob("build/src/**/*.js", (_1, files) => {
        const fns = files.map(file => () => {
            const newFile = file.replace(/^build\/src\//, 'dist/');
            const command = util.format("node %s \"%s\" -o \"%s\" -c", UGLIFY_PATH, file, newFile);
            execSync(command);
        });
        fns.forEach(f => f());
        cb();
    });
});

DEPLOY_DIR = "C:/Users/Nick Garvey/AppData/Local/Screeps/scripts/screeps.com/gulp_out";
gulp.task('steam_copy', ['minify'], function() {
    del.sync([DEPLOY_DIR + '/*.js', '!' + DEPLOY_DIR], {force: true});
    // TODO this is build not dist so I get unminified
    return gulp.src('build/src/**/*.js')
        .pipe(gulp.dest(DEPLOY_DIR));
});

gulp.task('cleanup_build', ['steam_copy'], function() {
    del.sync(['build/', 'dist/']);
});

gulp.task('deploy_steam', ['cleanup_build']);
