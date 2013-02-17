var canvas = document.createElement('canvas');
canvas.id = 'surface';
document.getElementById('target').appendChild(canvas);

var ctx = canvas.getContext('2d');

var controller = new Leap.Controller();
console.log('controller', controller);
controller.onFrame(function() {
    var frame = controller.frame();
    if (frame == null || !frame.valid) {
        console.log('frame invalid!');
        return;
    }

    var pointable = getNearestPointable(frame);

    if(!pointable){
        return;
    }

    var position = pointable.tipPosition;

    var x = 4*(200 + position[0]);
    var y = 4*(200 - position[1]);
    var density = .3 * (20 - position[2]);
    density = density>0?density:0;
    ctx.fillStyle = "rgb(20,30,20)";
    ctx.fillRect(x, y, density, density);
    document.getElementById('x').innerHTML = "<pre>"+position[0]+"</pre>";
    document.getElementById('y').innerHTML = "<pre>"+position[1]+"</pre>";
    document.getElementById('z').innerHTML = "<pre>"+position[2]+"</pre>";});

controller.connect();

/**
 * Z is point to user so, nearest pointable to screen with less Z.
 * @param frame
 * @return {*}
 */
function getNearestPointable(frame) {
    var nearestPoinable = null;
    var zDistance = -Number.MAX_VALUE;
    var pointables = frame.pointables;
    for(var index = pointables.length - 1; index >=0; index--){
        var pointable = pointables[index];
        if(pointable == null || !pointable.valid){
            continue;
        }

        var position = pointable.tipPosition;
        var newZDistance = position[2];
        if(zDistance < newZDistance){
            zDistance = newZDistance;
            nearestPoinable = pointable;
        }
    }

    return nearestPoinable;
}

fitToWindow();

window.addEventListener('resize', fitToWindow);

function fitToWindow(){
    // get image data
    var imageData;
    if(canvas.width > 0 && canvas.height > 0){
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    var targetElement = document.getElementById('target')

    // modify image data
    canvas.width  = targetElement.clientWidth;
    canvas.height = targetElement.clientHeight;

    // draw result back onto the canvas
    if(imageData){
        ctx.putImageData(imageData, 0, 0);
    }
}