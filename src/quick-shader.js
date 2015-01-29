(function() {
  
  // requestAnimationFrame shim with setTimeout fallback by 
  // Paul Irish http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
  
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function() {
      return window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function ( callback, element ) {
          window.setTimeout( callback, 1000 / 60 );
        };
    })();
  }
  
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
    
    /*
     // Create the canvas element, compile the shader code, and bind the XOR texture to the context.
  var txt = document.getElementById( 'effectShader' ).textContent;
  //document.write("<canvas id='x'></canvas>");
  var can = document.createElement('canvas');
  can.setAttribute('id', 'x');
  document.body.appendChild(can);
  var glCanvas = document.getElementById("x");
  var glContext = glCanvas.getContext("experimental-webgl");  
  var effect = new Effect( glContext, glCanvas.width, glCanvas.height );
  effect.NewShader( txt );
    */
    
  };
  
  QuickShader.prototype = {
    
    constructor: QuickShader, 
    
    init: function() {
      var gl, vertices;
      
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      gl = this.gl = this.ctx = this.canvas.getContext("experimental-webgl");
      vertices = new Float32Array([ -1., -1.,   1., -1.,    -1.,  1.,     1., -1.,    1.,  1.,    -1.,  1.]);
      this.quadVBO = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      
      
      
      this.parentNode.appendChild(this.canvas);
      this.configureShader();
      this.size(this.width, this.height);
      
      this.render(0);
      
      // Main loop.
      var self = this;
      var t0 = (new Date()).getTime();  
      function animate() {
        self.render( ((new Date()).getTime()-t0)/1000 );
        requestAnimationFrame( animate );
      }
      animate();
    },
    
    size: function(width, height) {
      this.width = width;
      this.height = height;
      this.gl.viewport( 0, 0, width, height);
    },
    
    configureShader: function() {
      console.log(this.shader);
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
      console.log(this.mProgram);
    },
    
    render: function(time) {
      var gl = this.gl;
      
      gl.viewport( 0, 0, this.mXres, this.mYres );
      
      gl.useProgram(this.mProgram);
      
      var l1 = gl.getAttribLocation(this.mProgram, "pos");
      var l2 = gl.getUniformLocation(this.mProgram, "time");
      var l3 = gl.getUniformLocation(this.mProgram, "resolution");
      
      var t0 = gl.getUniformLocation(this.mProgram, "tex0");
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
      if( l2!=null ) gl.uniform1f(l2, time);
      if( l3!=null ) gl.uniform2f(l3, this.width, this.height);
      
      
      gl.vertexAttribPointer(l1, 2, gl.FLOAT, false, 0, 0);
      
      gl.enableVertexAttribArray(l1);
      
     // if( t0!=null ) { gl.uniform1i(t0, 0 ); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.mTexture); }
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(l1);
      // console.log('?');
    }
    
  };
  
})();