<template>
  <div v-if="debug" class="container" id="container-default"></div>
  <div class="container" id="container-custom"></div>
  <div v-if="isGameOver" class="modal">
    <div class="modal__content">
      <div class="modal__content-title">Победа!</div>
      <div class="modal__winners-table">
        <div class="modal__winners-table-title">{{ winners.length > 1 ? 'Выигрышные билеты:' : 'Выигрышный билет:' }}</div>
        <div class="modal__winners-table-row" v-for="(winner, idx) of winners" :key="idx">
          <div class="modal__winners-table-number">№ {{winner.number}}</div>
          <div class="modal__winners-table-name">{{ winner.name }}</div>
        </div>
      </div>
    </div>
  </div>
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
    mouseConstraint

const boards = []
const barrels = []
const legs = []
const beams = []
let hill

const COUNT_OF_BOARDS_PER_SCREEN = 5.3
let scaleFactor = 1
let boardIndex = 0
let barrelIndex = 0

const channel = new BroadcastChannel('my_channel');

function easeInOutSin(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}



export default {
  name: "App",
  data () {
    return {
      debug: false,
      isGameOver: false,
      winners: []
    }
  },
  mounted () {
    
    channel.addEventListener('message', (event) => {
      if (event.data.type === 'gameOver') {
        this.isGameOver = true
        this.winners = event.data.value
      }
    });


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


    this.setupP5();
  
  },
  methods: {
    setupP5() {
      const sketch = (p) => {
        let sprite_middle_board;
        let sprite_end_board;
        let sprite_leg;
        let sprite_beam;
        let sprite_barrel;
        let background;
        let font;

        const middleBoardPath = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        const endBoardPath = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        const legPath = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        const beamPath = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        middleBoardPath.setAttribute('d', 'M85.0405 9.52238L101.767 1H132V42.459H1V1H31.2324L47.9585 9.52238L66.4995 12.459L85.0405 9.52238Z')
        endBoardPath.setAttribute('d', 'M123.563 19.041L126.5 0.5H156.5V90.5H1V49.041H31.2324L47.9585 57.5634L66.4995 60.5L85.0405 57.5634L101.767 49.041L115.041 35.7671L123.563 19.041Z')
        legPath.setAttribute('d', 'M1 241V1H101V241H1Z')
        beamPath.setAttribute('d', 'M417 1H1V61H417V1Z')
        const middleBoardVertices = Svg.pathToVertices(middleBoardPath)
        const endBoardVertices = Svg.pathToVertices(endBoardPath)
        const legVertices = Svg.pathToVertices(legPath)
        const beamVertices = Svg.pathToVertices(beamPath)

        function moveObjectsRight(callback) {
          const firstBoard = boards[0]
          const step = firstBoard.width
          const startPositionX = firstBoard.body.position.x
          const endPositionX = firstBoard.body.position.x + step

          if (boardIndex > 1) {
            Composite.remove(world, [boards[boards.length - 1].body, barrels[barrels.length - 1].body])
            boards.pop()
            barrels.pop()
          }

          if (beams[beams.length - 1].body.bounds.min.x > p.width) {
            Composite.remove(world, [beams[beams.length - 1].body])
            beams.pop()

            const beam = new Beam()
            Body.setPosition(beam.body, {
              x: beams[0].position.x - beams[0].width - legs[0].width, 
              y: beams[0].position.y
            })
            Composite.add(world, beam)
            beams.unshift(beam)
          }

          if (legs[legs.length - 1].body.bounds.min.x > p.width) {
            Composite.remove(world, [legs[legs.length - 1].body])
            legs.pop()

            const leg = new Leg()
            Body.setPosition(leg.body, {
              x: legs[0].position.x - beams[0].width - legs[0].width, 
              y: legs[0].position.y
            })
            Composite.add(world, leg)
            legs.unshift(leg)
          }

          const board = new MiddleBoard()
          Body.setPosition(board.body, {
            x: boards[0].position.x - boards[0].width, 
            y: boards[0].position.y
          })
          Composite.add(world, board)
          boards.unshift(board)
          boardIndex++

          function animate() {
            const currentPositionX = firstBoard.body.position.x
            const progress = (currentPositionX - startPositionX) / step

            let deltaX
            if (progress < 0.00001 || progress > 0.99999) deltaX = step / 8192
            else if (progress < 0.00002 || progress > 0.99998) deltaX = step / 1024
            else if (progress < 0.1 || progress > 0.9) deltaX = step / 256
            else if (progress < 0.2 || progress > 0.8) deltaX = step / 128
            else if (progress < 0.3 || progress > 0.7) deltaX = step / 64
            else deltaX = step / 16
            
            world.bodies.forEach(body => {
              if (body !== hill.body) Body.translate(body, { x: deltaX, y: 0 });
            });

            if (currentPositionX < endPositionX) {
              console.log(currentPositionX, endPositionX)
              requestAnimationFrame(animate);
            } else {
              callback()
              console.log('end', currentPositionX, endPositionX)
              console.log(boards)
            }
          }

          requestAnimationFrame(animate);
        }

        class Barrel {
          constructor(number, img, angle = 0) {
            this.position = {x: 100, y: 300}
            this.number = number
            this.img = img
            this.radius = 60 * scaleFactor
            
            if (barrelIndex === 0) this.angle = p.PI / 2
            else if (barrelIndex === 1) this.angle = p.PI
            else if (barrelIndex === 2) this.angle = -p.PI / 2
            else if (barrelIndex === 3) this.angle = p.PI / 4
            else this.angle = p.PI

            this.body = Bodies.circle(
              this.position.x, this.position.y, this.radius, {
                restitution: 0.5,
                frictionAir: 0,
                mass: 100,
                angle: this.angle
              }
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
            p.rotate(this.body.angle);
            p.image(this.img, 0, 0, this.width, this.height);
            p.push()
            p.drawingContext.shadowOffsetX = this.radius / 30;
            p.drawingContext.shadowOffsetY = this.radius / 30;
            p.drawingContext.shadowBlur = 0;
            p.drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
            p.textFont(font);
            p.textSize(48 * scaleFactor);
            p.textAlign(p.CENTER, p.CENTER);
            p.text(this.number, 0, -10 * scaleFactor);
            p.pop()
            if ([6, 9, 68, 89].includes(this.number)) {
              p.push()
              p.fill(0)
              p.noStroke()
              p.ellipse(0, this.radius / 2, this.radius / 7)
              p.pop()
            }
            p.strokeWeight(2);
            p.stroke(0);
            p.noFill();
            p.ellipse(0, 0, this.radius * 2)
            p.pop()
          }
        }

        class MiddleBoard {
          constructor() {
            this.position = {x: p.width / 2, y: p.height / 2}
            this.img = sprite_middle_board
            this.body = Bodies.fromVertices(
              this.position.x, this.position.y, middleBoardVertices, { isStatic: true }
            )
            this.width = this.body.bounds.max.x - this.body.bounds.min.x
            this.height = this.body.bounds.max.y - this.body.bounds.min.y
            scaleFactor = p.width / COUNT_OF_BOARDS_PER_SCREEN / this.width
            Body.scale(this.body, scaleFactor, scaleFactor);
            this.width = this.body.bounds.max.x - this.body.bounds.min.x
            this.height = this.body.bounds.max.y - this.body.bounds.min.y
            this.xOffset = ((this.body.position.x - this.body.bounds.min.x) - (this.body.bounds.max.x - this.body.position.x)) / 2
            this.yOffset = ((this.body.position.y - this.body.bounds.min.y) - (this.body.bounds.max.y - this.body.position.y)) / 2
            Body.setPosition(this.body, {x: this.body.position.x + this.xOffset, y: this.body.position.y + this.yOffset})
            Composite.add(world, this.body)
          }

          render() {
            this.position.x = this.body.position.x
            this.position.y = this.body.position.y

            p.push()
            p.translate(this.body.position.x, this.body.position.y)
            p.image(this.img, -this.xOffset, -this.yOffset, this.width, this.height);
            p.pop()
          }
        }

        class EndBoard {
          constructor() {
            this.position = {x: p.width / 2, y: p.height / 2}
            this.img = sprite_end_board
            this.body = Bodies.fromVertices(
              this.position.x, this.position.y, endBoardVertices, { isStatic: true }
            )
            Body.scale(this.body, scaleFactor, scaleFactor);
            this.width = this.body.bounds.max.x - this.body.bounds.min.x
            this.height = this.body.bounds.max.y - this.body.bounds.min.y
            this.xOffset = ((this.body.position.x - this.body.bounds.min.x) - (this.body.bounds.max.x - this.body.position.x)) / 2
            this.yOffset = ((this.body.position.y - this.body.bounds.min.y) - (this.body.bounds.max.y - this.body.position.y)) / 2
            Body.setPosition(this.body, {x: this.body.position.x + this.xOffset, y: this.body.position.y + this.yOffset})
            Composite.add(world, this.body)
          }

          render() {
            this.position.x = this.body.position.x
            this.position.y = this.body.position.y

            p.push()
            p.translate(this.body.position.x, this.body.position.y)
            p.image(this.img, -this.xOffset, -this.yOffset, this.width, this.height);
            p.pop()
          }
        }

        class Leg {
          constructor() {
            this.position = {x: p.width / 2, y: p.height / 2}
            this.img = sprite_leg
            this.body = Bodies.fromVertices(
              this.position.x, this.position.y, legVertices, { isStatic: true }
            )
            Body.scale(this.body, scaleFactor, scaleFactor);
            this.width = this.body.bounds.max.x - this.body.bounds.min.x
            this.height = this.body.bounds.max.y - this.body.bounds.min.y
            this.xOffset = ((this.body.position.x - this.body.bounds.min.x) - (this.body.bounds.max.x - this.body.position.x)) / 2
            this.yOffset = ((this.body.position.y - this.body.bounds.min.y) - (this.body.bounds.max.y - this.body.position.y)) / 2
            Body.setPosition(this.body, {x: this.body.position.x + this.xOffset, y: this.body.position.y + this.yOffset})
            Composite.add(world, this.body)
          }

          render() {
            this.position.x = this.body.position.x
            this.position.y = this.body.position.y

            p.push()
            p.translate(this.body.position.x, this.body.position.y)
            p.image(this.img, -this.xOffset, -this.yOffset, this.width, this.height);
            p.pop()
          }
        }

        class Beam {
          constructor() {
            this.position = {x: p.width / 2, y: p.height / 2}
            this.img = sprite_beam
            this.body = Bodies.fromVertices(
              this.position.x, this.position.y, beamVertices, { isStatic: true }
            )
            Body.scale(this.body, scaleFactor, scaleFactor);
            this.width = this.body.bounds.max.x - this.body.bounds.min.x
            this.height = this.body.bounds.max.y - this.body.bounds.min.y
            this.xOffset = ((this.body.position.x - this.body.bounds.min.x) - (this.body.bounds.max.x - this.body.position.x)) / 2
            this.yOffset = ((this.body.position.y - this.body.bounds.min.y) - (this.body.bounds.max.y - this.body.position.y)) / 2
            Body.setPosition(this.body, {x: this.body.position.x + this.xOffset, y: this.body.position.y + this.yOffset})
            Composite.add(world, this.body)
          }

          render() {
            this.position.x = this.body.position.x
            this.position.y = this.body.position.y

            p.push()
            p.translate(this.body.position.x, this.body.position.y)
            p.image(this.img, -this.xOffset, -this.yOffset, this.width, this.height);
            p.pop()
          }
        }

        class Hill {
          constructor() {
            this.body = Bodies.rectangle(
              boards[0].body.position.x - 90 * scaleFactor,
              boards[0].body.position.y - 25 * scaleFactor, 
              300 * scaleFactor, 40 * scaleFactor, {
              isStatic: true,
              angle: 0.2
            })
            Composite.add(world, this.body)
          }
        }

        p.preload = () => {
          sprite_middle_board = p.loadImage("../sprite_middle_board.png")
          sprite_end_board = p.loadImage("../sprite_end_board.png")
          sprite_leg = p.loadImage("../sprite_leg.png")
          sprite_beam = p.loadImage("../sprite_beam.png")
          sprite_barrel = p.loadImage("../sprite_barrel.png")
          background = p.loadImage("../background.png")
          font = p.loadFont('../Afacad-Bold.ttf');
        }

        p.setup = () => {
          p.createCanvas(this.debug ? window.innerWidth / 2 : window.innerWidth, window.innerHeight).parent(document.querySelector('#container-custom'));
          p.imageMode(p.CENTER);
          
          boards.push(
            new MiddleBoard(),
            new MiddleBoard(),
            new MiddleBoard(),
            new MiddleBoard(),
            new MiddleBoard(),
            new EndBoard()
          )

          legs.push(
            new Leg(),
            new Leg()
          )

          beams.push(
            new Beam(),
            new Beam(),
            new Beam()
          )

          for (let b = 0; b < boards.length - 1; b++) {
            const currentPosition = boards[b].body.position
            const width = boards[b].width
            Body.setPosition(boards[b].body, {
              x: currentPosition.x - width * (3 - b), 
              y: currentPosition.y + window.innerHeight / 2 - width
            })
          }

          const lastBoard = boards[boards.length - 1]
          const secondLastBoard = boards[boards.length - 2]
          Body.setPosition(lastBoard.body, {
            x: lastBoard.body.position.x - lastBoard.body.bounds.min.x + secondLastBoard.body.bounds.max.x,
            y: lastBoard.body.position.y - lastBoard.body.bounds.max.y + secondLastBoard.body.bounds.max.y
          })

          for (let b = 0; b < beams.length; b++) {
            const currentPosition = beams[b].body.position
            const width = beams[b].width
            Body.setPosition(beams[b].body, {
              x: currentPosition.x + (width + legs[0].width) * (b - 1),
              y: currentPosition.y + boards[0].body.bounds.max.y - beams[b].body.bounds.min.y
            })
          }
          
          for (let l = 0; l < legs.length; l++) {
            const currentPosition = legs[l].body.position
            Body.setPosition(legs[l].body, {
              x: (beams[l + 1].body.position.x + beams[l].body.position.x) / 2,
              y: currentPosition.y + boards[0].body.bounds.max.y - legs[l].body.bounds.min.y
            })
          }

          hill = new Hill()

          function addBarrel(number) {
            const barrel = new Barrel(number, sprite_barrel)
            Body.setPosition(barrel.body, {
              x: hill.body.position.x - scaleFactor * 50,
              y: hill.body.position.y - scaleFactor * 120
            })
            barrels.unshift(barrel)
          }

          channel.addEventListener('message', (event) => {
            if (event.data.type === 'setNumber') {
              if (barrelIndex < 5) {
                addBarrel(event.data.value)
              } else {
                moveObjectsRight(() => {
                  addBarrel(event.data.value)
                })
              }
              barrelIndex++;
            }
          });

          console.log(boards)
        };

        p.draw = () => {
          p.push()
          p.imageMode(p.CORNER)
          p.image(background, 0, p.height - p.width / background.width * background.height, p.width, p.width / background.width * background.height);
          p.pop()
          if (!this.debug) Engine.update(engine)
          for (let board of boards) {
            board.render()
          }
          for (let leg of legs) {
            leg.render()
          }
          for (let beam of beams) {
            beam.render()
          }
          for (let barrel of barrels) {
            barrel.render()
          }
          p.strokeWeight(3)
          // p.line(p.width / 2, 0, p.width / 2, p.height)
        };

      };

      new p5(sketch);
    }
  }
}
</script>

<style lang="scss">
.container {
  width: 100%;
  height: 100%;
}

.modal {
  position: absolute;
  z-index: 9999;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: sans-serif;
    // width: 70vw;
    // height: 50vw;
    width: 100%;
    height: 100%;
    // border-radius: 2vw;
    // background-color: rgba(255, 255, 255, 1);
    background-image: url('../public/background_modal.png');
    background-size: cover;
    background-position: center, center;
  }

  &__content-title {
    font-size: 10vw;
    font-weight: bold;
    color: #BC1519;
    margin-bottom: 4vw;
  }

  &__winners-table {
    background-color: #FFF;
    display: flex;
    flex-direction: column;
    gap: 2vw;
    border-radius: 1vw;
    overflow: hidden;
  }

  &__winners-table-title {
    font-size: 5vw;
    margin-bottom: 1vw;
    text-align: center;
    background-color: #F4F06E;
    padding: 2vw;
  }

  &__winners-table-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 6vw;
    gap: 4vw;
    padding: 0 2vw;

    &:last-child{
      margin-bottom: 2vw;
    }
  }

  &__winners-table-number {
    font-weight: bold;
    color: #BC1519;
  }

  &__winners-table-name {
    
  }
}
</style>