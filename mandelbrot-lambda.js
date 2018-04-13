const max_iteration = 4096;

exports.handler = (event, context, callback) => {
    console.log(event.headers);
    let xp = Number(event.headers['x-xp']);
    let starty = Number(event.headers['x-starty']);
    let endy = Number(event.headers['x-endy']);
    let pixelWidth = Number(event.headers['x-pixelwidth']);
    
    let verticleSlice = calculateVerticalSlice(xp, starty, endy, pixelWidth);


    var response = {
        "statusCode": 200,
        "headers": {
            "my_header": "my_value"
        },
        "body": JSON.stringify(verticleSlice),
        "isBase64Encoded": false
    };
    callback(null, response);
};

function calculateVerticalSlice(xp, starty, endy, pixelWidth) {
    let verticalSlice = [];
    for (let yp = starty; yp<endy; yp=yp+pixelWidth) {
        
        let x = 0.0;
        let y = 0.0;
        let iteration = 0;
        console.log(yp + '' + iteration);
        while ((x*x + y*y) < 4 && iteration < max_iteration) {
            let xtemp = x*x - y*y + xp;
            y = 2*x*y + yp;
            x = xtemp;
            iteration++;
        }

        let color = getColour(iteration);
        verticalSlice.push(color);
    } 
    return verticalSlice;
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