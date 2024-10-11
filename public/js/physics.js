// Import Matter.js objects
const { Engine, Render, Runner, Bodies, Body, Events, World } = Matter;

document.addEventListener('DOMContentLoaded', () => {
  // Create an engine and a world
  const engine = Engine.create();
  const world = engine.world;

  // Set up the canvas for rendering
  const canvas = document.getElementById('punching-bag-canvas');
  const render = Render.create({
    element: document.getElementById('impact-container'),
    engine: engine,
    canvas: canvas,
    options: {
      width: 800,  // Width of the canvas
      height: 400, // Height of the canvas
      wireframes: false,  // Disable wireframe mode to show the image
      background: 'transparent',
    }
  });

  // Create the punching bag (dynamic with images that change every 5 hits)
  let punchingBag = Bodies.circle(400, 200, 100, {  // Adjusted for a circular bag
    isStatic: true,  // Keeps the bag in a fixed position
    render: {
      sprite: {
        texture: '/images/boxing5.png',  // Initial image path (adjust dynamically later)
        xScale: 1,  // Adjust scale if needed
        yScale: 1,  // Adjust scale if needed
      }
    }
  });

  // Add the punching bag to the world
  World.add(world, punchingBag);

  // Create a runner and run the engine (fixes the deprecated warning)
  const runner = Runner.create();
  Runner.run(runner, engine);

  // Start the rendering loop
  Render.run(render);

  // Function to apply force to the bag when punched
  window.punchBag = function(hits) {
    Body.applyForce(punchingBag, { x: punchingBag.position.x, y: punchingBag.position.y }, { x: 0.02, y: -0.01 });

    // Dynamically change the texture of the punching bag every 5 hits
    const imageNumber = Math.floor(hits / 5) * 5;  // Change image every 5 hits
    punchingBag.render.sprite.texture = `/images/boxing${imageNumber}.png`;

    // Ensure the image number stays within your available range of images (e.g., boxing5.png to boxing100.png)
    if (imageNumber > 100) {
      punchingBag.render.sprite.texture = '/images/boxing100.png';
    }
  };
});
