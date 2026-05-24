const WORLD_SCALE = 2;
const TILE_SIZE = 48 * WORLD_SCALE;
const GAME_WIDTH = 960 * WORLD_SCALE;
const GAME_HEIGHT = 540 * WORLD_SCALE;
const WORLD_WIDTH = 3000 * WORLD_SCALE;

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
    this.load.spritesheet("girl", "assets/sporty-girl-sheet.png", {
      frameWidth: 362,
      frameHeight: 362
    });
    this.createTileTexture("ground", TILE_SIZE, TILE_SIZE, 0x6f4e37, 0x8b6f47, 0x3f2f25);
    this.createTileTexture("grass", TILE_SIZE, 16 * WORLD_SCALE, 0x2d8f5a, 0x47c878, 0x1f6f45);
    this.createAnimatedTileTexture();
    this.createFlagTexture();
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.createBackground();
    this.createAnimatedTilesLayer();

    const platforms = this.physics.add.staticGroup();
    this.createCourse(platforms);

    this.createPlayerAnimations();

    this.player = this.physics.add.sprite(90 * WORLD_SCALE, 380 * WORLD_SCALE, "girl", 0);
    this.player.setScale(1);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(142, 245);
    this.player.body.setOffset(108, 78);
    this.player.standBody = { width: 142, height: 245, offsetX: 108, offsetY: 78 };
    this.player.crouchBody = { width: 160, height: 176, offsetX: 101, offsetY: 147 };
    this.player.isCrouching = false;
    this.player.setDragX(1800);
    this.player.setMaxVelocity(500, 1040);

    this.physics.add.collider(this.player, platforms);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(320, 240);

    const flag = this.physics.add.staticSprite(2865 * WORLD_SCALE, 400 * WORLD_SCALE, "flag");
    flag.body.setSize(52 * WORLD_SCALE, 128 * WORLD_SCALE);
    flag.body.setOffset(7 * WORLD_SCALE, 0);
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
      .text(24, 20, "A/D: move  W/Space: jump  S: crouch", {
        fontFamily: "monospace",
        fontSize: "28px",
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
      this.player.anims.play("idle", true);
      return;
    }

    const movingLeft = this.keys.left.isDown || this.cursors.left.isDown;
    const movingRight = this.keys.right.isDown || this.cursors.right.isDown;
    const grounded = this.player.body.blocked.down;
    const wantsCrouch = this.keys.down.isDown || this.cursors.down.isDown;
    const isCrouching = wantsCrouch && grounded;
    const wantsJump =
      Phaser.Input.Keyboard.JustDown(this.keys.jump) ||
      Phaser.Input.Keyboard.JustDown(this.keys.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up);

    this.setPlayerCrouch(isCrouching);

    if (isCrouching) {
      this.player.setAccelerationX(0);
      this.player.setVelocityX(0);
    } else if (movingLeft) {
      this.player.setAccelerationX(-2400);
      this.player.setFlipX(true);
    } else if (movingRight) {
      this.player.setAccelerationX(2400);
      this.player.setFlipX(false);
    } else {
      this.player.setAccelerationX(0);
    }

    if (wantsCrouch && !grounded) {
      this.player.setVelocityY(Math.min(this.player.body.velocity.y + 48, 1040));
    }

    if (wantsJump && grounded) {
      this.player.setVelocityY(-980);
    }

    if (!grounded) {
      this.player.anims.play("jump", true);
    } else if (isCrouching) {
      this.player.anims.play("crouch", true);
    } else if (Math.abs(this.player.body.velocity.x) > 20) {
      this.player.anims.play("run", true);
    } else {
      this.player.anims.play("idle", true);
    }

    if (this.player.y > GAME_HEIGHT + 160) {
      this.scene.restart();
    }
  }

  handleClear() {
    if (this.cleared) return;
    this.cleared = true;
    this.player.setTint(0xfff3a3);
    this.player.anims.play("idle", true);
    this.statusText.setText("CLEAR! Press R to restart");
  }

  setPlayerCrouch(isCrouching) {
    if (this.player.isCrouching === isCrouching) return;
    this.player.isCrouching = isCrouching;
    const body = isCrouching ? this.player.crouchBody : this.player.standBody;
    this.player.body.setSize(body.width, body.height);
    this.player.body.setOffset(body.offsetX, body.offsetY);
  }

  createPlayerAnimations() {
    this.anims.create({
      key: "idle",
      frames: this.anims.generateFrameNumbers("girl", { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1
    });

    this.anims.create({
      key: "run",
      frames: this.anims.generateFrameNumbers("girl", { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: "jump",
      frames: this.anims.generateFrameNumbers("girl", { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: "crouch",
      frames: [{ key: "girl", frame: 13 }],
      frameRate: 1,
      repeat: 0
    });
  }

  createCourse(platforms) {
    const addBlock = (x, y, widthInTiles, heightInTiles = 1) => {
      for (let row = 0; row < heightInTiles; row += 1) {
        for (let col = 0; col < widthInTiles; col += 1) {
          const block = platforms.create(x * WORLD_SCALE + col * TILE_SIZE, y * WORLD_SCALE + row * TILE_SIZE, "ground");
          block.setOrigin(0, 0);
          block.refreshBody();
        }
      }
      for (let col = 0; col < widthInTiles; col += 1) {
        const grass = this.add.image(x * WORLD_SCALE + col * TILE_SIZE, y * WORLD_SCALE - 10 * WORLD_SCALE, "grass");
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

  createAnimatedTilesLayer() {
    const mapWidth = Math.ceil(WORLD_WIDTH / TILE_SIZE);
    const mapHeight = Math.ceil(GAME_HEIGHT / TILE_SIZE);
    const data = new Array(mapWidth * mapHeight).fill(0);
    const waterRow = 9;

    const addAnimatedTiles = (startCol, width) => {
      for (let col = startCol; col < startCol + width; col += 1) {
        data[waterRow * mapWidth + col] = 1;
      }
    };

    addAnimatedTiles(14, 2);
    addAnimatedTiles(25, 3);
    addAnimatedTiles(38, 5);

    const animatedMap = {
      compressionlevel: -1,
      height: mapHeight,
      infinite: false,
      layers: [
        {
          data,
          height: mapHeight,
          id: 1,
          name: "Animated Water",
          opacity: 1,
          type: "tilelayer",
          visible: true,
          width: mapWidth,
          x: 0,
          y: 0
        }
      ],
      nextlayerid: 2,
      nextobjectid: 1,
      orientation: "orthogonal",
      renderorder: "right-down",
      tiledversion: "1.10.2",
      tileheight: TILE_SIZE,
      tilesets: [
        {
          columns: 4,
          firstgid: 1,
          image: "animated-water.png",
          imageheight: TILE_SIZE,
          imagewidth: TILE_SIZE * 4,
          margin: 0,
          name: "animated-water",
          spacing: 0,
          tilecount: 4,
          tileheight: TILE_SIZE,
          tiles: [
            {
              animation: [
                { duration: 170, tileid: 0 },
                { duration: 170, tileid: 1 },
                { duration: 170, tileid: 2 },
                { duration: 170, tileid: 3 }
              ],
              id: 0
            }
          ],
          tilewidth: TILE_SIZE
        }
      ],
      tilewidth: TILE_SIZE,
      type: "map",
      version: "1.10",
      width: mapWidth
    };

    this.cache.tilemap.add("animated-course", {
      data: animatedMap,
      format: Phaser.Tilemaps.Formats.TILED_JSON
    });

    const map = this.make.tilemap({ key: "animated-course" });
    const tileset = map.addTilesetImage("animated-water", "animatedWater");
    const layer = map.createLayer("Animated Water", tileset, 0, 0);
    layer.setDepth(0);

    const animatedTiles = this.sys.animatedTiles || this.animatedTiles;
    if (animatedTiles) {
      animatedTiles.init(map);
    }
  }

  createBackground() {
    this.cameras.main.setBackgroundColor("#80c7ef");

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x78c6ef, 0x78c6ef, 0xd8f3ff, 0xd8f3ff, 1);
    sky.fillRect(0, 0, WORLD_WIDTH, GAME_HEIGHT);

    const sun = this.add.circle(180 * WORLD_SCALE, 96 * WORLD_SCALE, 38 * WORLD_SCALE, 0xffdd6e);
    sun.setScrollFactor(0.25);

    const hills = this.add.graphics();
    hills.fillStyle(0x5cad75, 1);
    hills.fillEllipse(420 * WORLD_SCALE, 500 * WORLD_SCALE, 900 * WORLD_SCALE, 260 * WORLD_SCALE);
    hills.fillEllipse(1250 * WORLD_SCALE, 510 * WORLD_SCALE, 1100 * WORLD_SCALE, 300 * WORLD_SCALE);
    hills.fillEllipse(2350 * WORLD_SCALE, 500 * WORLD_SCALE, 1000 * WORLD_SCALE, 270 * WORLD_SCALE);
    hills.setDepth(-1);
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

  createAnimatedTileTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });

    for (let frame = 0; frame < 4; frame += 1) {
      const x = frame * TILE_SIZE;
      const waveOffset = frame * 8 * WORLD_SCALE;
      graphics.fillStyle(0x1e7fc9, 1);
      graphics.fillRect(x, 0, TILE_SIZE, TILE_SIZE);
      graphics.fillStyle(0x58c7f6, 1);
      graphics.fillRect(x, 0, TILE_SIZE, 18 * WORLD_SCALE);
      graphics.fillStyle(0x9ae6ff, 0.95);

      for (let wave = -1; wave < 4; wave += 1) {
        const waveX = x + wave * 34 * WORLD_SCALE + waveOffset;
        graphics.fillEllipse(waveX, 17 * WORLD_SCALE, 32 * WORLD_SCALE, 8 * WORLD_SCALE);
      }

      graphics.fillStyle(0x155f9d, 1);
      graphics.fillRect(x, 52 * WORLD_SCALE, TILE_SIZE, 10 * WORLD_SCALE);
      graphics.fillStyle(0x0d4d83, 0.9);
      graphics.fillRect(x, 76 * WORLD_SCALE, TILE_SIZE, 20 * WORLD_SCALE);
    }

    graphics.generateTexture("animatedWater", TILE_SIZE * 4, TILE_SIZE);
    graphics.destroy();
  }

  createFlagTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xeeeeee, 1);
    graphics.fillRect(10 * WORLD_SCALE, 0, 7 * WORLD_SCALE, 132 * WORLD_SCALE);
    graphics.fillStyle(0xf05365, 1);
    graphics.fillTriangle(17 * WORLD_SCALE, 8 * WORLD_SCALE, 70 * WORLD_SCALE, 28 * WORLD_SCALE, 17 * WORLD_SCALE, 50 * WORLD_SCALE);
    graphics.fillStyle(0xd43d56, 1);
    graphics.fillTriangle(17 * WORLD_SCALE, 50 * WORLD_SCALE, 58 * WORLD_SCALE, 67 * WORLD_SCALE, 17 * WORLD_SCALE, 67 * WORLD_SCALE);
    graphics.fillStyle(0x58412f, 1);
    graphics.fillRect(0, 128 * WORLD_SCALE, 34 * WORLD_SCALE, 8 * WORLD_SCALE);
    graphics.generateTexture("flag", 74 * WORLD_SCALE, 136 * WORLD_SCALE);
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
      gravity: { y: 1960 },
      debug: false
    }
  },
  plugins: {
    scene: [
      {
        key: "animatedTiles",
        plugin: window["AnimatedTiles.min"],
        mapping: "animatedTiles"
      }
    ]
  },
  scene: MainScene
};

new Phaser.Game(config);
