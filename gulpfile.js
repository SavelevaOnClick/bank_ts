const { src, dest, series, watch } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const typeScript = require("gulp-typescript");
const rename = require("gulp-rename");
const browserSync = require("browser-sync").create();

function scss() {
  return src("src/**.scss")
    .pipe(sass({ outputStyle: "expanded" }))
    .pipe(dest("dist"));
}

function html() {
  return src("src/index.html").pipe(dest("dist"));
}

const tsProject = typeScript.createProject("tsconfig.json");

function typeScriptCompile() {
  return src("src/main.ts")
    .pipe(rename("index.ts"))
    .pipe(tsProject())
    .js.pipe(dest("dist"));
}

function server() {
  browserSync.init({
    server: "dist",
  });
  watch("src/**.html", html).on("change", browserSync.reload);
  watch("src/**.scss", scss).on("change", browserSync.reload);
  watch("src/**.ts", typeScriptCompile).on("change", browserSync.reload);
}

exports.compile = series(html, scss, typeScriptCompile);
exports.server = server;
