<template>
  
</template>

<script>
import { 
  Engine, 
  Render, 
  Runner, 
  Composites, 
  MouseConstraint, 
  Mouse, 
  Composite, 
  Bodies,
  Events,
  Body,
  Common,
  Vertices,
  Svg
} from 'matter-js';
import decomp from 'poly-decomp';
import p5 from 'p5';

Common.setDecomp(decomp);

export default {
  name: "App",
  mounted () {
    // this.setupP5();


    const engine = Engine.create();
    engine.gravity.x = 0.15;

    const world = engine.world;
          

    const render = Render.create({
      element: document.querySelector('#app'),
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        showAngleIndicator: true,
        showCollisions: true
      }
    });

    Render.run(render);

    const runner = Runner.create();
    Runner.run(runner, engine);


    const middlePath = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    const endPath = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    middlePath.setAttribute('d', 'M85.0405 9.52238L101.767 1H132V42.459H1V1H31.2324L47.9585 9.52238L66.4995 12.459L85.0405 9.52238Z')
    endPath.setAttribute('d', 'M123.563 19.041L126.5 0.5H156.5V90.5H1V49.041H31.2324L47.9585 57.5634L66.4995 60.5L85.0405 57.5634L101.767 49.041L115.041 35.7671L123.563 19.041Z')
    // middlePath.setAttribute('d', 'M90.0405 9.52238L106.767 1H142V42.459H1V1H36.2324L52.9585 9.52238L71.4995 12.459L90.0405 9.52238Z')
    // endPath.setAttribute('d', 'M128.563 19.541L131.5 1H166.5V91H1V49.541H36.2324L52.9585 58.0634L71.4995 61L90.0405 58.0634L106.767 49.541L120.041 36.2671L128.563 19.541Z')
    const floorMiddleVertices = Svg.pathToVertices(middlePath)
    const floorEndVertices = Svg.pathToVertices(endPath)

    const count = 5.4
    let scaleFactor = 1
    let floorIndex = 0
    let ballIndex = 0

    const floors = []

    function createMiddleFloor() {
      const floorMiddle = Bodies.fromVertices(window.innerWidth / 2, window.innerHeight / 2, floorMiddleVertices, { isStatic: true });
      const floorMiddleWidth = floorMiddle.bounds.max.x - floorMiddle.bounds.min.x;
      scaleFactor = window.innerWidth / count / floorMiddleWidth;
      Body.scale(floorMiddle, scaleFactor, scaleFactor);
      const xOffset = (floorMiddle.bounds.min.x - (window.innerWidth - floorMiddle.bounds.max.x)) / 2
      const yOffset = (floorMiddle.bounds.min.y - (window.innerHeight - floorMiddle.bounds.max.y)) / 2
      Body.setPosition(floorMiddle, {x: floorMiddle.position.x - xOffset, y: floorMiddle.position.y - yOffset + scaleFactor * 50 });
      return floorMiddle;
    }

    function createEndFloor() {
      const floorEnd = Bodies.fromVertices(window.innerWidth / 2, window.innerHeight / 2, floorEndVertices, { isStatic: true });
      Body.scale(floorEnd, scaleFactor, scaleFactor);
      const xOffset = floor2.bounds.max.x - floorEnd.bounds.min.x
      const yOffset = floor2.bounds.max.y - floorEnd.bounds.max.y
      Body.setPosition(floorEnd, {x: floorEnd.position.x + xOffset, y: floorEnd.position.y + yOffset });
      return floorEnd;
    }

    const floor3 = createMiddleFloor()
    const floor2 = createMiddleFloor()
    Body.setPosition(floor2, {x: floor3.position.x + window.innerWidth / count, y: floor2.position.y})
    const floor1 = createEndFloor()
    const floor4 = createMiddleFloor()
    Body.setPosition(floor4, {x: floor3.position.x - window.innerWidth / count, y: floor4.position.y})
    const floor5 = createMiddleFloor()
    Body.setPosition(floor5, {x: floor4.position.x - window.innerWidth / count, y: floor5.position.y})
    const floor6 = createMiddleFloor()
    Body.setPosition(floor6, {x: floor5.position.x - window.innerWidth / count, y: floor6.position.y})
    
    floors.push(floor6, floor5, floor4, floor3, floor2, floor1)

    const hill = Bodies.rectangle(floor6.position.x - scaleFactor * 90, floor6.position.y - scaleFactor * 30, window.innerWidth / count * 2, window.innerWidth / count / 4, {
      isStatic: true,
      angle: 0.2
    })



    Composite.add(world, [
      floor3,
      floor2,
      floor1,
      floor4,
      floor5,
      floor6,
      hill,
    ]);
    const balls = []

    function addBall() {
      if (ballIndex > 4) {
        moveObjectsRight(floors[2]);
      }
      ballIndex++
      const ball = Bodies.circle(hill.position.x - scaleFactor * 60, hill.position.y - scaleFactor * 100, 60, {
        restitution: 0.5,
        frictionAir: 0,
        mass: 20,
      });
      Body.scale(ball, scaleFactor, scaleFactor)
      balls.unshift(ball)
      Composite.add(world, [ball]);
    }


    const mouse = Mouse.create(render.canvas),
          mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
              stiffness: 0.1,
              render: {
                visible: false
              }
            }
          });

    Composite.add(world, mouseConstraint);

    render.mouse = mouse;


    window.addEventListener('keydown', function(event) {
      if (event.key === 'ArrowUp') {
        addBall()
      }
      if (event.key === 'ArrowLeft') {
        moveObjectsRight(floors[2]);
      }
    });

    
    function easeInOutSine(x) {
      return -(Math.cos(Math.PI * x) - 1) / 2;
    }

    function moveObjectsRight(centerFloor) {
      const step = window.innerWidth / count
      const startPositionX = centerFloor.position.x
      const endPositionX = centerFloor.position.x + step

      if (floorIndex > 1) {
        Composite.remove(world, [floors[floors.length - 1], balls[balls.length - 1]])
        floors.pop()
        balls.pop()
      }

      const floor = createMiddleFloor()
      Body.setPosition(floor, {x: floors[0].position.x - window.innerWidth / count, y: floor.position.y})
      Composite.add(world, [floor])
      floors.unshift(floor)
      floorIndex++

      function animate() {
        const currentPositionX = centerFloor.position.x
        
        const deltaX = easeInOutSine((currentPositionX - startPositionX) / step);
        console.log(deltaX)
        world.bodies.forEach(body => {
          if (body !== hill) Body.translate(body, { x: deltaX, y: 0 });
        });

        if (currentPositionX < endPositionX - 3) {
          requestAnimationFrame(animate);
        }
      }

      requestAnimationFrame(animate);
    }

  
  },
  methods: {
    setupP5() {
      const sketch = (p) => {

        p.setup = () => {
          p.createCanvas(800, 800).parent(document.querySelector('#app'));
          p.imageMode(p.CENTER);
          // p.angleMode(p.DEGREES);
          
        };

        p.draw = () => {
          p.background(220);
          Engine.update(engine)

         
        };

       
      };

      new p5(sketch);
    }
  }
}
</script>

<style>
  body {
    width: 100vw;
    height: 100vh;
  }

  #app {
    width: 100%;
    height: 100%;
  }
</style>