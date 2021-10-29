// QuickShader by Zevan Rosser 2015-2021
let pageX = 0, pageY = 0;

const noop = () => {};

document.addEventListener('mousemove', e => {
  pageX = e.pageX;
  pageY = e.pageY;
});

document.addEventListener('touchmove', e => {
  pageX = e.touches[0].pageX;
  pageY = e.touches[0].pageY;
});

const vertexShader =`
  attribute vec2 pos;
  void main(){
    gl_Position = vec4(pos.x, pos.y, .0, 1.);
  }`;

const header = `
  #ifdef GL_ES 
  precision highp float; 
  #endif 
  uniform bool mouseDown; 
  uniform bool mouseUp; 
  uniform bool mouseClicked; 
  uniform vec3 resolution; 
  uniform float time;
  uniform float millis;
  uniform vec2 mouse;
  uniform sampler2D tex0;
`;
  
// Some of this code is based off of this pen http://codepen.io/jaburns/pen/hHuLI
// by Jeremy Burns https://github.com/jaburns

// seen variations on this basic code floating around a bunch on github and elsewhere
// may even originally be from http://shadertoy.com
class QuickShader {
  constructor(params) {
    if (!params.shader) {
      console.warn('You must specify a fragment shader');
    }

    this.lastIdx = 0;

    this.width = params.width || 400;
    this.height = params.height || 400;
    this.shader = params.shader;
    this.shaders = [];

    this.textureCode = '';
    this.texturesIn = params.textures || [];
    this.textures = [];

    this.inputCode = '';
    this.customData = {};
    this.customInputs = params.inputs || [];
    this.updateFunction = noop;

    this.canvas = params.canvas || document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.addCanvasMouseEvents();

    if (params.parentNode) {
      this.parentNode =
        typeof params.parentNode === 'object'
          ? params.parentNode
          : document.querySelector(params.parentNode);

      this.parentNode.appendChild(this.canvas);
    }

    this.pauseOffset = 0;
    this.totalPauseTime = 0;

    this.start = this.play;
    
    this.init();
  }

  init() {
    let gl, vertices, error;

    gl = this.gl = this.ctx = this.canvas.getContext('webgl', { premultipliedAlpha: false });

    vertices = new Float32Array([
      -1.0,
      -1.0,
      1.0,
      -1.0,
      -1.0,
      1.0,
      1.0,
      -1.0,
      1.0,
      1.0,
      -1.0,
      1.0
    ]);

    this.quadVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    this.texturesIn.forEach(this.addTexture.bind(this));

    this.customInputs.forEach(this.addInput.bind(this));

    this.shader = [header, this.textureCode, this.inputCode, this.shader].join(
      ''
    );

    error = this.configureShader();

    if (error) {
      this.destroy();
      if (this.parentNode) {
        console.warn(error);
      }
      return;
    }

    this.size(this.width, this.height);
    this.millis = new Date().getMilliseconds() / 1000;
  }

  addCanvasMouseEvents() {
    this.mouseDown = false;
    this.mouseUp = false;
    this.mouseClicked = false;

    this.onClick = this.onClick;
    this.onMouseDown = this.onMouseDown;
    this.onMouseUp = this.onMouseUp;

    this.canvas.addEventListener('click', this.onClick);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('touchstart', this.onMouseDown);

    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('touchend', this.onMouseUp);
  }

  onClick = e => {
    this.mouseClicked = true;
  };

  onMouseDown = e => {
    this.mouseDown = true;
  };

  onMouseUp = e => {
    this.mouseUp = true;
    this.mouseDown = false;
  };

  destroy() {
    // @TODO what is going on here
    this.reset();
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('touchstart', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }

  reset() {
    this.startTime = null;
    cancelAnimationFrame(this.animationId);
  }

  play() {
    if (this.error) return;

    this.totalPauseTime += this.pauseOffset;
    this.paused = false;

    if (this.startTime) {
      return;
    }

    this.startTime = +new Date();
    this.run();
  }

  run = () => {
    const time = (+new Date() - this.startTime - this.totalPauseTime) / 1000;
     
    this.render(time);
    this.animationId = requestAnimationFrame(this.run);
  };

  pause() {
    this.paused = true;
    this.pauseTime = +new Date();
  }

  size(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  changeShader(newShader, inputs) {
    if (inputs) {
      this.replaceInputs(inputs);
    }
    this.shader = [header, this.textureCode, this.inputCode, newShader].join(
      ''
    );

    this.configureShader(this.shader);
  }

  configureShader(shader) {
    const gl = this.gl;

    const tempProgram = gl.createProgram();
    const vs = gl.createShader(gl.VERTEX_SHADER);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    let infoLog;

    gl.shaderSource(vs, vertexShader);
    gl.shaderSource(fs, this.shader);

    gl.compileShader(vs);
    gl.compileShader(fs);
 

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      infoLog = gl.getShaderInfoLog(fs);
      gl.deleteProgram(tempProgram);
      this.error = true;
      // log here to debug shader
      console.warn(infoLog);
      return `shader-error: \n ${infoLog}`;
    }

    gl.attachShader(tempProgram, vs);
    gl.attachShader(tempProgram, fs);

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    gl.linkProgram(tempProgram);

    if (this.shaderProgram) {
      gl.deleteProgram(this.shaderProgram);
    }

    this.shaderProgram = tempProgram;
  }

  update(updateFunction) {
    this.updateFunction = updateFunction.bind(this);
  }

  render(time) {
    const gl = this.gl;
    const inputs = [];
    const textureNum = this.textures.length;
    const customInputsLength = this.customInputs.length;
    let input;
    let tex;
    let rect;

    time = time || 0;

    if (this.paused) {
      this.pauseOffset = +new Date() - this.pauseTime;
      return;
    }

    gl.viewport(0, 0, this.width, this.height);

    gl.useProgram(this.shaderProgram);

    inputs[0] = gl.getAttribLocation(this.shaderProgram, 'pos');
    inputs[1] = gl.getUniformLocation(this.shaderProgram, 'time');
    inputs[2] = gl.getUniformLocation(this.shaderProgram, 'resolution');
    inputs[3] = gl.getUniformLocation(this.shaderProgram, 'millis');
    inputs[4] = gl.getUniformLocation(this.shaderProgram, 'mouse');

    inputs[5] = gl.getUniformLocation(this.shaderProgram, 'mouseDown');
    inputs[6] = gl.getUniformLocation(this.shaderProgram, 'mouseUp');
    inputs[7] = gl.getUniformLocation(this.shaderProgram, 'mouseClicked');

    gl.uniform1f(inputs[1], time);
    gl.uniform3f(inputs[2], this.width, this.height, 1.0);
    gl.uniform1f(inputs[3], this.millis);

    this.updateFunction(this.customData);

    for (let i = 0; i < textureNum; i++) {
      tex = gl.getUniformLocation(this.shaderProgram, this.textures[i].name);

      gl.uniform1i(tex, i);
      gl.activeTexture(gl['TEXTURE' + i]);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[i].texture);
    }

    for (let i = 0; i < customInputsLength; i++) {
      const customInput = this.customInputs[i];
      input = gl.getUniformLocation(this.shaderProgram, customInput.name);
      if (customInput.type === 'float') {
        gl.uniform1f(input, this.customData[customInput.name]);
      } else if (customInput.type === 'bool' || customInput.type === 'int') {
        gl.uniform1i(input, this.customData[customInput.name]);
      }
    }

    rect = this.canvas.getBoundingClientRect();
    let mouseX = pageX - rect.left;
    let mouseY = pageY - rect.top;

    gl.uniform2f(inputs[4], mouseX, mouseY);

    gl.uniform1f(inputs[5], +this.mouseDown);
    gl.uniform1f(inputs[6], +this.mouseUp);
    gl.uniform1f(inputs[7], +this.mouseClicked);

    this.mouseUp = false;
    this.mouseClicked = false;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
    gl.vertexAttribPointer(inputs[0], 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(inputs[0]);

    
    gl.clearColor(1., 0, 0, 0.5);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //gl.enable(gl.GL_BLEND);
    //gl.blendFunc(gl.GL_ONE, gl.GL_ONE_MINUS_SRC_ALPHA);
    //gl.blendFunc(gl.GL_SRC_ALPHA, gl.GL_ONE_MINUS_SRC_ALPHA);

    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    //  gl.enable(gl.BLEND);
    //gl.disable(gl.DEPTH_TEST);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disableVertexAttribArray(inputs[0]);

    //gl.disable(gl.GL_BLEND);
  }

  replaceInputs(inputs) {
    this.inputCode = '';
    this.customInputs = inputs;
    this.customData = {};
    inputs.forEach(this.addInput.bind(this));
  }

  addInput(input) {
    this.inputCode += ['uniform ', input.type, ' ', input.name, ';\n'].join('');
    this.customData[input.name] = input.value;
    // console.log(input, 'oe');
  }

  // https://gist.github.com/jakelear/d7707cea025113dcaa940cc0870670bf
  updateTexture(name) {
    let gl = this.gl;
    let texData = this.textures[name];
    let img = texData.img;
    let texture = texData.texture;

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // gl::PixelStorei(gl::UNPACK_ALIGNMENT, 1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  replaceTexture(name, src) {
    let gl = this.gl,
      img = src,
      texture = gl.createTexture();

    if (this.textures[name]) {
      this.textures[name].texture;
      gl.deleteTexture(this.textures[name].texture);
    }
    this.textures[name] = {
      texture: texture,
      img: img
    };
    // replace
    for (let i = 0; i < this.textures.length; i++) {
      if (this.textures[i].name === name) {
        this.textures[i].texture = texture;
        break;
      }
    }
    this.updateTexture(name);
  }

  addTexture(info) {
    let gl = this.gl,
      img = info.src || QuickShader.tex,
      name = info.name,
      texture = gl.createTexture();

    this.textureCode += `uniform sampler2D  ${name};\n`;

    this.textures[name] = {
      texture: texture,
      img: img
    };

    this.updateTexture(name);

    this.textures.push({ name: name, texture: texture });
  }
}

// const passthrough = `void main(void) {
//   vec2 uv = gl_FragCoord.xy / resolution.xy;
//   gl_FragColor = texture2D(t0,uv);
// }`;
// const img = new Image();
// QuickShader.tinyImg = `data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==`;
// img.src = QuickShader.tinyImg;
// img.onload = function() {
//   QuickShader.QQ = new QuickShader({
//     shader: passthrough,
//     width: img.width,
//     height: img.height,
//     textures: [{ name: 't0', src: img }]
//   });

//   QuickShader.QQ2 = new QuickShader({
//     shader: passthrough,
//     width: img.width,
//     height: img.height,
//     textures: [{ name: 't0', src: img }]
//   });
// };

QuickShader.tex = document.createElement('canvas')
tex.width = tex.height = 1;

window.QuickShader = QuickShader;

//export default QuickShader;

// https://github.com/Schmavery/reprocessing/issues/22
/*
// Now that the image has loaded make copy it to the texture.
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

// Check if the image is a power of 2 in both dimensions.
if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
   // Yes, it's a power of 2. Generate mips.
    gl.generateMipmap(gl.TEXTURE_2D);
} else {
   // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
}
*/
