var gulp        = require("gulp"),
    plumber     = require("gulp-plumber"),
    notify      = require("gulp-notify"),
    fs          = require("fs"),
    path        = require("path"),
    runSequence = require("run-sequence"),
    color       = require("cli-color"),
    argv        = require("yargs").argv,
    merge       = require("deepmerge");


/**
 * config: variable to hold config
 *
 *    reserved keys: {
 *        local: {},
 *        loadedTasks: [],
 *        taskConfig: { // see setTaskConfig
 *            js: {
 *                default: { ... }, // required
 *                dev: { ...overrides... } // dev environment
 *                prod: { ...overrides...},
 *                otherEnv: { ... }
 *            },
 *            css: { ... },
 *            ...
 *        },
 *        watchers: [] 
 *    }
 *    
 *    user supplied keys: eg. {
 *        root: "../app/",
 *        dest: "../build_dev/",
 *        env: "dev",
 *        tasks: ["js", "css", "html", "bower"],
 *        watch: true
 *    }
 *
 *    if tasks is undefined, all the loaded tasks (from utils.loadTasks) will be used
 */
var config = null;

// return the config that was set with setConfig
// initialize if needed
module.exports.loadConfig = function loadConfig(){

    // initialize our config if it's not already, and load local.js if it exists
    // local.js file is for config that shouldn't be checked into source control (see .gitignore)
    // these settings live in config.local (eg. config.local.hostname)
    if (config === null){
        config = {};

        // load local.js config or initalize to empty object
        config.local = (fs.existsSync(__dirname + "/../local.js")) ? require("../local") : {};
    }

    return config;
};

// set some config options. should be restircted to "user supplied keys" above
module.exports.setConfig = function setConfig(settings){

    // make sure it's initialized
    config = this.loadConfig();

    // load this config into the config variable
    for(var key in settings){
        if (!settings.hasOwnProperty(key)) { continue; }
        config[key] = settings[key];
    }

    return config;

};

// used to set the config for a specific task, eg. js or css
// use loadTaskConfig(taskName) later to reload this config for the current environment
// thisTaskConfig should be an object that has a property "default" with the default config
// the thisTaskConfig object can also contain properties that match with any given environment
// see config comment above 
module.exports.setTaskConfig = function setTaskConfig(task, thisTaskConfig){

    // make sure it's initialized
    config = this.loadConfig();

    // initialize the taskConfig object if needed
    if (!config.taskConfig) { config.taskConfig = {}; }

    if (!thisTaskConfig.hasOwnProperty("default")){
        throw new Error("Task config must provide a default config!");
    }

    config.taskConfig[task] = thisTaskConfig;

    return true;

};

// load the task for the current environment and merge with the default task config
module.exports.loadTaskConfig = function loadTaskConfig(task){
    
    // make sure the taskConfig is defined
    if (!config.taskConfig) { throw new Error("config.taskConfig is not defined"); }

    // load the config for this task (eg. css, js)
    var thisTaskConfig = config.taskConfig[task];

    if (!thisTaskConfig) { 
        throw new Error("'" + task + "' is not defined in config.taskConfig! use utils.setTaskConfig(task, config)"); 
    }

    // load default task config for this task
    var defaultTaskConfig = thisTaskConfig.default;

    // default config is required. see the config notes at the top of this file
    if (!defaultTaskConfig) { throw new Error("'" + task + "' does not define a default config!"); }

    // figure out the env variable 
    // argv has precedence. (if it was passed in the command line. eg. gulp css --env prod)
    var env = argv.env || config.env;

    // if there is no env set, or there is no config set for this env, return default task config
    if (!env || !thisTaskConfig.hasOwnProperty(env)){ return defaultTaskConfig; }

    // otherwise, load the environment config and merge it with the default config
    var envTaskConfig = thisTaskConfig[env];
    return merge(defaultTaskConfig, envTaskConfig); 
};



// drano: make plumber with error handler attached
module.exports.drano = function drano(){
    return plumber({
        errorHandler: function(err) {
            notify.onError({ title: "<%= error.plugin %>", message: "<%= error.message %>", sound: "Beep" })(err);
            this.emit("end");
        }
    });
};



// load tasks. given an array of tasks, require them
module.exports.loadTasks = function loadTasks(tasks) {
    
    // keep track of what tasks are loaded
    config.loadedTasks = config.loadedTasks || [];

    tasks.forEach(function(name) {
        // console.log("loading task: ", name);
        require("./" + name);
        config.loadedTasks.push(name);
    });
};

// load and start tasks
module.exports.build = function build() {
    
    gulp.src('').pipe(notify("Building for '" + config.env + "' environment")); // gulp.src('') is a hack

    // if config.tasks isn't defined, use the loadedTasks
    if (!config.tasks){ config.tasks = config.loadedTasks; }

    // browserSync needs special treatment because it needs to be started AFTER the 
    // build directory has been created and filled (for livereload to work)
    if (config.watch) {

        // load browserSync (not using loadTask so it doesn't get added to config.loadedTasks)
        require("./browserSync");

        // console.log("[" + color.yellow("registered watchers") + "]\n", config.watchers);

        // start the gulp watch for each registered watcher
        config.watchers.forEach(function(watcher){ 

            // only watch this task if it's in our task list
            if (config.tasks.indexOf(watcher.task) !== -1) { 
                this.logYellow("watching", watcher.task + ":", watcher.files);
                gulp.watch(watcher.files, [watcher.task]);
            }
        }.bind(this));
      

        runSequence(config.tasks, "browserSync");
    }
    else {
        gulp.start(config.tasks);
    }
 
}

// add a function to the watchers
module.exports.registerWatcher = function registerWatch(watcherTask, watcherFiles){
    config.watchers = config.watchers || [];

    config.watchers.push({
        task: watcherTask,
        files: watcherFiles
    });
}



// will log the output with the first arg as yellow
// eg. logYellow("watching", "css:", files) >> [watching] css: ["some", "files"]
module.exports.logYellow = function logYellow(){

    var args = (Array.prototype.slice.call(arguments));
    var first = args.shift();

    if (args.length){

        var argString = args.map(function(arg){
            return (typeof arg  === "object") ? JSON.stringify(arg) : arg.toString(); 
        }).join(" ");

        console.log("[" + color.yellow(first) + "]", argString);
    }
};




/** Object.assign polyfill **/
if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target, firstSource) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

