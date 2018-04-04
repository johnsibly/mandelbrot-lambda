"use strict";
const max_iteration = 4096;
const localCalculation = false;
var scale = 1.0;
var centreX = -0.5;
var centreY = 0.0;
var startx = -2.5; 
var starty = -1.0; 

function writeMessage(canvas, message) {
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, 200, 30);
    context.font = '10pt Calibri';
    context.fillStyle = 'black';
    context.fillText(message, 10, 25);
}
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

function drawOnLoad() {
    var canvas = document.getElementById('canvas');
    canvas.width = 800; //1600;
    canvas.height = 400; //800;
    canvas.style.width = "800px";
    canvas.style.height = "400px";
    var context = canvas.getContext('2d')
    // context.scale(2,2)

    var elemLeft = canvas.offsetLeft,
        elemTop = canvas.offsetTop,
        elements = [];

    canvas.addEventListener('click', function(event) {
        console.log("click");

        var x = event.pageX - elemLeft,
            y = event.pageY - elemTop;

        let virt = pixelsToVirtual(x, y, startx, starty);

        centreX = virt.vx;
        centreY = virt.vy;
        scale = scale/2;

        draw();
    }, false);
    
    canvas.addEventListener('mousemove', function(evt) {
        var mousePos = getMousePos(canvas, evt);
        let x = mousePos.x;
        let y = mousePos.y;
        
        let virt = pixelsToVirtual(x, y, startx, starty);

        var message = x + ',' + y + ' / ' + virt.vx.toFixed(2) + ',' + virt.vy.toFixed(2);
        writeMessage(canvas, message);
    }, false);

    draw();
}

function draw() {
    var startTime = new Date();
    let pixelWidth = scale / 200;
    console.log('pixelWidth: ' + pixelWidth);

    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 800, 400);

        startx = centreX-(2*scale);
        let endx = (centreX+(2*scale));
        starty = (centreY-scale);
        let endy = (centreY+scale);
        let start = virtualToPixels(startx, starty, startx, starty);
        let end = virtualToPixels(endx, endy, startx, starty);

        let operations = 0;
        for (let xp = startx; xp<endx; xp=xp+pixelWidth) {
            let mappedX = virtualXtoPixelX(xp, startx);
            if (localCalculation) {
                let verticleSlice = calculateVirticalSlice(xp, starty, endy, pixelWidth);
                verticleSlice.forEach(x => {
                    ctx.fillStyle = verticleSlice.pop();
                    ctx.fillRect(mappedX, verticleSlice.length, 1, 1); 
                });
            } else {
                let xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://6a3j7a7lk0.execute-api.eu-west-2.amazonaws.com/Production/calculateSegment', true);
                
                xhr.setRequestHeader('Content-type', 'application/json');
                xhr.setRequestHeader('Accept', 'application/json');
                xhr.setRequestHeader('X-xp', xp);
                xhr.setRequestHeader('X-starty', starty);
                xhr.setRequestHeader('X-endy', endy);
                xhr.setRequestHeader('X-pixelWidth', pixelWidth);

                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        verticleSlice = JSON.parse(xhr.response.body);
                        verticleSlice.forEach(x => {
                            ctx.fillStyle = verticleSlice.pop();
                            ctx.fillRect(mappedX, verticleSlice.length, 1, 1); 
                        });
                    } else {
                        console.log('Error !');
                    }
                };
                xhr.send();
            }
        } 
    }

    var endTime = new Date();
    console.log('Load time: ' + (endTime - startTime)/1000 + 's');
}

function calculateVirticalSlice(xp, starty, endy, pixelWidth) {
    let verticleSlice = [];
    for (let yp = starty; yp<endy; yp=yp+pixelWidth) {
        let x = 0.0;
        let y = 0.0;
        let iteration = 0;
        
        while ((x*x + y*y) < 4 && iteration < max_iteration) {
            let xtemp = x*x - y*y + xp;
            y = 2*x*y + yp;
            x = xtemp;
            iteration++;
        }

        let color = getColour(iteration);
        verticleSlice.push(color);
    } 
    return verticleSlice;
}

function pixelsToVirtual(x, y, startx, starty){
    let vx = (x * scale / 200.0) + startx;
    let vy = (y * scale / 200.0) + starty;
    return {vx, vy};
}

function virtualXtoPixelX(x, startx) {
    return (200.0/scale)*(x-startx);
}

function virtualYtoPixelY(y, starty) {
    return (200.0/scale)*(y-starty);
}

function virtualToPixels(x, y, startx, starty){
    let mappedX = virtualXtoPixelX(x, startx);
    let mappedY = virtualYtoPixelY(y, starty);
    return {mappedX, mappedY};
}

function getColour(iterations){
    let r=0, g=0, b=0;
    if (iterations == max_iteration) {
        // (R,G,B) = (0, 0, 0);  /* In the set. Assign black. */
    } else if (iterations < 64) {
        r = iterations * 2; //, 0, 0);    /* 0x0000 to 0x007E */
    } else if (iterations < 128) {
        r = Math.floor((((iterations - 64) * 128) / 126) + 128); //, 0, 0);    /* 0x0080 to 0x00C0 */
    } else if (iterations < 256) {
        r= Math.floor((((iterations - 128) * 62) / 127) + 193); //, 0, 0);    /* 0x00C1 to 0x00FF */
    } else if (iterations < 512) {
        r = 255; 
        g = Math.floor((((iterations - 256) * 62) / 255) + 1); //, 0);    /* 0x01FF to 0x3FFF */
    } else if (iterations < 1024) {
        r = 255; 
        g = Math.floor((((iterations - 512) * 63) / 511) + 64); //, 0);   /* 0x40FF to 0x7FFF */
    } else if (iterations < 2048) {
        r = 255; 
        g = Math.floor((((iterations - 1024) * 63) / 1023) + 128); //, 0);   /* 0x80FF to 0xBFFF */
    } else if (iterations < 4096) {
        r = 255; 
        g = Math.floor((((iterations - 2048) * 63) / 2047) + 192); //, 0);   /* 0xC0FF to 0xFFFF */
    } else {
        r = 255; 
        g = 255;
        // (R, G, b) = (255, 255, 0);
    }
    return ["rgb(",r,",",g,",",b,")"].join("");
}
