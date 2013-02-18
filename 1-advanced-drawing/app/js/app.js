var canvas = document.createElement('canvas');
canvas.id = 'surface';
document.getElementById('target').appendChild(canvas);
var ctx = canvas.getContext('2d');

//Create a stage by getting a reference to the canvas
var stage = new createjs.Stage("surface");

//Create a Shape DisplayObject.
var leapPointer = {x:0, y:0, z:0};

var leapPointerImg = new createjs.Bitmap("img/hand-cursor-42.png");
var leapPointerImgHint = new createjs.Shape();
leapPointerImgHint.graphics.beginFill('#F08010').drawCircle(0, 0, 20);

var drawingSurfaceGraphics = new createjs.Graphics();
var drawingSurfaceContainer = new createjs.Shape(drawingSurfaceGraphics);

//Add Shape instance to stage display list.
stage.addChild(drawingSurfaceContainer);
stage.addChild(leapPointerImg);
stage.addChild(game);

var controller = new Leap.Controller();

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

    leapPointer.x = x;
    leapPointer.y = y;
    leapPointer.z = position[2];
});

controller.connect();

var mouseDown = false;

canvas.onmousemove = function(event){
    leapPointer.x = event.clientX;
    leapPointer.y = event.clientY;
    leapPointer.z = mouseDown?-10:10;
}

canvas.onmousedown = function(event){
    leapPointer.z = -10;
    mouseDown = true;
}

canvas.onmouseup = function(event){
    mouseDown = false;
}

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

//Update stage will render next frame
createjs.Ticker.addEventListener("tick", handleTick);

function handleTick() {
    //Set position of Shape instance.
    var leapPointerViewDensity = leapPointer.z;
    leapPointerViewDensity = .001 * (100 - (leapPointerViewDensity>0?leapPointerViewDensity:0));
    leapPointerViewDensity = leapPointerViewDensity > 0 ? leapPointerViewDensity : 0;

    if(leapPointer.z < 20){
        leapPointerImgHint.x = leapPointer.x;
        leapPointerImgHint.y = leapPointer.y;
        leapPointerImgHint.alpha = (leapPointer.z > 0)?(1 - leapPointer.z / 20):1;
        stage.addChildAt(leapPointerImgHint, 0);
    }else{
        stage.removeChild(leapPointerImgHint);
    }

    leapPointerImg.scaleX = leapPointerViewDensity;
    leapPointerImg.scaleY = leapPointerViewDensity;
    leapPointerImg.alpha = leapPointer.z > 0 ? 0.35 : 1;
    leapPointerImg.x = leapPointer.x - 16;
    leapPointerImg.y = leapPointer.y;

    var density = -.6 * leapPointer.z;

    if(density > 0){
        drawingSurfaceGraphics.beginFill('#101080').drawCircle(leapPointer.x, leapPointer.y, density);
    }

    document.getElementById('x').innerHTML = "<pre>" + leapPointer.x + "</pre>";
    document.getElementById('y').innerHTML = "<pre>" + leapPointer.y + "</pre>";
    document.getElementById('z').innerHTML = "<pre>" + leapPointer.z + "</pre>";

    //Update stage will render next frame
    stage.update();
}