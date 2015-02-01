# QuickShader

**QuickShader** speeds up the process of creating WebGL fragment shaders and displaying them in the browser.

## Docs
The following code snippets and descriptions contain everything you need to know to use **QuickShader**. Be sure to check out the `demos` folder for more examples.

```js
// make a `QuickShader` instance
var q = new QuickShader({
  // required fragment shader string
  shader: document.getElementById('some-shader').textContent,
  
  // width and height of the canvas (defaults to 400x400)
  width: 400, 
  height: 350,
  
  // optionally append to an existing node
  // (can be a selector or an actual node)
  parentNode: '#frame'
});

// methods:

// start rendering/animation
q.play();

// pause rendering
q.pause();

// hook into the `render` loop
// (you can use this to update custom uniform values)
q.update(function(inputs) {
  inputs.someCustomInput = Math.random();
  // `this` is bound to the `QuickShader` instance so you
  // can really easily customize things
});

// change the size of the canvas (updates `width` and `height` properties)
q.size(500, 300);

// reset everyting including `time` value
q.reset();

// destroy everything and remove the canvas from the DOM
q.destroy();

// properies:

// get the paused state (`true` when paused)
q.paused;

// current width and height
q.width;
q.height;

// the canvas element (useful if you don't specify a `parentNode` 
// and want to append the canvas later)
q.canvas;

// the canvas context
q.gl;

// alias of `gl`
q.ctx;
    
```

### Shader Inputs

There are a few default shader inputs:

```glsl
// the resolution in pixels
uniform vec2 resolution;

// shader playback time in seconds
uniform float time;

// the milliseconds at the start of the program
// ranging from 0.0 to 1.0 (useful for random seeds)
uniform float millis;

// the mouse location in pixels inside the canvas
uniform vec2 mouse;

// true while mouse is down
uniform bool mouseDown; 

// true when mouse is first up
uniform bool mouseUp; 

// true when mouse is clicked
uniform bool mouseClicked; 
```


### Textures

You can add as many textures to your shader as you like. You can link `image` and/or `canvas` nodes and **QuickShader** does the rest:

```js
var img = new Image();
        
  img.src = 'coins.jpg';

  img.addEventListener('load', function() {
          
  var q = new QuickShader({
    shader: document.getElementById('some-shader').textContent,
    width: 400, 
    height: 400,
    parentNode: '#frame', 
    // point to the image and give it a name
    textures: [
      {name: 'coins', src: img}
    ]
  });
  ```
  
The `name` property of each texture you pass in will be used added as a `sampler2D` to your shader program automatically. So after the above code, if you want to display your image in a shader it would look like this:

```glsl
void main(void) {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
        
  gl_FragColor = texture2D(coins,uv);
}
```

### Custom Inputs
You can bring in values from javascript into your shader as variables. For instance:

```js
 var q = new QuickShader({
    shader: document.getElementById('some-shader').textContent,
    width: 400, 
    height: 400,
    parentNode: '#frame', 
    inputs: [
      // currently only `int`, `float` and `bool` are supported
      {type: 'float', name: 'randX', value: Math.random()},
      {type: 'float', name: 'randY', value: Math.random()}
    ]
  });
```
This will define two variables in your shader like so:

```glsl
uniform float randX;
uniform float randY;
```

Then if you want to update the values of these uniforms you can use the `update` function:

```js
q.update(function(inputs) {
  inputs.randX = Math.random();
  inputs.randY = Math.random();
});
```

