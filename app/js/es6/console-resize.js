
var resizer = document.querySelector(".console__resize-handle");

// stream of true/false of whether or not the user has their mouse
// down on the resize handle
var mouseIsDownStream = Kefir.merge([
        Kefir.fromEvent(resizer, "mousedown"),
        Kefir.fromEvent(window, "mouseup")
    ])
    .map(function(mouseEvent){
        return mouseEvent.type === "mousedown";
    });


var mouseMoveStream = Kefir.fromEvent(window, "mousemove")
    
    // only push to this stream if the mouse is down on the resize handle
    .filterBy(mouseIsDownStream)

    // get x position as a percentage (size of console)
    .map(function(mouseEvent){

        // prevent user selecting while dragging
        mouseEvent.preventDefault();

        var dw = document.documentElement.clientWidth;
        var rw = resizer.offsetWidth;

        // calculate percentage of width. (rw * 1.5) puts us in the middle of the resizer
        return (dw - mouseEvent.x - (rw * 1.5)) / dw * 100;
    })

    // don't let it get too small or too big
    .filter(function(percent){
        return percent > 10 && percent < 70;
    })

    .onValue(function(v){
        document.querySelector(".console").style.flexBasis = v + "%";  
    });
