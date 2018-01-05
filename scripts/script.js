// Global variable definitionvar canvas;
var canvas;
var gl;
var shaderProgram;

var minutesLabel;
var secondsLabel;
var totalSeconds;
var intervalID;

function setTime() {
  ++totalSeconds;
  secondsLabel.innerHTML = pad(totalSeconds % 60);
  minutesLabel.innerHTML = pad(parseInt(totalSeconds / 60));
}

function pad(val) {
  var valString = val + "";
  if (valString.length < 2) {
    return "0" + valString;
  } else {
    return valString;
  }
}

// Buffers
var policeVertexPositionBuffer;
var policeVertexNormalBuffer;
var policeVertexTextureCoordBuffer;
var policeVertexIndexBuffer;

var policeVertexPositionBuffer;
var policeVertexNormalBuffer;
var policeVertexTextureCoordBuffer;
var policeVertexIndexBuffer;

var mapVertexPositionBuffer;
var mapVertexNormalBuffer;
var mapVertexTextureCoordBuffer;
var mapVertexIndexBuffer;


var checkVertexPositionBuffer;
var checkVertexNormalBuffer;
var checkVertexTextureCoordBuffer;
var checkVertexIndexBuffer;


// Model-view and projection matrix and model-view matrix stack
var mvMatrixStack = [];
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

// Variable for storing textures
var strelaMcQuin;
var tourDeQuin;

// Variable that stores  loading state of textures.
var numberOfTextures = 4;
var texturesLoaded = 0;

// Helper variables for rotation
var carAngle = 180;
var policeAngle = 180;
var mapAngle = 180;
var checkAngle = 180;

var carRotation = 90;
var carSpeed = 0;
var carPositionX = 0;
var carPositionZ = 0;

var policeRotation = 90;
var policeSpeed = 0;
var policePositionX = 0;
var policePositionZ = 7.5;


var checkRotation= 180;
var checkStage = 0;
var checkPositionX = 0;
var checkPositionZ = 0;


var checkPointPos = {
    x: [-61, -220,  -295, -268, -172, 47,  128,  155],
    z: [-4,    50,   128,  289,  336, 310,  128,  -255],
    a: [90,   100,   170,  220,   90, 110, 180, 180]
}

var currentlyPressedKeys = {};

// Helper variable for animation
var lastTime = 0;

//
// Matrix utility functions
//
// mvPush   ... push current matrix on matrix stack
// mvPop    ... pop top matrix from stack
// degToRad ... convert degrees to radians
//
function mvPushMatrix() {
  var copy = mat4.create();
  mat4.set(mvMatrix, copy);
  mvMatrixStack.push(copy);
}

function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
    throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
}

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

//
// initGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initGL(canvas) {
  var gl = null;
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch(e) {}

  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
  return gl;
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  // Didn't find an element with the specified ID; abort.
  if (!shaderScript) {
    return null;
  }
  
  // Walk through the source element's children, building the
  // shader source string.
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) {
        shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
  
  // Now figure out what type of shader script we have,
  // based on its MIME type.
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }

  // Send the source to the shader object
  gl.shaderSource(shader, shaderSource);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
    var fragmentShader = getShader(gl, "per-fragment-lighting-fs");
    var vertexShader = getShader(gl, "per-fragment-lighting-vs");
  
  // Create the shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }

  // start using shading program for rendering
  gl.useProgram(shaderProgram);

  // store location of aVertexPosition variable defined in shader
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");

  // turn on vertex position attribute at specified position
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  // store location of vertex normals variable defined in shader
  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");

  // turn on vertex normals attribute at specified position
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  // store location of texture coordinate variable defined in shader
  shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");

  // turn on texture coordinate attribute at specified position
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  // store location of uPMatrix variable defined in shader - projection matrix 
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  // store location of uMVMatrix variable defined in shader - model-view matrix 
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  // store location of uNMatrix variable defined in shader - normal matrix 
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  // store location of uSampler variable defined in shader
  shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
  // store location of uMaterialShininess variable defined in shader
  shaderProgram.materialShininessUniform = gl.getUniformLocation(shaderProgram, "uMaterialShininess");
  // store location of uShowSpecularHighlights variable defined in shader
  shaderProgram.showSpecularHighlightsUniform = gl.getUniformLocation(shaderProgram, "uShowSpecularHighlights");
  // store location of uUseTextures variable defined in shader
  shaderProgram.useTexturesUniform = gl.getUniformLocation(shaderProgram, "uUseTextures");
  // store location of uUseLighting variable defined in shader
  shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
  // store location of uAmbientColor variable defined in shader
  shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
  // store location of uPointLightingLocation variable defined in shader
  shaderProgram.pointLightingLocationUniform = gl.getUniformLocation(shaderProgram, "uPointLightingLocation");
  // store location of uPointLightingSpecularColor variable defined in shader
  shaderProgram.pointLightingSpecularColorUniform = gl.getUniformLocation(shaderProgram, "uPointLightingSpecularColor");
  // store location of uPointLightingDiffuseColor variable defined in shader
  shaderProgram.pointLightingDiffuseColorUniform = gl.getUniformLocation(shaderProgram, "uPointLightingDiffuseColor");
}

//
// setMatrixUniforms
//
// Set the uniform values in shaders for model-view and projection matrix.
//
function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

  var normalMatrix = mat3.create();
  mat4.toInverseMat3(mvMatrix, normalMatrix);
  mat3.transpose(normalMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

//
// initTextures
//
// Initialize the textures we'll be using, then initiate a load of
// the texture images. The handleTextureLoaded() callback will finish
// the job; it gets called each time a texture finishes loading.
//
function initTextures() {
  strelaMcQuin = gl.createTexture();
  strelaMcQuin.image = new Image();
  strelaMcQuin.image.onload = function () {
    handleTextureLoaded(strelaMcQuin)
  }
  strelaMcQuin.image.src = "./assets/car1.png";

  policeMcQuin = gl.createTexture();
  policeMcQuin.image = new Image();
  policeMcQuin.image.onload = function () {
    handleTextureLoaded(policeMcQuin)
  }
  policeMcQuin.image.src = "./assets/car2.png";

  tourDeQuin = gl.createTexture();
  tourDeQuin.image = new Image();
  tourDeQuin.image.onload = function () {
    handleTextureLoaded(tourDeQuin)
  }
  tourDeQuin.image.src = "./assets/world1.png";
 
  checkPoint = gl.createTexture();
  checkPoint.image = new Image();
  checkPoint.image.onload = function () {
    handleTextureLoaded(checkPoint)
  }
  checkPoint.image.src = "./assets/check.png";

}

function handleTextureLoaded(texture) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // Third texture usus Linear interpolation approximation with nearest Mipmap selection
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.bindTexture(gl.TEXTURE_2D, null);

  // when texture loading is finished we can draw scene.
  texturesLoaded += 1;
}


function handleLoadedCar(car) {
  // Pass the normals into WebGL
  policeVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, policeVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(car.normals), gl.STATIC_DRAW);
  policeVertexNormalBuffer.itemSize = 3;
  policeVertexNormalBuffer.numItems = car.normals.length / 3;

  // Pass the texture coordinates into WebGL
  policeVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, policeVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(car.uvs), gl.STATIC_DRAW);
  policeVertexTextureCoordBuffer.itemSize = 2;
  policeVertexTextureCoordBuffer.numItems = car.uvs.length / 2;

  // Pass the vertex positions into WebGL
  policeVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, policeVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(car.vertices), gl.STATIC_DRAW);
  policeVertexPositionBuffer.itemSize = 3;
  policeVertexPositionBuffer.numItems = car.vertices.length / 3;

  // Pass the indices into WebGL
  policeVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, policeVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(car.faces), gl.STATIC_DRAW);
  policeVertexIndexBuffer.itemSize = 1;
  policeVertexIndexBuffer.numItems = car.faces.length;

  document.getElementById("loadingtext").textContent = "";
}

//
//
function handleLoadedPCar(car) {
  // Pass the normals into WebGL
  policeVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, policeVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(car.normals), gl.STATIC_DRAW);
  policeVertexNormalBuffer.itemSize = 3;
  policeVertexNormalBuffer.numItems = car.normals.length / 3;

  // Pass the texture coordinates into WebGL
  policeVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, policeVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(car.uvs), gl.STATIC_DRAW);
  policeVertexTextureCoordBuffer.itemSize = 2;
  policeVertexTextureCoordBuffer.numItems = car.uvs.length / 2;

  // Pass the vertex positions into WebGL
  policeVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, policeVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(car.vertices), gl.STATIC_DRAW);
  policeVertexPositionBuffer.itemSize = 3;
  policeVertexPositionBuffer.numItems = car.vertices.length / 3;

  // Pass the indices into WebGL
  policeVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, policeVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(car.faces), gl.STATIC_DRAW);
  policeVertexIndexBuffer.itemSize = 1;
  policeVertexIndexBuffer.numItems = car.faces.length;

  document.getElementById("loadingtext").textContent = "";
}

//
// Check Point
function handleLoadedCheckPoint(point) {
  // Pass the normals into WebGL
  checkVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, checkVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(point.normals), gl.STATIC_DRAW);
  checkVertexNormalBuffer.itemSize = 3;
  checkVertexNormalBuffer.numItems = point.normals.length / 3;

  // Pass the texture coordinates into WebGL
  checkVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, checkVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(point.uvs), gl.STATIC_DRAW);
  checkVertexTextureCoordBuffer.itemSize = 2;
  checkVertexTextureCoordBuffer.numItems = point.uvs.length / 2;

  // Pass the vertex positions into WebGL
  checkVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, checkVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(point.vertices), gl.STATIC_DRAW);
  checkVertexPositionBuffer.itemSize = 3;
  checkVertexPositionBuffer.numItems = point.vertices.length / 3;

  // Pass the indices into WebGL
  checkVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, checkVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(point.faces), gl.STATIC_DRAW);
  checkVertexIndexBuffer.itemSize = 1;
  checkVertexIndexBuffer.numItems = point.faces.length;

  document.getElementById("loadingtext").textContent = "";
}

function handleLoadedMap(map) {
  // Pass the normals into WebGL
  mapVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, mapVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(map.normals), gl.STATIC_DRAW);
  mapVertexNormalBuffer.itemSize = 3;
  mapVertexNormalBuffer.numItems = map.normals.length / 3;

  // Pass the texture coordinates into WebGL
  mapVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, mapVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(map.uvs), gl.STATIC_DRAW);
  mapVertexTextureCoordBuffer.itemSize = 2;
  mapVertexTextureCoordBuffer.numItems = map.uvs.length / 2;

  // Pass the vertex positions into WebGL
  mapVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, mapVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(map.vertices), gl.STATIC_DRAW);
  mapVertexPositionBuffer.itemSize = 3;
  mapVertexPositionBuffer.numItems = map.vertices.length / 3;

  // Pass the indices into WebGL
  mapVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mapVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(map.faces), gl.STATIC_DRAW);
  mapVertexIndexBuffer.itemSize = 1;
  mapVertexIndexBuffer.numItems = map.faces.length;

  document.getElementById("loadingtext").textContent = "";
}

//WIP
function loadMap() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/world.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedMap(JSON.parse(request.responseText));
    }
  }
  request.send();
}

function loadCar() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/car.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedCar(JSON.parse(request.responseText));
    }
  }
  request.send();
}


function loadPCar() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/carP.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedPCar(JSON.parse(request.responseText));
    }
  }
  request.send();
}


function loadCheckPoint() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/check.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedCheckPoint(JSON.parse(request.responseText));
    }
  }
  request.send();
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  // set the rendering environment to full canvas size
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  // Clear the canvas before we start drawing on it.
  //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (policeVertexPositionBuffer == null || policeVertexNormalBuffer == null || policeVertexTextureCoordBuffer == null || policeVertexIndexBuffer == null ||
  	policeVertexPositionBuffer == null || policeVertexNormalBuffer == null || policeVertexTextureCoordBuffer == null || policeVertexIndexBuffer == null ||
  	mapVertexPositionBuffer == null || mapVertexNormalBuffer == null || mapVertexTextureCoordBuffer == null || mapVertexIndexBuffer == null) {
    return;
  }
  
  // Establish the perspective with which we want to view the
  // scene. Our field of view is 45 degrees, with a width/height
  // ratio of 640:480, and we only want to see objects between 0.1 units
  // and 100 units away from the camera.
  mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1500.0, pMatrix);

  var specularHighlights = true;
  gl.uniform1i(shaderProgram.showSpecularHighlightsUniform, specularHighlights);

  // Ligthing
  //var lighting = document.getElementById("lighting").checked;
  var lighting = true;

  // set uniform to the value of the checkbox.
  gl.uniform1i(shaderProgram.useLightingUniform, lighting);

  // set uniforms for lights as defined in the document
  if (lighting) {
    gl.uniform3f(shaderProgram.ambientColorUniform,0.3, 0.3, 0.3);
    gl.uniform3f(shaderProgram.pointLightingLocationUniform, 0, -50, -20);
    gl.uniform3f(shaderProgram.pointLightingSpecularColorUniform, 0.8, 0.8, 0.8);
    gl.uniform3f(shaderProgram.pointLightingDiffuseColorUniform, 0.8, 0.8, 0.8);
  }


  // set uniform to the value of the checkbox.
  gl.uniform1i(shaderProgram.useTexturesUniform, texture != "none");

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  mat4.identity(mvMatrix);

  // setup camera position
  mat4.translate(mvMatrix, [0,0,-10]);  

  mat4.rotate(mvMatrix, -6, [1, 0, 0]);
  mat4.rotate(mvMatrix, -degToRad(carRotation), [0, 1, 0]);
  mat4.translate(mvMatrix,[-carPositionX, -0.5, -carPositionZ]);

  // draw Car

  mvPushMatrix();

  // pozicija avta
  mat4.translate(mvMatrix, [carPositionX, 0, carPositionZ]);
  //mat4.rotate(mvMatrix, degToRad(23.4), [1, 0, -1]);
  mat4.rotate(mvMatrix, degToRad(carAngle), [0, 1.2, 1.2]);
  mat4.rotate(mvMatrix, degToRad(carRotation), [0, 0, 1]);

  gl.bindTexture(gl.TEXTURE_2D, strelaMcQuin);

  gl.uniform1i(shaderProgram.samplerUniform, 0);

  // Activate shininess
  gl.uniform1f(shaderProgram.materialShininessUniform, 32);

  // Set the vertex positions attribute for the car vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, policeVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, policeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, policeVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, policeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the normals attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, policeVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, policeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the index for the vertices.
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, policeVertexIndexBuffer);
  setMatrixUniforms();

  // Draw the car
  gl.drawElements(gl.TRIANGLES, policeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  mvPopMatrix();


  //
  //
  // police draw Car

  checkPoliceCrash()
  mvPushMatrix();

  // pozicija avta
  mat4.translate(mvMatrix, [policePositionX, 0, policePositionZ]);
  //mat4.rotate(mvMatrix, degToRad(23.4), [1, 0, -1]);
  mat4.rotate(mvMatrix, degToRad(policeAngle), [0, 1.2, 1.2]);
  mat4.rotate(mvMatrix, degToRad(policeRotation), [0, 0, 1]);

  gl.bindTexture(gl.TEXTURE_2D, policeMcQuin);

  gl.uniform1i(shaderProgram.samplerUniform, 0);

  // Activate shininess
  gl.uniform1f(shaderProgram.materialShininessUniform, 32);

  // Set the vertex positions attribute for the police car vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, policeVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, policeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, policeVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, policeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the normals attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, policeVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, policeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the index for the vertices.
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, policeVertexIndexBuffer);
  setMatrixUniforms();

  // Draw the car
  gl.drawElements(gl.TRIANGLES, policeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  mvPopMatrix();
 
 
  //
  // Draw check point
  // 

  mvPushMatrix();

  checkCheckPoint();
  // pozicija točke
  //mat4.scale(mvMatrix, [5, 5, 5])
  mat4.translate(mvMatrix, [checkPointPos.x[checkStage], 0, checkPointPos.z[checkStage]]);
  mat4.rotate(mvMatrix, degToRad(checkPointPos.a[checkStage]), [0, 1, 0]);
  //mat4.rotate(mvMatrix, degToRad(checkAngle), [0, 1.2, 1.2]);
  //mat4.rotate(mvMatrix, degToRad(checkRotation), [0, 0, 1]);

  gl.bindTexture(gl.TEXTURE_2D, checkPoint);

  gl.uniform1i(shaderProgram.samplerUniform, 0);

  // Activate shininess
  gl.uniform1f(shaderProgram.materialShininessUniform, 32);

  // Set the vertex positions attribute for the checkPoint vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, checkVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, checkVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, checkVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, checkVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the normals attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, checkVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, checkVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the index for the vertices.
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, checkVertexIndexBuffer);
  setMatrixUniforms();

  // Draw the Check Point
  gl.drawElements(gl.TRIANGLES, checkVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  mvPopMatrix();

  // draw map

  mvPushMatrix();

  // pozicija mape
  mat4.scale(mvMatrix, [50, 50, 50])
  mat4.translate(mvMatrix, [0, 2, 0]);
  //mat4.rotate(mvMatrix, degToRad(23.4), [1, 0, -1]);
  mat4.rotate(mvMatrix, degToRad(mapAngle), [0, 1.2, 1.2]);
  mat4.rotate(mvMatrix, degToRad(carAngle), [1, 0, 0]);

  gl.bindTexture(gl.TEXTURE_2D, tourDeQuin);

  gl.uniform1i(shaderProgram.samplerUniform, 0);

  // Activate shininess
  gl.uniform1f(shaderProgram.materialShininessUniform, 32);

  // Set the vertex positions attribute for the map vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, mapVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, mapVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, mapVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, mapVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the normals attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, mapVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, mapVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the index for the vertices.
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mapVertexIndexBuffer);
  setMatrixUniforms();

  // Draw the map
  gl.drawElements(gl.TRIANGLES, mapVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  mvPopMatrix();
}

//
// animate
//
// Called every time before redeawing the screen.
//
function animate() {
  var timeNow = new Date().getTime();
  if (lastTime != 0) {
    var elapsed = timeNow - lastTime;

    carPositionX += Math.sin(degToRad(carRotation)) * carSpeed;
    carPositionZ += Math.cos(degToRad(carRotation)) * carSpeed;

    policePositionX += Math.sin(degToRad(policeRotation)) * policeSpeed;
    policePositionZ += Math.cos(degToRad(policeRotation)) * policeSpeed;

    // rotate the car for a small amount
    //carAngle += 0.01 * elapsed;
  }
  lastTime = timeNow;
}

//
// start
//
// Called when the canvas is created to get the ball rolling.
// Figuratively, that is. There's nothing moving in this demo.
//
function start() {
  canvas = document.getElementById("glcanvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.getElementsByClassName("end")[0].style.display = "none";

  gl = initGL(canvas);      // Initialize the GL context
  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);                      // Set clear color to black, fully opaque
    gl.clearDepth(1.0);                                     // Clear everything
    gl.enable(gl.DEPTH_TEST);                               // Enable depth testing
    gl.depthFunc(gl.LEQUAL);                                // Near things obscure far things

    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.
    initShaders();
    
    // Next, load and set up the textures we'll be using.
    initTextures();
    loadMap();
    loadCar();
    loadPCar();
    loadCheckPoint();
    
    document.onkeydown = handleKeyDown;
	  document.onkeyup = handleKeyUp;
   
    minutesLabel = document.getElementById("minutes");
    secondsLabel = document.getElementById("seconds");
    totalSeconds = 0;
    intervalID = setInterval(setTime, 1000);




    // Set up to draw the scene periodically.
    setInterval(function() {
      if (texturesLoaded == numberOfTextures) { // only draw scene and animate when textures are loaded.
        requestAnimationFrame(animate);
        handleKeys();
        drawScene();
      }
    }, 15);
  }
}

function checkCheckPoint(){
  //console.log('car x:'+ carPositionX + 'z:' + carPositionZ + ' Point ' + checkPointPos.x[checkStage] + ' ' + checkPointPos.z[checkStage])
  if (carPositionX-checkPointPos.x[checkStage] > -1.4 && carPositionX-checkPointPos.x[checkStage] < 1.4 &&
      carPositionZ-checkPointPos.z[checkStage] > -1.4 && carPositionZ-checkPointPos.z[checkStage] < 1.4){
    checkStage++;
  }

  if (checkStage == 8){
    clearInterval(intervalID);
    document.getElementsByClassName("end-text")[0].innerHTML = "You won!<br><br>Press P to play again<br><br>Your time was " + minutesLabel.innerHTML + ":" + secondsLabel.innerHTML;
    document.getElementsByClassName("end")[0].style.display = "block";
  }

}

function checkPoliceCrash(){
  if (carPositionX-policePositionX > -2 && carPositionX-policePositionX < 2 &&
      carPositionZ-policePositionZ > -2 && carPositionZ-policePositionZ < 2){
      clearInterval(intervalID);
      document.getElementsByClassName("end-text")[0].innerHTML = "Busted!<br><br>Press P to play again<br><br>Your time was " + minutesLabel.innerHTML + ":" + secondsLabel.innerHTML;
      document.getElementsByClassName("end")[0].style.display = "block";
  }
}

function handleKeys() {
  if (currentlyPressedKeys[80]) { 
    location.reload(); 
  }

    //DK Donky Kong
    if (currentlyPressedKeys[32]) { 
      if (currentlyPressedKeys[37]) {
        // LEFT
        carRotation += 3;
     }
      if (currentlyPressedKeys[39]) {
          // RIGHT
          carRotation -= 3;
      }
      if (carSpeed < 0)
        carSpeed += 0.05;
    }


    if (currentlyPressedKeys[38]) {
       // console.log(carSpeed);
        // UP
        if(30 < -carSpeed*50 && -carSpeed*50 < 100) {
          carSpeed += -0.01;
          policeSpeed += -0.01;
          g.refresh((-carSpeed*50).toFixed(0));
        }
        // UP
        if(-carSpeed*50 <= 30) {
          carSpeed += -0.03;
          policeSpeed += -0.05;
          g.refresh((-carSpeed*50).toFixed(0));
        }

        if (currentlyPressedKeys[78]) {
          // NITRIO
          if(-carSpeed*50 <= 146 && nitro.config.value > 0) {
            carSpeed -= 0.05;
            nitro.refresh(nitro.config.value-1);
            policeSpeed += 0.01;
            g.refresh((-carSpeed*50).toFixed(0));
          }
        } else {
          if (-carSpeed*50 > 100){
            carSpeed += 0.01;
            policeSpeed += 0.01;
            g.refresh((-carSpeed*50).toFixed(0));
          }
        }
      
      if(nitro.config.value < 100) {
        nitro.refresh(nitro.config.value+=0.05);
      }
    }
    if (currentlyPressedKeys[40]) {
        // DOWN
        if(carSpeed*50 <= 20) {
          carSpeed += 0.01;
          policeSpeed += 0.01;
          g.refresh((carSpeed*50).toFixed(0));
        }
    }
    if (currentlyPressedKeys[37]) {
        // LEFT
        carRotation++;
        policeRotation++;
    }
    if (currentlyPressedKeys[39]) {
        // RIGHT
        carRotation--;
        policeRotation--;
    }
}

function handleKeyDown(event) {
  	currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
    if(event.keyCode == 38 || event.keyCode == 40) {
      carSpeed = 0;
      policeSpeed = 0;
      
      g.refresh((-carSpeed*50).toFixed(0));
    }
}