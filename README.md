# QuickShader
  ```js
var q = new QuickShader({
  shader: document.getElementById('some-shader').textContent,
  width: 400, 
  height: 350,
    parentNode: '#frame'
  });
        
  q.render(0);
        
        
  // q.canvas
  // q.ctx = q.gl
  // q.size(width, height)
        
  // q.play();
  // q.pause();
  // q.render(time = 0);
           
  //  when no parent node
  // document.body.appendChild(q.canvas);
```

## shader inputs
time, mouse, date?, textures?
