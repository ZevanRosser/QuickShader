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

window.QuickShader.prototype = {
  
  constructor: QuickShader, 
  
  init: function() { 
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.parentNode.appendChild(this.canvas);
    
    var gl = this.gl = this.ctx = this.canvas.getContext("experimental-webgl");
    
    this.mGLContext = gl;
    this.mQuadVBO = null;
    this.mProgram = null;
    this.mTexture = null;
    
    var vertices = new Float32Array([ -1., -1.,   1., -1.,    -1.,  1.,     1., -1.,    1.,  1.,    -1.,  1.]);
    
    this.mQuadVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mQuadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    this.NewShader(this.shader);
    this.SetSize(200, 200);
  },
  
  SetSize: function(xres,yres) {
    this.mXres = xres;
    this.mYres = yres;
  },
  
  NewShader : function(shaderCode)
  {
    console.log('??????????');
    var gl = this.mGLContext;
    
    var tmpProgram = gl.createProgram();
    
    var vs = gl.createShader(gl.VERTEX_SHADER);
    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    
    gl.shaderSource(vs, "attribute vec2 pos;void main(){gl_Position=vec4(pos.x,pos.y,0.0,1.0);}");
    gl.shaderSource(fs, shaderCode);
    // console.log(shaderCode);
    
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
    
    if( this.mProgram != null )
      gl.deleteProgram( this.mProgram );
    
    this.mProgram = tmpProgram;
    
    // console.log(this.mProgram);
  },
  
  Paint: function(time) {
        var gl = this.mGLContext;
        
        gl.viewport( 0, 0, this.mXres, this.mYres );
        
        gl.useProgram(this.mProgram);
        
        var l1 = gl.getAttribLocation(this.mProgram, "pos");
        var l2 = gl.getUniformLocation(this.mProgram, "time");
        var l3 = gl.getUniformLocation(this.mProgram, "resolution");
        
        
        
        var t0 = gl.getUniformLocation(this.mProgram, "tex0");
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mQuadVBO);
        if( l2!=null ) gl.uniform1f(l2, time);
        if( l3!=null ) gl.uniform2f(l3, this.mXres, this.mYres);
        
        gl.vertexAttribPointer(l1, 2, gl.FLOAT, false, 0, 0);
        
        gl.enableVertexAttribArray(l1);
        
        if( t0!=null ) { gl.uniform1i(t0, 0 ); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.mTexture); }
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disableVertexAttribArray(l1);
      }
  
};

 