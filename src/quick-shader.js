(function() {
  
  var pageX = 0, pageY  = 0;
  document.addEventListener('mousemove', function(e) {
    pageX = e.pageX;
    pageY = e.pageY;
  });
  
  var vertexShader = 'attribute vec2 pos;void main(){gl_Position=vec4(pos.x,pos.y,0.0,1.00);}',
      header = [
        '#ifdef GL_ES\n',
        'precision highp float;\n',
        '#endif\n',
        'uniform vec3 resolution;\n',
        'uniform float time;\n',
        'uniform float millis;\n',
        'uniform vec2 mouse;\n',
        'uniform sampler2D tex0;\n'].join('');
      
  // Some of this code is based off of this pen http://codepen.io/jaburns/pen/hHuLI
  // by Jeremy Burns https://github.com/jaburns
  
  // seen variations on this basic code floating around a bunch
  // may even originally be from http://shadertoy.com
  
  window.QuickShader = function(params) {
    
    if (!params.shader){
      console.warn('You must specify a fragment shader'); 
    }
    
    this.width = params.width || 400;
    this.height = params.height || 400;
    this.shader = header + params.shader;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    if (params.parentNode) {
      this.parentNode = typeof params.parentNode === 'object' ? 
        params.parentNode : document.querySelector(params.parentNode);
      
      this.parentNode.appendChild(this.canvas);
    }
    
    this.pauseOffset = 0;
    this.totalPauseTime = 0;
    
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
    
    destroy: function() {
      this.reset();
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
    
    render: function(time) {
      var gl = this.gl, inputs = [], rect;
      
      time = time || 0;
      
      if (this.paused){
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
      
      // t0 = gl.getUniformLocation(this.shaderProgram, 'tex0');
      
      gl.uniform1f(inputs[1], time);
      gl.uniform3f(inputs[2], this.width, this.height, 1.0);
      gl.uniform1f(inputs[3], this.millis);
      
      
      rect = this.canvas.getBoundingClientRect();
      mouseX = pageX - rect.left;
      mouseY = pageY - rect.top;
      
      gl.uniform2f(inputs[4], mouseX, mouseY);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
      gl.vertexAttribPointer(inputs[0], 2, gl.FLOAT, false, 0, 0);
      
      gl.enableVertexAttribArray(inputs[0]);
      
      /*
      if (t0 !== null) { 
        gl.uniform1i(t0, 0 ); 
        gl.activeTexture(gl.TEXTURE0); 
        gl.bindTexture(gl.TEXTURE_2D, this.mTexture); 
      }
      */ 
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(inputs[0]);
    }
    
  };
  
})();

