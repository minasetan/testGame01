const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const WORLD_WIDTH = 3000;

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
    this.player = null;
    this.cursors = null;
    this.keys = null;
    this.statusText = null;
    this.cleared = false;
  }

  preload() {
    this.createPixelGirlTexture();
    this.createTileTexture("ground", 48, 48, 0x6f4e37, 0x8b6f47, 0x3f2f25);
    this.createTileTexture("grass", 48, 16, 0x2d8f5a, 0x47c878, 0x1f6f45);
    this.createFlagTexture();
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.createBackground();

    const platforms = this.physics.add.staticGroup();
    this.createCourse(platforms);

    this.player = this.physics.add.sprite(90, 380, "girl");
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(24, 38);
    this.player.body.setOffset(12, 10);
    this.player.setDragX(900);
    this.player.setMaxVelocity(250, 520);

    this.physics.add.collider(this.player, platforms);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(160, 120);

    const flag = this.physics.add.staticSprite(2865, 400, "flag");
    flag.body.setSize(52, 128);
    flag.body.setOffset(7, 0);
    this.physics.add.overlap(this.player, flag, () => this.handleClear(), null, this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      restart: Phaser.Input.Keyboard.KeyCodes.R
    });

    this.statusText = this.add
      .text(24, 20, "A/D: move  W/Space: jump", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#f8fafc",
        backgroundColor: "rgba(16, 24, 39, 0.55)",
        padding: { x: 12, y: 8 }
      })
      .setScrollFactor(0)
      .setDepth(10);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) {
      this.scene.restart();
      return;
    }

    if (this.cleared) {
      this.player.setVelocityX(0);
      this.player.anims.stop();
      return;
    }

    const movingLeft = this.keys.left.isDown || this.cursors.left.isDown;
    const movingRight = this.keys.right.isDown || this.cursors.right.isDown;
    const wantsJump =
      Phaser.Input.Keyboard.JustDown(this.keys.jump) ||
      Phaser.Input.Keyboard.JustDown(this.keys.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up);

    if (movingLeft) {
      this.player.setAccelerationX(-1200);
      this.player.setFlipX(true);
    } else if (movingRight) {
      this.player.setAccelerationX(1200);
      this.player.setFlipX(false);
    } else {
      this.player.setAccelerationX(0);
    }

    if (this.keys.down.isDown && !this.player.body.blocked.down) {
      this.player.setVelocityY(Math.min(this.player.body.velocity.y + 24, 520));
    }

    if (wantsJump && this.player.body.blocked.down) {
      this.player.setVelocityY(-405);
    }

    if (this.player.y > GAME_HEIGHT + 80) {
      this.scene.restart();
    }
  }

  handleClear() {
    if (this.cleared) return;
    this.cleared = true;
    this.player.setTint(0xfff3a3);
    this.statusText.setText("CLEAR! Press R to restart");
  }

  createCourse(platforms) {
    const addBlock = (x, y, widthInTiles, heightInTiles = 1) => {
      for (let row = 0; row < heightInTiles; row += 1) {
        for (let col = 0; col < widthInTiles; col += 1) {
          const block = platforms.create(x + col * 48, y + row * 48, "ground");
          block.setOrigin(0, 0);
          block.refreshBody();
        }
      }
      for (let col = 0; col < widthInTiles; col += 1) {
        const grass = this.add.image(x + col * 48, y - 10, "grass");
        grass.setOrigin(0, 0);
      }
    };

    addBlock(0, 468, 14, 2);
    addBlock(760, 468, 9, 2);
    addBlock(1320, 468, 10, 2);
    addBlock(2050, 468, 21, 2);

    addBlock(420, 374, 3);
    addBlock(650, 318, 3);
    addBlock(1030, 390, 4);
    addBlock(1250, 326, 3);
    addBlock(1570, 386, 4);
    addBlock(1810, 318, 3);
    addBlock(2230, 370, 3);
    addBlock(2450, 316, 4);
    addBlock(2710, 388, 5);
  }

  createBackground() {
    this.cameras.main.setBackgroundColor("#80c7ef");

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x78c6ef, 0x78c6ef, 0xd8f3ff, 0xd8f3ff, 1);
    sky.fillRect(0, 0, WORLD_WIDTH, GAME_HEIGHT);

    const sun = this.add.circle(180, 96, 38, 0xffdd6e);
    sun.setScrollFactor(0.25);

    const hills = this.add.graphics();
    hills.fillStyle(0x5cad75, 1);
    hills.fillEllipse(420, 500, 900, 260);
    hills.fillEllipse(1250, 510, 1100, 300);
    hills.fillEllipse(2350, 500, 1000, 270);
    hills.setDepth(-1);
  }

  createPixelGirlTexture() {
    const data = [
      "................",
      ".....333333.....",
      "....33333333....",
      "...3332222333...",
      "...3322222233...",
      "...3322022233...",
      "....22222222....",
      ".....220022.....",
      "....55555555....",
      "...5555555555...",
      "..115555555511..",
      ".11155555555111.",
      "....55555555....",
      "....55555555....",
      "....777..777....",
      "...7777..7777...",
      "...7777..7777...",
      "...1111..1111..."
    ];
    const colors = {
      1: "#2f2f3a",
      2: "#ffd1b3",
      3: "#46312a",
      5: "#e85d8d",
      7: "#4d5bd5"
    };
    this.textures.generate("girl", {
      data,
      pixelWidth: 3,
      palette: colors
    });
  }

  createTileTexture(key, width, height, main, highlight, shadow) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(main, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.fillStyle(highlight, 1);
    graphics.fillRect(0, 0, width, Math.max(4, Math.floor(height / 4)));
    graphics.fillStyle(shadow, 1);
    graphics.fillRect(0, height - 5, width, 5);
    graphics.lineStyle(2, shadow, 0.55);
    graphics.strokeRect(0, 0, width, height);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  createFlagTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xeeeeee, 1);
    graphics.fillRect(10, 0, 7, 132);
    graphics.fillStyle(0xf05365, 1);
    graphics.fillTriangle(17, 8, 70, 28, 17, 50);
    graphics.fillStyle(0xd43d56, 1);
    graphics.fillTriangle(17, 50, 58, 67, 17, 67);
    graphics.fillStyle(0x58412f, 1);
    graphics.fillRect(0, 128, 34, 8);
    graphics.generateTexture("flag", 74, 136);
    graphics.destroy();
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  backgroundColor: "#80c7ef",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 980 },
      debug: false
    }
  },
  scene: MainScene
};

new Phaser.Game(config);
