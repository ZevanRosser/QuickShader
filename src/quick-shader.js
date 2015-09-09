// QuickShader by Zevan Rosser 2015
(function() {
  var pageX = 0, 
      pageY  = 0, 
      noop = function(){};
  
  document.addEventListener('mousemove', function(e) {
    pageX = e.pageX;
    pageY = e.pageY;
  });
  
  document.addEventListener('touchmove', function(e) {
    pageX = e.touches[0].pageX;
    pageY = e.touches[0].pageY;
  });
  
  var vertexShader = 'attribute vec2 pos;void main(){gl_Position=vec4(pos.x,pos.y,0.0,1.00);}',
      header = [
        '#ifdef GL_ES\n',
        'precision highp float;\n',
        '#endif\n',
        'uniform bool mouseDown;\n',
        'uniform bool mouseUp;\n',
        'uniform bool mouseClicked;\n',
        'uniform vec3 resolution;\n',
        'uniform float time;\n',
        'uniform float millis;\n',
        'uniform vec2 mouse;\n',
        'uniform sampler2D tex0;\n'].join('');
      
  // Some of this code is based off of this pen http://codepen.io/jaburns/pen/hHuLI
  // by Jeremy Burns https://github.com/jaburns
  
  // seen variations on this basic code floating around a bunch on github and elsewhere
  // may even originally be from http://shadertoy.com
  
  window.QuickShader = function(params) {
    
    if (!params.shader){
      console.warn('You must specify a fragment shader'); 
    }
    
    this.width = params.width || 400;
    this.height = params.height || 400;
    this.shader = params.shader;
    
    this.textureCode = '';
    this.texturesIn = params.textures || [];
    this.textures = [];
    
    this.inputCode = '';
    this.customData = {};
    this.customInputs = params.inputs || [];
    this.updateFunction = noop;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.addCanvasMouseEvents();
    
    if (params.parentNode) {
      this.parentNode = typeof params.parentNode === 'object' ? 
        params.parentNode : document.querySelector(params.parentNode);
      
      this.parentNode.appendChild(this.canvas);
    }
    
    this.pauseOffset = 0;
    this.totalPauseTime = 0;
    
    // create an alias for play mainly because
    // codepen renames any function call to `play()` to
    // `doNotPlay()` not exactly sure why, maybe for audio/video
    // anyway here is an alias for use on codepen
    this.start = this.play;
    
    this.init(); 
  };
  
  QuickShader.prototype = {
    
    constructor: QuickShader, 
    
    init: function() { 
      var gl, vertices, error;
      
      gl = this.gl = this.ctx = this.canvas.getContext('experimental-webgl');
    
      vertices = new Float32Array([ -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0 ]);
      
      this.quadVBO = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      
      this.texturesIn.forEach(this.addTexture.bind(this));
      
      this.customInputs.forEach(this.addInput.bind(this));
      
      this.shader = [header, this.textureCode, this.inputCode, this.shader].join('');

      
      error = this.configureShader();
      
      if (error) {
        this.destroy();
        if (this.parentNode) {
         var pre = document.createElement('pre');
         pre.innerHTML = error;
         this.parentNode.appendChild(pre); 
        }
        return; 
      }
      
      this.size(this.width, this.height);
      this.millis = new Date().getMilliseconds() / 1000;
    },
    
    addCanvasMouseEvents: function() {
      this.mouseDown = false;
      this.mouseUp = false;
      this.mouseClicked = false;
      
      this.onClick = this.onClick.bind(this);
      this.onMouseDown = this.onMouseDown.bind(this);
      this.onMouseUp = this.onMouseUp.bind(this);
      
      this.canvas.addEventListener('click', this.onClick);
      this.canvas.addEventListener('mousedown', this.onMouseDown);
      this.canvas.addEventListener('touchstart', this.onMouseDown);

      document.addEventListener('mouseup', this.onMouseUp);
      document.addEventListener('touchend', this.onMouseUp);
    },
    
    onClick: function(e) {
      this.mouseClicked = true;
    },
    
    onMouseDown: function(e) {
      this.mouseDown = true;
    },
    
    onMouseUp: function(e) {
      this.mouseUp = true;
      this.mouseDown = false;
    },
    
    destroy: function() {
      this.reset();
      this.canvas.removeEventListener('click', this.onClick);
      this.canvas.removeEventListener('mousedown', this.onMouseDown);
      document.removeEventListener('mouseup', this.onMouseUp);
      if (this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
    }, 
    
    reset: function() {
      this.startTime = null;
      cancelAnimationFrame(this.animationId);
    },
    
    play: function() {
      if (this.error) return;
        
      this.totalPauseTime += this.pauseOffset;
      this.paused = false;
      
      if (this.startTime) { return; }
      
      this.startTime = +new Date();
      this.run();
    },
    
    run: function() {
      var time = (+new Date() - this.startTime - this.totalPauseTime) / 1000;
      this.render(time) 
      this.animationId = requestAnimationFrame( this.run.bind(this) );
    },
    
    pause: function() {
      this.paused = true;
      this.pauseTime = +new Date();
    },
    
    size: function(width, height) {
      this.width = width;
      this.height = height
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport( 0, 0, this.width, this.height );
    },
    
    configureShader: function() {
      var gl = this.gl,
          tempProgram = gl.createProgram(),
          vs = gl.createShader(gl.VERTEX_SHADER),
          fs = gl.createShader(gl.FRAGMENT_SHADER), 
          infoLog;
      
      gl.shaderSource(vs, vertexShader);
      gl.shaderSource(fs, this.shader);
      
      gl.compileShader(vs);
      gl.compileShader(fs);
      
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        infoLog = gl.getShaderInfoLog(fs);
        gl.deleteProgram( tempProgram );
        this.error = true;
        return 'shader-error: \n' + infoLog;
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
    },
    
    update: function(updateFunction) {
      this.updateFunction = updateFunction.bind(this);
    },
    
    render: function(time) {
      var gl = this.gl, 
          inputs = [], 
          textureNum = this.textures.length,
          customInputsLength = this.customInputs.length,
          input,
          tex,
          rect;

      time = time || 0;
      
      if (this.paused){
        this.pauseOffset = +new Date() - this.pauseTime;
        return;
      }
      
      gl.viewport(0, 0, this.width, this.height);
      
      gl.useProgram(this.shaderProgram);
      
      inputs[0] = gl.getAttribLocation(this.shaderProgram,'pos');
      inputs[1] = gl.getUniformLocation(this.shaderProgram,'time');
      inputs[2] = gl.getUniformLocation(this.shaderProgram,'resolution');
      inputs[3] = gl.getUniformLocation(this.shaderProgram,'millis');
      inputs[4] = gl.getUniformLocation(this.shaderProgram, 'mouse');
       
      inputs[5] = gl.getUniformLocation(this.shaderProgram, 'mouseDown');
      inputs[6] = gl.getUniformLocation(this.shaderProgram, 'mouseUp');
      inputs[7] = gl.getUniformLocation(this.shaderProgram, 'mouseClicked');

      gl.uniform1f(inputs[1], time);
      gl.uniform3f(inputs[2], this.width, this.height, 1.0);
      gl.uniform1f(inputs[3], this.millis);
      
      for (var i = 0; i < textureNum; i++){
        tex = gl.getUniformLocation(this.shaderProgram, this.textures[i].name);

        gl.uniform1i(tex, i); 
        gl.activeTexture(gl['TEXTURE' + i]); 
        gl.bindTexture(gl.TEXTURE_2D, this.textures[i].texture);
      }
      
      this.updateFunction(this.customData);
        
      for (var i = 0; i < customInputsLength; i++) {
        var customInput = this.customInputs[i];
        input = gl.getUniformLocation(this.shaderProgram, customInput.name);
        if (customInput.type === 'float') {
          gl.uniform1f(input, this.customData[customInput.name]);
        } else if (customInput.type === 'bool' || customInput.type === 'int') {
          gl.uniform1i(input, this.customData[customInput.name]);
        }
      }
   
      rect = this.canvas.getBoundingClientRect();
      mouseX = pageX - rect.left;
      mouseY = pageY - rect.top;
      
      gl.uniform2f(inputs[4], mouseX, mouseY);
      
      gl.uniform1f(inputs[5], +this.mouseDown);
      gl.uniform1f(inputs[6], +this.mouseUp);
      gl.uniform1f(inputs[7], +this.mouseClicked);
      
      this.mouseUp = false;
      this.mouseClicked = false;
        
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
      gl.vertexAttribPointer(inputs[0], 2, gl.FLOAT, false, 0, 0);
      
      gl.enableVertexAttribArray(inputs[0]);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(inputs[0]);
    }, 
    
    addInput: function(input) {
      this.inputCode += [ 'uniform ', input.type, ' ', input.name, ';\n' ].join('');
      this.customData[input.name] = input.value;
    },
    
    addTexture: function(info) {
      
      var gl = this.gl, 
          img = info.src,
          name = info.name,
          texture = gl.createTexture();
      
      this.textureCode += [ 'uniform sampler2D ', name, ';\n' ].join('');
      
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); 
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
      
      this.textures.push({name: name, texture: texture});
    }
    
  };
  
})();

