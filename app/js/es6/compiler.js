// handle es6 -> es5 compilation

var Console = require("./console-result");

// get traceur compiler (has the .compile() function)
var Es6Compiler = new traceur.Compiler();

// es6 code mirror
var es6 = document.querySelector(".code__editor--es6 .code__code-mirror");
var es6CodeMirror = CodeMirror(es6, {
    mode:  "javascript",
    value: "var poo = (x) => x + 1; \nconsole.log(poo(2));",
    lineNumbers: true
});

// es6 code mirror
var es5 = document.querySelector(".code__editor--es5 .code__code-mirror");
var es5CodeMirror = CodeMirror(es5, {
    mode:  "javascript",
    lineNumbers: true
});


// observe change stream on es6codemirror
var es6Stream = Kefir.fromEvent(es6CodeMirror, "change")

    // only do this if there is a 250ms gap
    .debounce(250)

    // compile the es6 code to es5 with traceur
    .map(function(cm){
        try {
            return Es6Compiler.compile(cm.getValue(), "es6-playground");
        } 
        catch(e){
            return e.toString();
        }
    })

    // when it changes, update the es5 code mirror
    .onValue(function(v){
        es5CodeMirror.setValue(v);

        Console.updateConsole(es6CodeMirror.getValue());
    });


// fire change event when the page loads
es6CodeMirror.setValue(es6CodeMirror.getValue());

