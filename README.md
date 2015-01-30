# QuickShader

**QuickShader** speeds up the process of creating WebGL fragment shaders. 

This code snippet and the explanation following it covers everything you need to know to get started:
```js
var q = new QuickShader({
  // required fragment shader string
  shader: document.getElementById('some-shader').textContent,
  
  // width and height of the canvas (defaults to 400x400)
  width: 400, 
  height: 350,
  
  // optionally append to an existing node
  parentNode: '#frame'
});

// methods:

// start rendering/animation
q.play();

// pause rendering
q.pause();

// change the size of the canvas (updates `width` and `height` properties)
q.size(500, 300);

// reset everyting including `time` value
q.reset();

// destroy everything and remove the canvas from the DOM
q.destroy();

// properies:

// current width and height
q.width;
q.height;

// the canvas element (useful if you don't specify a `parentNode` 
// and want to append the canvas later)
q.canvas;

// the canvas context
q.gl;

// alias of q.gl
q.ctx;
    
```

## Shader Inputs

There are a few default shader inputs:

```glsl
// the resolution in pixels
uniform vec2 resolution;

// shader playback time in seconds
uniform float time;
```


## Todo
mouse, date?, textures? demos
