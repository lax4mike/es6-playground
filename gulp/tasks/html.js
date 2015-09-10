var gulp           = require("gulp"),
    utils          = require("./utils"),
    config         = utils.loadConfig(),
    template       = require("gulp-template");

var path = require("path"),
    fs   = require("fs");


// dev/default settings
utils.setTaskConfig("html", {
    default: {
        dest: config.dest
    }
});

// register the watch
utils.registerWatcher("html", [
    config.root + "/index.html",
    config.root + "/examples/**"
]);



/* copy html files */
gulp.task("html", function(next) {

    var html = utils.loadTaskConfig("html");


    // generate index.html with underscore templates
    gulp.src(config.root + "/index.html")
            .pipe(utils.drano())
            .pipe(template({
                examples: getExamples()
            }))
            .pipe(gulp.dest(html.dest));

    next();

});


function getExamples() {

    var examplesDir = path.resolve(config.root + "/examples");
    var files = fs.readdirSync(examplesDir);
  
    // load file content of each file in examples
    var examples = files.map(function(file){
        var filePath = examplesDir + '/' + file;
        var content = fs.readFileSync(filePath, "utf8");

        // remove extension and replace : with /
        var displayName = file.replace(/\.[^/.]+$/, "")
                              .replace(/:/, "/"); 

        // remove spaces, / and replace with -, lowercase
        var slug =  displayName.replace(/[\s\/]/g, "-")
                               .replace(/-+/g, "-")
                               .toLowerCase();

        // make sure we can put this in the URL
        slug = encodeURIComponent(slug);

        return {
            displayName: displayName,
            slug: slug,
            content: content
        };
    });

    return examples;

}

