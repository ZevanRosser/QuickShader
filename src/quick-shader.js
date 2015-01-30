(function() {
  
  var header = [
    '#ifdef GL_ES\n',
    'precision highp float;\n',
    '#endif\n',
    'uniform vec2 resolution;\n',
    'uniform float time;\n',
    'uniform sampler2D tex0;\n'].join('');
  
  // Some of this code is based off of this pen http://codepen.io/jaburns/pen/hHuLI
  // by Jeremy Burns https://github.com/jaburns
  
  window.QuickShader = function(params) {
    
    this.width = params.width || 400;
    this.height = params.height || 400;
    this.shader = header + params.shader;
    
    if (!this.shader){
      console.warn('You must specify a fragment shader'); 
    }
    
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
      var gl, vertices;
      
      gl = this.gl = this.ctx = this.canvas.getContext('experimental-webgl');
    
      vertices = new Float32Array([ -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0 ]);
      
      this.quadVBO = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      
      var error = this.configureShader();
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
      
      this.run = this.run.bind(this);
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
      this.animationId = requestAnimationFrame( this.run );
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
          tmpProgram = gl.createProgram(),
          vs = gl.createShader(gl.VERTEX_SHADER),
          fs = gl.createShader(gl.FRAGMENT_SHADER);
      
      gl.shaderSource(vs, 'attribute vec2 pos;void main(){gl_Position=vec4(pos.x,pos.y,0.0,1.00);}');
      gl.shaderSource(fs, this.shader);
      
      gl.compileShader(vs);
      gl.compileShader(fs);
      
      
       if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
        {
          var infoLog = gl.getShaderInfoLog(fs);
          gl.deleteProgram( tmpProgram );
          this.error = true;
          return 'shader-error: \n' + infoLog;
        }
      
      
      gl.attachShader(tmpProgram, vs);
      gl.attachShader(tmpProgram, fs);
      
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      
      gl.linkProgram(tmpProgram);
      
      if (this.shaderProgram) {
        gl.deleteProgram(this.shaderProgram);
      }
      
      this.shaderProgram = tmpProgram;
    },
    
    render: function(time) {
      var gl = this.gl, l1, l2, l3, t0;
      time = time || 0;
      
      if (this.paused){
        this.pauseOffset = (+new Date() - this.pauseTime);
        return;
      }
      
      gl.viewport( 0, 0, this.width, this.height );
      
      gl.useProgram(this.shaderProgram);
      
      l1 = gl.getAttribLocation(this.shaderProgram, 'pos');
      l2 = gl.getUniformLocation(this.shaderProgram, 'time');
      l3 = gl.getUniformLocation(this.shaderProgram, 'resolution');
      
      // t0 = gl.getUniformLocation(this.shaderProgram, 'tex0');
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);

      if (l2 !== null) { gl.uniform1f(l2, time); }
      if (l3 !== null) { gl.uniform2f(l3, this.width, this.height); }
     
      
      gl.vertexAttribPointer(l1, 2, gl.FLOAT, false, 0, 0);
      
      gl.enableVertexAttribArray(l1);
      
      /*
      if (t0 !== null) { 
        gl.uniform1i(t0, 0 ); 
        gl.activeTexture(gl.TEXTURE0); 
        gl.bindTexture(gl.TEXTURE_2D, this.mTexture); 
      }
      */ 
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(l1);
    }
    
  };
  
})();

