/*
Written by: Nicholas Cockcroft
Date: April 19, 2018
Course: Computer Graphics
Assignment: Lab4

Description: Using the fragment shader with ambient, diffuse, and specular lighting
to create interactive controls which allow the user to see the effects of tuning/manipulating
the parameters of the lighting models in real time.

*/

"use strict";

var canvas;
var gl;
var program;

// sets the number of times the circle should be divided in order to create a crisper image
var numTimesToSubdivide = 6;

var index = 0;

var pointsArray = [];
var normalsArray = [];


// Variables used for the setting the position of the camera
var near = -10;
var far = 10;
var radius = 1.5;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;
var left = -3.0;
var right = 3.0;
var ytop =3.0;
var bottom = -3.0;

// Initialization points for circle
var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);


// Used for different lighting controls
var lightPosition = vec4(1.0, 1.0, 1.0, 1.0 );
var lightAmbient = vec4(0.5, 0.5, 0.5, 1.0 );
var lightDiffuse = vec4( 0.5, 0.5, 0.5, 1.0 );
var lightSpecular = vec4( 0.5, 0.5, 0.5, 1.0 );

var materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialDiffuse = vec4( 0.8, 0.8, 0.8, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 20.0;

var ctm;
var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var normalMatrix, normalMatrixLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var use_flat = true;

// Intialize these products as global so they can be changed in
// the main function as well as render
var ambientProduct; // Changed
var diffuseProduct;
var specularProduct;


function triangle(a, b, c) {

     // Since the circle is centered at (roughly) 0, 0, 0, the
     // true normal vector is simply the same as the point - but with 0
     // as it's fourth component rather than 1.
     normalsArray.push(a[0],a[1], a[2], 0.0);
     normalsArray.push(b[0],b[1], b[2], 0.0);
     normalsArray.push(c[0],c[1], c[2], 0.0);

     pointsArray.push(a);
     pointsArray.push(b);
     pointsArray.push(c);

     index += 3;
}

// Keep subdividing the triangles to form a more precise circle
function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {

        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        triangle( a, b, c );
    }
}

// Starts the initial call to make the circle
function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

// *************** Main ***************
window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );


    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);


    // Create circle object
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    // Create a normalized buffer and link it to "vNormal" in html code
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);


    // Create a buffer for the points of circle and link them to "vPosition"
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );

    // Pass the locations of the uniform variables for ambient, diffuse, specular,
    // lighting, and shininess to the vertex shader
    gl.uniform4fv( gl.getUniformLocation(program,
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program,
       "shininess"),materialShininess );

    render();
}

// Whenever the user presses a key, this is where it is handled
window.onkeypress = function(event) {
  var key = String.fromCharCode(event.keyCode);

  switch(key) {
    case 'X':
      lightPosition[0] += 0.1;
      gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
      break;

    case 'x':
      lightPosition[0] -= 0.1;
      gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
      break;

    case 'Y':
      lightPosition[1] += 0.1;
      gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
      break;

    case 'y':
      lightPosition[1] -= 0.1;
      gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
      break;
    case 'Z':
      lightPosition[2] += 0.1;
      gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
      break;

    case 'z':
      lightPosition[2] -= 0.1;
      gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
      break;

    case 'S':
      // Shininess can not be above 30
      if(materialShininess < 29) {
        materialShininess += 1;
        gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
      }
      break;

    case 's':
      // Shininess can not be be below 0
      if(materialShininess > 1) {
        materialShininess -= 1;
        gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
      }
      break;
  }
}

// Updates the material ambient based on what value the user set it to
// and update the ambientProduct by sending it over using uniform
function updateMaterialAmbient(jscolor) {
  materialAmbient = hex2vec4(jscolor);
  ambientProduct = mult(lightAmbient, materialAmbient);
}

// Converts the hexadecimal color value from jscolor to a vec4 color value WebGL can use
function hex2vec4(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? vec4(parseInt(result[1], 16)/255,

    parseInt(result[2], 16)/255,

    parseInt(result[3], 16)/255)

    : null;
}


function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set the eye of the camera to be looking at the circle
    eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

    // Gets the matrix of where the camera should look at an applies it before the model transformation
    modelViewMatrix = lookAt(eye, at, up);

    // Apply the proper scaling and translating to the image depending on the camera
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];

    // Toggling the ambient product on and off
    var ambientToggle = document.getElementById("ambient").checked ? ambientProduct : vec4(0.0, 0.0, 0.0, 1.0);
    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"), flatten(ambientToggle));

    // Toggle the diffuse product on or off
    var diffuseToggle = document.getElementById("diffuse").checked ? diffuseProduct : vec4(0.0, 0.0, 0.0, 1.0);
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseToggle));

    // Toggling the specular product on or off
    var specularToggle = document.getElementById("specular").checked ? specularProduct : vec4(0.0, 0.0, 0.0, 1.0);
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"), flatten(specularToggle));


    // Send the modelView, projection, and normal matrices locations to vertex shader
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );



    // For every three points, draw a triangle
    for( var i=0; i<index; i+=3)
        gl.drawArrays( gl.TRIANGLES, i, 3 );

    window.requestAnimFrame(render);
}
