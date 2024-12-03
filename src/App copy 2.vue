<template>
  <div class="container" id="container-default"></div>
  <div class="container" id="container-custom"></div>
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

let engine,
    world,
    render,
    runner,
    mouse,
    mouseConstraint,
    barrel

const boards = []
const barrels = []

export default {
  name: "App",
  data () {
    return {
      debug: true
    }
  },
  mounted () {
    engine = Engine.create();
    world = engine.world;
    world.gravity.x = 0.15

    if (this.debug) {
      render = Render.create({
        element: document.querySelector('#container-default'),
        engine: engine,
        options: {
          width: window.innerWidth / 2,
          height: window.innerHeight,
          showAngleIndicator: true,
          showCollisions: true
        }
      });

      Render.run(render);

      runner = Runner.create();
      Runner.run(runner, engine);


      mouse = Mouse.create(render.canvas),
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
    }

    

    const count = 5.4
    let scaleFactor = 1
    let floorIndex = 0
    let barrelIndex = 0

    this.setupP5();
  
  },
  methods: {
    setupP5() {
      const sketch = (p) => {
        let sprite_middle_board;

        const middleBoardPath = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        const endBoardPath = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        middleBoardPath.setAttribute('d', 'M85.0405 9.52238L101.767 1H132V42.459H1V1H31.2324L47.9585 9.52238L66.4995 12.459L85.0405 9.52238Z')
        endBoardPath.setAttribute('d', 'M123.563 19.041L126.5 0.5H156.5V90.5H1V49.041H31.2324L47.9585 57.5634L66.4995 60.5L85.0405 57.5634L101.767 49.041L115.041 35.7671L123.563 19.041Z')
        // middleBoardPath.setAttribute('d', 'M90.0405 9.52238L106.767 1H142V42.459H1V1H36.2324L52.9585 9.52238L71.4995 12.459L90.0405 9.52238Z')
        // endBoardPath.setAttribute('d', 'M128.563 19.541L131.5 1H166.5V91H1V49.541H36.2324L52.9585 58.0634L71.4995 61L90.0405 58.0634L106.767 49.541L120.041 36.2671L128.563 19.541Z')
        const middleBoardVertices = Svg.pathToVertices(middleBoardPath)
        const endBoardVertices = Svg.pathToVertices(endBoardPath)

        class Barrel {
          constructor() {
            this.position = {x: 300, y: 10}
            this.radius = 50
            this.body = Bodies.circle(
              this.position.x, this.position.y, this.radius
            )
            Composite.add(world, this.body)
          }

          render() {
            this.position.x = this.body.position.x
            this.position.y = this.body.position.y

            p.push()
            p.translate(this.body.position.x, this.body.position.y)
            p.strokeWeight(2);
            p.stroke(0);
            p.noFill();
            p.ellipse(0, 0, this.radius * 2)
            p.pop()
          }
        }

        class MiddleBoard {
          constructor(x, y, img) {
            this.position = {x, y}
            this.img = img
            this.body = Bodies.fromVertices(
              this.position.x, this.position.y, middleBoardVertices, { isStatic: true }
            )
            this.width = this.body.bounds.max.x - this.body.bounds.min.x
            this.height = this.body.bounds.max.y - this.body.bounds.min.y
            Composite.add(world, this.body)
          }

          render() {
            this.position.x = this.body.position.x
            this.position.y = this.body.position.y

            p.push()
            p.translate(this.body.position.x, this.body.position.y)
            p.image(this.img, 0, 0, this.width, this.height);
            p.pop()
          }
        }

        p.preload = () => {
          sprite_middle_board = p.loadImage("../sprite_middle_board.png")
        }

        p.setup = () => {
          p.createCanvas(this.debug ? window.innerWidth / 2 : window.innerWidth, window.innerHeight).parent(document.querySelector('#container-custom'));
          p.imageMode(p.CENTER);
          barrel = new Barrel()
          boards.push(new MiddleBoard(300, 200, sprite_middle_board))
        };

        p.draw = () => {
          p.background(50);
          if (!this.debug) Engine.update(engine)
          barrel.render()
          for (let board of boards) {
            board.render()
          }
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
    display: flex;
  }

  .container {
    width: 50%;
    height: 100%;
  }
</style>