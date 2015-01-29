(function() {
  
  // Some of this code is based off of this pen http://codepen.io/jaburns/pen/hHuLI
  // by Jeremy Burns https://github.com/jaburns
  
  window.QuickShader = function(params) {
    
    this.width = params.width || 320;
    this.height = params.height || 240;
    this.shader = params.shader;
    
    if (!this.shader){
      console.warn('You must specify a valid fragment shader'); 
    }
    
    if (params.parentNode) {
      this.parentNode = typeof params.parentNode === 'object' ? 
        params.parentNode : document.querySelector(params.parentNode);
    }
    
    this.init();
    
  };
  
  QuickShader.prototype = {
    
    constructor: QuickShader, 
    
    init: function() {
      var gl, vertices;
      
      this.canvas = document.createElement('canvas');
      gl = this.gl = this.ctx = this.canvas.getContext("experimental-webgl");
      vertices = new Float32Array([ -1.0, -1.0, 1.0, -1.0, -1.0,  1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0 ]);
      
      this.quadVBO = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      
      this.configureShader();
    },
    
    size: function(width, height) {
      this.width = width;
      this.height = height;
    },
    
    configureShader: function() {
      
      var gl = this.gl,
          tmpProgram = gl.createProgram(),
          vs = gl.createShader(gl.VERTEX_SHADER),
          fs = gl.createShader(gl.FRAGMENT_SHADER);
      
      gl.shaderSource(vs, "attribute vec2 pos;void main(){gl_Position=vec4(pos.x,pos.y,0.0,1.0);}");
      gl.shaderSource(fs, this.shader);
      
      gl.compileShader(vs);
      gl.compileShader(fs);
      
      if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
      {
        var infoLog = gl.getShaderInfoLog(vs);
        gl.deleteProgram( tmpProgram );
        return "VS ERROR: " + infoLog;;
      }
      
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
      {
        var infoLog = gl.getShaderInfoLog(fs);
        gl.deleteProgram( tmpProgram );
        return "FS ERROR: " + infoLog;
      }
      
      gl.attachShader(tmpProgram, vs);
      gl.attachShader(tmpProgram, fs);
      
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      
      gl.linkProgram(tmpProgram);
      
      if( this.mProgram != null ) gl.deleteProgram( this.mProgram );
      
      this.mProgram = tmpProgram;
    }
    
  };
  
})();