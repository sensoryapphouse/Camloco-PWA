window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }
    camStart();
}

// Override the function with all the posibilities
navigator.getUserMedia ||
    (navigator.getUserMedia = navigator.mozGetUserMedia ||
    navigator.webkitGetUserMedia || navigator.msGetUserMedia);

var gl;
var canvas;
var Param1 = 0.0;
var Param2 = 0.0;
var Param3 = 0.5;
var mouseX = 0.5;
var mouseY = 0.5;
var audioContext;
var audioInput = null,
realAudioInput = null,
inputPoint = null;
var rafID = null;
var smoothMax = 0;
var scaleMax = 0;
var max = 0;
var frication = 0;
var settings;
var panel;
var panelvisible = false;
var nAgt = navigator.userAgent;
var splash;
var btnBack;
var btnNext;
var svgpanel;
var paper;
var initialiseSVGelements = 1;
var elementList = [];
var imageList = [];
var styles = [[3,4,3,4,3,5,2,1,2,1,2,1,2,1],[2,2,3,4,5,6,7,8,8,8,8,8],[5,5,5,5,5,5,5,5,5,5,5,5,5,5],[5,5,5,5,5,5,5,5,5,5,5,5,5,5],[5,2,3,5,3,6,2,6,2,6,1,2,3,4,6,6,6,6,6,6],[6,7,6,7,6,7,6,7,6,7,6,7],[8,8,8,8,8,8,8,8,8,8,8,8,8],[8,8,8,8,8,8,8,8,8,8,8,8,8]]; // 8 x [14,11,13,13,20,11,6,14]

var doing9x9 = 0;
var index = 0;
var bars = 50;
var imageNo = 0;
var style = 5; // 0 = nothing, 1-4 =spectrum display (50, 20, 8, 5), 5 = graphics equaliser (5x8 bottom 5 of 8 green, 3 top red), 6 = red green and blue lights at bottom of screen, 7 = a light in each corner of the screen,

var audiorunning = false;
var nextIndex = -1;
function convertToMono( input ) {
  var splitter = audioContext.createChannelSplitter(2);
  var merger = audioContext.createChannelMerger(2);

  input.connect( splitter );
  splitter.connect( merger, 0, 0 );
  splitter.connect( merger, 0, 1 );
  return merger;
}

function cancelAnalyserUpdates() {
  window.cancelAnimationFrame( rafID );
  rafID = null;
}

var scale;
var numBars;
var SPACING;
var BAR_WIDTH;

function CalcBars() {
  SPACING = svgpanel.clientWidth/(1.6*bars); // divisor is 1.6 x the actual number of bars
  BAR_WIDTH = SPACING*.8;
  numBars = Math.round(svgpanel.clientWidth / SPACING);
}

var SpectrumVisible = 1;
function ToggleSpectrum() {
  SpectrumVisible = 1-SpectrumVisible;
  if (SpectrumVisible == 0)
  for (var i = 0; i < elementList.length; i++)
    elementList[i].hide();
  else
  for (var i = 0; i < elementList.length; i++)
    elementList[i].show();
}

function InitialiseBandpass() {
  CalcBars();
  for (var i = 0; i < bars; i++) {
  var s = (i*160+20)/numBars;
  elementList[i] = paper.rect(s + "%", "50%", (120/numBars) + "%", "110%","1%");
  var color = Raphael.hsl(Math.round(i*540)/numBars, 100, 50);
  elementList[i].attr("fill", color);
  elementList[i].attr("stroke", color);
  elementList[i].attr("opacity",0.5);
//      elementList[i].blur(1.0);
  }
}

var update = 1;
function updateAnalysers(time) {
  var previous = 0;
  var tmp;
  var f = 0;
  var smoothMag = 0;
  max = 0;

  if (update < 1) { // only update every 2rd time
      rafID = window.requestAnimationFrame( updateAnalysers );
      update++;
      return;
  }
  update = 0;
  var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

  analyserNode.getByteFrequencyData(freqByteData); // frequency data

  var multiplier = Math.floor(analyserNode.frequencyBinCount / 6);
  var magnitude = 0;
        // gotta sum/average the block, or we miss narrow-bandwidth spikes
  for (var j = 0; j< multiplier; j++)
    magnitude += freqByteData[j];
  Param1 = magnitude / (multiplier*2.55);
  magnitude = 0;
  for (var j = multiplier; j< 3*multiplier; j++)
    magnitude += freqByteData[j];
  Param2 = magnitude / (multiplier*2*2.55);
  magnitude = 0;
  for (var j = multiplier*3; j< multiplier*6; j++)
    magnitude += freqByteData[j];
  Param3 = magnitude / (multiplier*4*2.55);

  if (initialiseSVGelements == 1) {
    initialiseSVGelements = 0;
    // if (elementList.length > 0) // make sure list is empty
    //   elementList.splice(0,elementList.length);
    switch (style) { // 0 = nothing, 1-4 = spectrum display (50, 20, 8, 5), 5 = graphics equaliser (5x8 bottom 5 of 8 green, 3 top red), 6 = red green and blue lights at bottom of screen, 7 = a light in each corner of the screen

      case 0 :
         break;
      case 1:
       bars = 50;
       InitialiseBandpass();
       break;
      case 2:
        bars = 20;
        InitialiseBandpass()
        break;
      case 3:
        bars = 8;
        InitialiseBandpass()
        break;
      case 4:
        bars = 5;
        InitialiseBandpass()
        break;
      case 5:
        bars = 8;
          CalcBars();
        for (var i = 0; i < 8; i++) {
          for (var j = 0; j < 8; j++) {
          var s = 2.5+((j)*12);
          var s1 = 45+(7-i)*7;
          elementList[i*8 + j] = paper.rect(s + "%", s1 + "%", "10%", "5%","1%");
          if (i > 4)
            elementList[i*8 + j].attr("fill", "red");
          else
            elementList[i*8 + j].attr("fill", "green");

          elementList[i*8 + j].attr("opacity",0.5);
          }
        }
        break;
      case 6:
        bars = 3;
        CalcBars();
        elementList[0] = paper.ellipse("25%", "80%", "10%","10%");
        elementList[0].attr("fill", "red");
        elementList[0].attr("stroke", "red");
        elementList[0].attr("opacity",0.4);
        elementList[1] = paper.ellipse("50%", "80%", "10%","10%");
        elementList[1].attr("fill", "green");
        elementList[1].attr("stroke", "green");
        elementList[1].attr("opacity",0.5);
        elementList[2] = paper.ellipse("75%", "80%", "10%","10%");
        elementList[2].attr("fill", "yellow");
        elementList[2].attr("stroke", "yellow");
        elementList[2].attr("opacity",0.5);
        break;
      case 7:
        bars = 4;
        CalcBars();
        elementList[0] = paper.ellipse("35%", "30%", "10%","10%");
        elementList[0].attr("fill", "red");
        elementList[0].attr("stroke", "red");
        elementList[0].attr("opacity",0.4);
        elementList[1] = paper.ellipse("65%", "30%", "10%","10%");
        elementList[1].attr("fill", "green");
        elementList[1].attr("stroke", "green");
        elementList[1].attr("opacity",0.4);
        elementList[2] = paper.ellipse("35%", "75%", "10%","10%");
        elementList[2].attr("fill", "yellow");
        elementList[2].attr("stroke", "yellow");
        elementList[2].attr("opacity",0.3);
        elementList[3] = paper.ellipse("65%", "75%", "10%","10%");
        elementList[3].attr("fill", "blue");
        elementList[3].attr("stroke", "blue");
        elementList[3].attr("opacity",0.4);
        break;
    }

    if (imageList.length == 0) {
      imageList[0] = paper.image("/images/black.png", 0,0,"33%","33%").toBack();
      imageList[1] = paper.image("/images/black.png", "33%",0,"34%","33%").toBack();
      imageList[2] = paper.image("/images/black.png", "67%",0,"33%","33%").toBack();

      imageList[3] = paper.image("/images/black.png", 0,"33%","33%","33%").toBack();
      imageList[4] = paper.image("/images/black.png", "33%","33%","34%","33%").toBack();
      imageList[5] = paper.image("/images/black.png", "67%","33%","33%","33%").toBack();

      imageList[6] = paper.image("/images/black.png", 0,    "66%","33%","34%").toBack();
      imageList[7] = paper.image("/images/black.png", "33%","66%","34%","34%").toBack();
      imageList[8] = paper.image("/images/black.png", "67%","66%","33%","34%").toBack();
      if (doing9x9 == 0)
        for (var i = 0; i < 9; i++) {
          imageList[i].hide();
          imageList[i].attr("opacity", .5);
        }
      }
    // imageList[1].attr("opacity", 1.0); // to do ghosting
//    paper.image("/images/black.png", 0,0,"100%","100%").toBack();
  }
  switch (style) { // 0 = nothing, 1-4 = spectrum display (50, 20, 8, 5), 5 = graphics equaliser (5x8 bottom 5 of 8 green, 3 top red), 6 = red green and blue lights at bottom of screen, 7 = a light in each corner of the screen
      case 0 :
         break;
      case 1:
      case 2:
      case 3:
      case 4:
        var multiplier = analyserNode.frequencyBinCount / (numBars*1.6);
        for (var i = 0; i < bars; ++i) {
          var magnitude = 0;
          var offset = Math.floor( i * multiplier );
          // gotta sum/average the block, or we miss narrow-bandwidth spikes
         for (var j = 0; j< multiplier; j++)
              magnitude += freqByteData[offset + j];
          magnitude = magnitude / (multiplier*2.55);
          smoothMag = Math.max(0, Math.min((smoothMag+magnitude)/2, 100));
          smoothMag = (smoothMag+magnitude)/2;
          elementList[i].attr("y", 100-smoothMag + "%");
        }
        break;
      case 5:
        var multiplier = analyserNode.frequencyBinCount / (numBars*1.6);
        var values = [];
        for (var i = 0; i < bars; ++i) {
          var magnitude = 0;
          var offset = Math.floor( i * multiplier );
          // gotta sum/average the block, or we miss narrow-bandwidth spikes
          for (var j = 0; j< multiplier; j++)
              magnitude += freqByteData[offset + j];
          magnitude = magnitude / (multiplier*5);
          for (var j = 0; j < 8; j++) {
             if (magnitude > (j+1)*5 - i/2) // non linear as treble response seems lower
               elementList[i+ 8*j].attr("opacity", 1);
             else
               elementList[i+ 8*j].attr("opacity", 0.3);
 //         elementList[(7-j)*8 + i].attr("opacity", j/10);
          }
        }
        break;
      case 6:
        var multiplier = analyserNode.frequencyBinCount / (numBars*1.6);
        var values = [];
        for (var i = 0; i < bars; ++i) {
          var magnitude = 0;
          var offset = Math.floor( i * multiplier );
          for (var j = 0; j< multiplier; j++)
              magnitude += freqByteData[offset + j];
          magnitude = magnitude / (multiplier*10);
          elementList[i].attr("rx", 5+magnitude + "%");
          elementList[i].attr("ry", 5+magnitude + "%");
        }
        break;
      case 7:
        var multiplier = analyserNode.frequencyBinCount / (numBars*1.6);
        var values = [];
        for (var i = 0; i < bars; ++i) {
          var magnitude = 0;
          var offset = Math.floor( i * multiplier );
          for (var j = 0; j< multiplier; j++)
              magnitude += freqByteData[offset + j];
          magnitude = magnitude*2 / (multiplier*2.55);
          elementList[i].attr("rx", 5+magnitude/(bars) + "%");
          elementList[i].attr("ry", 10+magnitude/(bars) + "%");
        }
        break;
      case 8: // sin waves for bass middle and treble
        break;
      }

//   if (doing9x9 > 0) {
// //    imageList[imageNo].attr("src", im);
     imageList[4].attr("src", canvas.toDataURL("image/jpeg"));
//     imageNo++;
//     if (imageNo > 8)
//       imageNo = 0;
//     im = canvas.toDataURL("image/jpeg"); //canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")//
//   }

  rafID = window.requestAnimationFrame( updateAnalysers );

  progress.value = smoothMax;
}

var Timer9x9;
function Grid9x9() {
    imageList[imageNo].attr("src", canvas.toDataURL("image/jpeg"));
    imageNo++;
    if (imageNo == 4)
      imageNo++;
    if (imageNo > 8)
      imageNo = 0;
}

function initGL() {
  try {
    gl = canvas.getContext("experimental-webgl",{preserveDrawingBuffer: true});
  } catch (e) {
  }
  if (!gl) {
    alert("Could not initialise WebGL, sorry :-(");
  }
}


function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) {
    return null;
  }

  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      str += k.textContent;
    }
    k = k.nextSibling;
  }

  var shader;
  if (shaderScript.type == "f") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "v") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

var programsArray = new Array();
var current_program;

function initShaders() {
  programsArray.push(createProgram("shader-vs", "shader-1-fs"));
  programsArray.push(createProgram("shader-vs", "shader-2-fs"));
  programsArray.push(createProgram("shader-vs", "shader-3-fs"));
  programsArray.push(createProgram("shader-vs", "shader-4-fs"));
  programsArray.push(createProgram("shader-vs", "shader-5-fs"));
  programsArray.push(createProgram("shader-vs", "shader-6-fs"));
  programsArray.push(createProgram("shader-vs", "shader-7-fs"));
  programsArray.push(createProgram("shader-vs", "shader-8-fs"));
  current_program = programsArray[0];
}

function createProgram(vertexShaderId, fragmentShaderId) {
  var shaderProgram;
  var fragmentShader = getShader(gl, fragmentShaderId);
  var vertexShader = getShader(gl, vertexShaderId);

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "texture0");
  shaderProgram.resolutionUniform = gl.getUniformLocation(shaderProgram, "resolution");
  shaderProgram.mouse = gl.getUniformLocation(shaderProgram, "mouse");
  shaderProgram.indexUniform = gl.getUniformLocation(shaderProgram, "index");
  shaderProgram.time = gl.getUniformLocation(shaderProgram, "time");
  shaderProgram.Param1 = gl.getUniformLocation(shaderProgram, "Param1");
  shaderProgram.Param2 = gl.getUniformLocation(shaderProgram, "Param2");
  shaderProgram.Param3 = gl.getUniformLocation(shaderProgram, "Param3");
  return shaderProgram;
}

var webcam;
var texture;

function initTexture() {
  texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

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

var ix = 0;
var frame_num = 0.0;
var end;
var st = new Date().getTime();
function setUniforms() {
  end = new Date().getTime();
  gl.uniformMatrix4fv(current_program.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(current_program.mvMatrixUniform, false, mvMatrix);
  gl.uniform2f(current_program.resolutionUniform, canvas.width, canvas.height);
  gl.uniform2f(current_program.mouse, mouseX, mouseY);
  gl.uniform1i(current_program.indexUniform, ix);
//        gl.uniform1f(current_program.time, performance.now()/1000.0);
  gl.uniform1f(current_program.time, ((end-st) % 1000000)/1000.0);
  gl.uniform1f(current_program.Param1, Param1);
  gl.uniform1f(current_program.Param2, Param2);
  gl.uniform1f(current_program.Param3, Param3);
}

var cubeVertexPositionBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;
function initBuffers() {
  cubeVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  vertices = [-1.0, -1.0, 1.0, -1.0, 1.0,  1.0, -1.0,  1.0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  cubeVertexPositionBuffer.itemSize = 2;
  cubeVertexPositionBuffer.numItems = 4;

  cubeVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  var textureCoords = [0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0 ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
  cubeVertexTextureCoordBuffer.itemSize = 2;
  cubeVertexTextureCoordBuffer.numItems = 4;

  cubeVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  var cubeVertexIndices = [0, 1, 2,      0, 2, 3];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
  cubeVertexIndexBuffer.itemSize = 1;
  cubeVertexIndexBuffer.numItems = 6;
}

function drawScene() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.ortho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0, pMatrix);

  gl.useProgram(current_program);
  mat4.identity(mvMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  gl.vertexAttribPointer(current_program.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  gl.vertexAttribPointer(current_program.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, webcam);
  gl.uniform1i(current_program.samplerUniform, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  setUniforms();
  gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  gl.bindTexture(gl.TEXTURE_2D, null);
}


var old_time = Date.now();

function tick() {
    requestAnimFrame(tick);
    drawScene();
}

function webGLStart() {

  canvas = document.getElementById("webgl-canvas");
  canvas.width = 512;
  canvas.height = 512;
  initGL();
  initShaders();
  initBuffers();
  initTexture();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  tick();
}

var ixMax = 11;
function ixCount(i)
{
  switch (i)
  {
  case 1 : return 13;
    break;
  case 2 : return 11;
    break;
  case 3 : return 13;
    break;
  case 4 : return 14;
    break;
  case 5 : return 20;
    break;
  case 6 : return 11;
    break;
  case 7 : return 12;
    break;
  case 8 : return 6;
    break;
  }

}
var effectSet = 0;
function processing_changer() {

}

function slideTo(el, left) {
  var steps = 10;
  var timer = 25;
  var elLeft = parseInt(el.style.left) || 0;
  var diff = left - elLeft;
  var stepSize = diff / steps;
  console.log(stepSize, ", ", steps);

  function step() {
    elLeft += stepSize;
    el.style.left = elLeft + "vw";
    if (--steps) {
        setTimeout(step, timer);
    }
  }
  step();
}


StoreValue = function (key, value) {
  if (window.localStorage) {
   window.localStorage.setItem(key, value);
  }
};

RetrieveValue = function(key, defaultValue) {
  var got;
  try {
   if (window.localStorage) {
     got = window.localStorage.getItem(key);
     if (got === 0) {
      return got;
     }
     if (got === "") {
      return got;
     }
     if (got) {
      return got;
     }
     return defaultValue;
   }
   return defaultValue;
  } catch (e) {
   return defaultValue;
  }
};

function PressBack(){
  panel.hidden = false;
  settings.hidden = false;
  splash.hidden = false;
  button.hidden = false;
  button1.hidden = false;
  button2.hidden = false;
  button3.hidden = false;
  button4.hidden = false;
  button5.hidden = false;
  button6.hidden = false;
  button7.hidden = false;
  btnBack.hidden = true;
  btnNext.hidden = true;
  cancelAnalyserUpdates();
}

function SetStyle() {
  ClearElements();
  initialiseSVGelements = 1;
  style = styles[index-1][ix];
}

function PressNext() {
  ix = ix+1;
  if (ix > ixMax)
	  ix=0;
  SetStyle();
}

function NextSet() {
  if (index >= 8)
    index = 1;
  Action(index+1);
}

function PressPrevious() { // no button
  ix = ix-1;
  if (ix <0)
	  ix=ixMax;
}

function TakePicture() {
  if (nAgt.indexOf('Chrome') != -1) { // got Chrome
    var link = document.createElement('a');
    link.download = "ClubCam.jpg";
    link.href = canvas.toDataURL("image/jpeg");
    link.click();
  }
  else {
  // Canvas2Image.saveAsJPEG(canvas, canvas.width, canvas.height);
    var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.
    window.location.href=image; // it will save locally
  }
}

function ClearElements() {
  for (i = 0; i < elementList.length; i++)
    elementList[i].remove();
}

var doneInit = 0;
function Action(i){
    nextIndex = i;
    if (doneInit == 0) {
        webcam = document.createElement('video'); //getElementById('webcam');
        navigator.getUserMedia({video: true, audio: true}, onSuccess, onError);
        doneInit = 1;
    }
  index = i;
  ix = 0;
  panel.hidden = true;
  panel.style.left = "130vw";
  panelvisible = false;
  settings.hidden = true;
  settings.style.left = "92vw";
  splash.hidden = true;
  button.hidden = true;
  button1.hidden = true;
  button2.hidden = true;
  button3.hidden = true;
  button4.hidden = true;
  button5.hidden = true;
  button6.hidden = true;
  button7.hidden = true;
  btnBack.hidden = false;
  btnNext.hidden = false;

  SetStyle();
  initialiseSVGelements = 1;
  // clearDisplay = 1;

  // volumeList.length = 0;
  // colorList.length = 0;
  // analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
  // aspect = canvasHeight/canvasWidth;
  switch (i)
  {
    case 1:
      effectsSet = 1;
  		ixMax=ixCount(effectsSet);
  		current_program = programsArray[0];
  		break;
    case 2:
      effectsSet = 2;
  		ixMax=ixCount(effectsSet);
  		current_program = programsArray[1];
  		break;
    case 3:
      effectsSet = 3;
  		ixMax=ixCount(effectsSet);
  		current_program = programsArray[2];
  		break;
    case 4:
      effectsSet = 4;
  		ixMax=ixCount(effectsSet);
  		current_program = programsArray[3];
  		break;
    case 5:
      effectsSet = 5;
  		ixMax=ixCount(effectsSet);
  		current_program = programsArray[4];
  		break;
    case 6:
      effectsSet = 6;
  		ixMax=ixCount(effectsSet);
  		current_program = programsArray[5];
  		break;
    case 7:
      effectsSet = 7;
  		ixMax=ixCount(effectsSet);
  		current_program = programsArray[6];
  		break;
    case 8:
      effectsSet = 8;
  		ixMax=ixCount(effectsSet);
  		current_program = programsArray[7];
  		break;
   }
   updateAnalysers();
}

var mouseState = 0;
function MonitorMouseDown(e) {
  if (!e) e=window.event;
    if (e.button == 0) {
        	mouseState = 1;
        	mouseX = e.clientX/canvas.scrollWidth;
 			mouseY = 1.0-e.clientY/canvas.scrollHeight;
 			direction = 1-direction;
     }
  return false;
}
function MonitorMouseUp(e) {
  if (!e) e=window.event;
    if (e.button == 0) {
        mouseState = 0;
     }
  return false;
}

// function gotSources(sourceInfos) {
// for (var i = 0; i != sourceInfos.length; ++i) {
//     var sourceInfo = sourceInfos[i];
//     var option = document.createElement("option");
//     console.log("got source");
//     option.value = sourceInfo.id;
//     if (sourceInfo.kind === 'audio') {
// //      option.text = sourceInfo.label || 'microphone ' + (audioSelect.length + 1);
// //      audioSelect.appendChild(option);
//   console.log('Audio.');
//     } else if (sourceInfo.kind === 'video') {
// //      option.text = sourceInfo.label || 'camera ' + (videoSelect.length + 1);
//   console.log('Webcam.');
// //      camList[camList.length] == sourceInfo.id;
// //      videoSelect.appendChild(option);
//     } else {
//       console.log('Some other kind of source: ', sourceInfo);
//     }
//   }
// }


// if (typeof MediaStreamTrack === 'undefined'){
// // alert('This browser does not support MediaStreamTrack.\n\nTry Chrome.');
// } else {
//   MediaStreamTrack.getSources(gotSources);
// }

var videoSource;
function camStart() {

  splash  = document.querySelector('splash');
  button = document.querySelector('button');
  button1 = document.querySelector('button1');
  button2 = document.querySelector('button2');
  button3 = document.querySelector('button3');
  button4 = document.querySelector('button4');
  button5 = document.querySelector('button5');
  button6 = document.querySelector('button6');
  button7 = document.querySelector('button7');
  btnBack = document.querySelector('back');
  btnNext = document.querySelector('next');
  svgpanel = document.querySelector('svgpanel');
  var nAgt = navigator.userAgent;
  settings = document.querySelector('settings');
  panel = document.querySelector('panel');

  btnBack.onclick = function(e) {
    PressBack();
  }

  btnNext.onclick = function(e) {
    PressNext();
  }

  button.onmousedown = function(e) {
   	Action(1);
  }
  button1.onmousedown = function(e) {
   	Action(2);
  }
  button2.onmousedown = function(e) {
   	Action(3);
  }
  button3.onmousedown = function(e) {
   	Action(4);
  }
  button4.onmousedown = function(e) {
   	Action(5);
  }
  button5.onmousedown = function(e) {
   	Action(6);
  }
  button6.onmousedown = function(e) {
   	Action(7);
  }
  button7.onmousedown = function(e) {
   	Action(8);
  }
  panel.style.left = "130vw";
  slideTo(panel, 130);
  settings.style.left = "91vw";
  splash.onclick = function(e) {
    splash.style.backgroundImage="url(images/menu.jpg)";
    splash.style.zIndex = 995;
//    splash.hidden = true;
  }
  window.setTimeout(function() {splash.style.backgroundImage="url(images/menu.jpg)"; splash.style.zIndex = 995;}, 2500); // hide Splash screen after 2.5 seconds
  button.onclick=function(e){

  }

  progress.style.position = "absolute";
  progress.style.height = "1vh";
  progress.style.width = "12vw";
  progress.style.left = "6.5vw";
  progress.style.top = "18vh";

  vol1 = document.createElement("INPUT");
  vol1.setAttribute("type", "range");
  vol1.style.position = "absolute";
  vol1.style.height = "8vh";
  vol1.style.width = "12vw";
  vol1.style.left = "6.5vw";
  vol1.style.top = "10vh";
  vol1.value = 25;
  vol1.min = 1;

  vol2 = document.createElement("INPUT");
  vol2.setAttribute("type", "range");
  vol2.style.position = "absolute";
  vol2.style.height = "8vh";
  vol2.style.width = "12vw";
  vol2.style.left = "6.5vw";
  vol2.style.top = "19vh";
  vol2.value = 75;
  vol2.min = 1;

  panel.appendChild(vol1);
  panel.appendChild(vol2);
  panel.appendChild(progress);

  if (nAgt.indexOf('Chrome') != -1) {
    chrome.storage.local.get(null, function (result) { // recover stored value
      if (result.vol1 == undefined) { // initial set up after first loaded
        vol1.value = 1;
        vol2.value = 50;
      }
      else {
        vol1.value = result.vol1;
        vol2.value = result.vol2;
      }
    });
  }
  else {
    vol1.value = RetrieveValue("vol1", 0);
    vol2.value = RetrieveValue("vol2", 50);
  }

  settings.onclick = function(e) {
  if (panelvisible) { // save stored values
    slideTo(panel, 130);
    slideTo(settings,91);
    if (nAgt.indexOf('Chrome') != -1) {
      if (vol1.value < 1)
        vol1 = 1;
      chrome.storage.local.set({'vol1': vol1.value});
      chrome.storage.local.set({'vol2': vol2.value});
    }
    else {
      StoreValue("vol1", vol1.value);
      StoreValue("vol2", vol2.value);
    }
  }
  else {
    slideTo(panel, 75);
    slideTo(settings, 78);
  }
  panelvisible = !panelvisible;

}

}

function gotStream(stream) {
    audiorunning = true;
  audioContext = new AudioContext();
  inputPoint = audioContext.createGain();
  // Create an AudioNode from the stream.
  realAudioInput = audioContext.createMediaStreamSource(stream);
  audioInput = realAudioInput;
  audioInput.connect(inputPoint);

  //    audioInput = convertToMono( input );

  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 1024; //2048;
  inputPoint.connect( analyserNode );
  // scale = analyserNode.context.sampleRate/(2.7*44100);
  // if (scale < .1)
  // 		scale = .5;
    if (nextIndex > 0) {
      index = nextIndex;
     setTimeout(restart, 500);
}
    updateAnalysers();
}
 function restart() {
    Action(index);
 }

var RandomEffect;
var StepEffect;
function NewEffects()
{
  Action(Math.floor((Math.random() * 8) + 1));
  ix = Math.random()*ixMax;
}

function onSuccess(stream) {

  webGLStart();
  paper = Raphael(document.querySelector('svgpanel'), "100%", "100%" );
  gotStream(stream);
//  if (window.webkitURL) {
//     videoSource = window.webkitURL.createObjectURL(stream);
//  } else if (window.URL) {
//     videoSource = window.URL.createObjectURL(stream);
//  } else {
//     videoSource = stream;
//  }
//  webcam.src = videoSource;
  webcam.srcObject = stream; 
  webcam.play();
  webcam.muted = 'true'; // to stop feedback from speakers to mike

  svgpanel.onmousedown = MonitorMouseDown;
  svgpanel.onmouseup = MonitorMouseUp;
  svgpanel.onmousemove = function(e) {
   e=e || window.event;
   if (mouseState == 1) {
 		mouseX = (mouseX + 7.0*e.clientX/canvas.scrollWidth)/8.0;
 		mouseY = (mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0;
   }
  }
  svgpanel.ontouchstart = function(e) {
		e.preventDefault();
		var touchs = e.changedTouches;
		mouseX = touchs[0].clientX/canvas.scrollWidth;
  		mouseY = 1.0-touchs[0].clientY/canvas.scrollHeight;
  		direction = 1-direction;
	};
	svgpanel.ontouchmove = function(e) {
		e.preventDefault();
		var touches = e.changedTouches;
		mouseX = touches[0].clientX/canvas.scrollWidth;
 		mouseY = 1.0-touches[0].clientY/canvas.scrollHeight;
	};

	document.onkeydown=function(e) {
	  if (e.keyCode == 27)  //esc
      PressBack();
	}

  document.onkeypress=function(e) {
    if (e.keyCode == 32 || e.keyCode == 43) // "+"
      PressNext();
    else if (e.keyCode == 47) // "/"
      ToggleSpectrum();
    else if (e.keyCode == 42)  {// "*"
      if (StepEffect == undefined) {
        PressNext();
        StepEffect = window.setInterval(function () {PressNext()}, 10000);
        window.clearInterval(RandomEffect);
        RandomEffect = undefined;
      }
      else {
        window.clearInterval(StepEffect);
        StepEffect = undefined;
      }

    }
    else if (e.keyCode == 45) {// "-"
      style++;
      if (style == 8)
        style = 0;
      ClearElements();
      initialiseSVGelements = 1;
    }
    else if (e.keyCode == 46) // "."
      ;
    else if (e.keyCode == 61) { // "="
      if (RandomEffect == undefined) {
        NewEffects();
        RandomEffect = window.setInterval(function () {NewEffects()}, 10000);
        window.clearInterval(StepEffect);
        StepEffect = undefined;
      }
      else {
        window.clearInterval(RandomEffect);
        RandomEffect = undefined;
      }

    }
    else if (e.keyCode == 49) { // 1
      Action(1);
    }
    else if (e.keyCode == 50) { // 2
	    Action(2);
    }
    else if (e.keyCode == 51) { // 3
	    Action(3);
    }
    else if (e.keyCode == 52) { // 4
      Action(4);
    }
    else if (e.keyCode == 53) { // 5
      Action(5);
    }
    else if (e.keyCode == 54) { // 6
      Action(6);
    }
    else if (e.keyCode == 55) { // 7
      Action(7);
    }
    else if (e.keyCode == 56) { // 8
      Action(8);
    }
    else if (e.keyCode == 57  || e.keyCode == 13) { // 9
	    doing9x9++;
	    if (doing9x9 > 2)
	      doing9x9 = 0;
	    if (doing9x9 == 0) {
        window.clearInterval(Timer9x9);
        for (var i = 0; i < 9; i++)
          imageList[i].hide();
	    }
	    else if (doing9x9 == 1) {
        for (var i = 0; i < 9; i++) {
          imageList[i].show();
          imageList[i].attr("opacity", 1.);
        }
        Timer9x9 = window.setInterval(function () {Grid9x9()}, 10000);
        for (i = 0; i < 9; i++)
          Grid9x9();
	    }
	    else {
	      for (var i = 0; i < 9; i++)
          imageList[i].attr("opacity", .7);
	    }
	  }
  }


// 		var filter=paper.createFilter();
// filter.addShiftToColor("red");
// filter.addBlur(7);
// // var rect = paper.rect(0,0,"100%", "100%")
// // rect.attr("fill", "#00f000");
// // rect.attr("opacity",.2);
// // // Creates circle at x = 50, y = 40, with radius 10
// var circle = paper.rect("50%", "50%", "25%", "25%","2%");
// // Sets the fill attribute of the circle to red (#f00)
// circle.attr("fill", "#f00");

// Sets the stroke attribute of the circle to white
  // circle.attr("stroke", "#fff");
  // circle.attr("opacity",0.8);
  // circle.blur(canvas.width/80);
//circle.glow();
// // var attr = {fill: "red"};
// //   // A plain ol' circle
// // paper.circle(50, 50, 25).attr(attr);
// // // ..with an embossed effect
// // paper.circle(150, 50, 25).attr(attr).emboss();
// // // ..and with a shadow, too!
// // paper.circle(250, 50, 25).attr(attr).filter(filter).shadow();
}

function onError() {
  alert('There has been a problem retreiving the streams - are you running on file:/// or did you disallow access?');
}
