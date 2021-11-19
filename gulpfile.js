// === CONFIGURABLE VARIABLES
var bpfoldername = "wool_behaviors";

// === END CONFIGURABLE VARIABLES

const gulp = require("gulp");
const ts = require("gulp-typescript");
const del = require("del");
const os = require("os");
const config = require("./config.json");

let mcdir = os.homedir() + config.mcDirectory;

gulp.task("clean-build", function () {
  return del(["build/behavior_packs/"]);
});

gulp.task("copy-content", function () {
  return gulp.src(["behavior_packs/**/*"]).pipe(gulp.dest("build/behavior_packs"));
});

gulp.task(
  "build",
  gulp.series("clean-build", "copy-content", function () {
    return gulp
      .src("scripts/**/*.ts")
      .pipe(
        ts({
          module: "es2020",
          moduleResolution: "node",
          strict: true,
          noImplicitAny: true,
          lib: ["es2020"],
        })
      )
      .pipe(gulp.dest("build/behavior_packs/" + bpfoldername + "/scripts"));
  })
);

gulp.task("clean-localmc", function () {
  let targetBpFolder = mcdir + "development_behavior_packs/" + bpfoldername;

  return gulp.src(["build/behavior_packs/" + bpfoldername + "/**/*"]).pipe(gulp.dest(targetBpFolder));
});

gulp.task(
  "deploy-localmc",
  gulp.series("clean-localmc", function () {
    let targetBpFolder = mcdir + "development_behavior_packs/" + bpfoldername;
    console.log("\007"); // annunciate a beep!

    return gulp.src(["build/behavior_packs/" + bpfoldername + "/**/*"]).pipe(gulp.dest(targetBpFolder));
  })
);

gulp.task("default", gulp.series("build", "deploy-localmc"));

gulp.task(
  "watch",
  gulp.series("default", function () {
    gulp.watch(["scripts/**/*.ts", "behavior_packs/**/*"], gulp.series("build", "deploy-localmc"));
  })
);
