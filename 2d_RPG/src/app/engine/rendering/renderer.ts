import { Application, Container, Graphics } from 'pixi.js';
import { PlayerState } from '../../shared/models/player';
import { GameMap } from '../../shared/models/map';
import { Camera } from './camera';
import { Layer } from './layer';
import { Viewport } from './viewport';
import { MapRenderer } from './map-renderer';

export interface RendererSnapshot {
  readonly cameraX: number;
  readonly cameraY: number;
  readonly zoom: number;
  readonly visibleTiles: number;
}

export class Renderer {
  readonly camera = new Camera();
  readonly viewport = new Viewport(this.camera);
  private readonly layers: Layer[] = [new Layer({ name: 'Background', tileSize: 32 })];
  private readonly mapRenderer = new MapRenderer();
  private readonly world = new Container();
  private readonly debugOverlay = new Graphics();
  private readonly playerLayer = new Graphics();
  private app?: Application;
  private snapshot: RendererSnapshot = { cameraX: 0, cameraY: 0, zoom: 1, visibleTiles: 0 };

  async initialize(host: HTMLElement): Promise<void> {
    this.app = new Application();
    await this.app.init({ antialias: false, background: '#101626', resizeTo: host });
    host.appendChild(this.app.canvas);
    this.world.addChild(...this.layers.map((layer) => layer.container), this.mapRenderer.container, this.playerLayer, this.debugOverlay);
    this.app.stage.addChild(this.world);
    this.resize();
  }

  destroy(): void {
    this.app?.destroy(true, { children: true, texture: true });
  }

  resize(): void {
    if (!this.app) {
      return;
    }
    this.viewport.resize(this.app.screen.width, this.app.screen.height);
  }

  pan(deltaX: number, deltaY: number): RendererSnapshot {
    this.camera.pan(deltaX, deltaY);
    return this.render();
  }

  zoomAt(delta: number, anchor: { readonly x: number; readonly y: number }): RendererSnapshot {
    this.camera.setZoom(this.camera.state.zoom * (delta > 0 ? 0.9 : 1.1), anchor);
    return this.render();
  }

  focus(x = 0, y = 0): RendererSnapshot {
    this.camera.focus(x, y);
    return this.render();
  }

  screenToTile(point: { readonly x: number; readonly y: number }, tileSize: number): { readonly column: number; readonly row: number } {
    return {
      column: Math.floor((this.camera.state.x + point.x / this.camera.state.zoom) / tileSize),
      row: Math.floor((this.camera.state.y + point.y / this.camera.state.zoom) / tileSize),
    };
  }

  currentSnapshot(): RendererSnapshot {
    return this.snapshot;
  }

  renderMap(gameMap: GameMap, player?: PlayerState): RendererSnapshot {
    return this.render(gameMap, player);
  }

  private render(gameMap?: GameMap, player?: PlayerState): RendererSnapshot {
    this.layers.forEach((layer) => layer.render(this.viewport));
    const bounds = this.viewport.bounds;
    const visibleTiles = gameMap ? this.mapRenderer.render(gameMap, this.viewport) : Math.ceil(bounds.width / 32) * Math.ceil(bounds.height / 32);
    this.renderPlayer(gameMap, player);
    this.renderDebugOverlay();
    this.snapshot = {
      cameraX: Math.round(this.camera.state.x),
      cameraY: Math.round(this.camera.state.y),
      zoom: this.camera.state.zoom,
      visibleTiles,
    };
    return this.snapshot;
  }

  private renderPlayer(gameMap?: GameMap, player?: PlayerState): void {
    this.playerLayer.clear();
    if (!gameMap || !player) {
      return;
    }

    const tileSize = gameMap.tileSize * this.camera.state.zoom;
    const screenX = (player.x * gameMap.tileSize - this.camera.state.x) * this.camera.state.zoom;
    const screenY = (player.y * gameMap.tileSize - this.camera.state.y) * this.camera.state.zoom;
    const bob = player.moving ? Math.sin(player.animationFrame * Math.PI) * 2 * this.camera.state.zoom : 0;
    const bodyColor = player.running ? 0xffb347 : 0x4f8cff;
    const facingOffset = { up: [0, -4], down: [0, 4], left: [-4, 0], right: [4, 0] }[player.direction];

    this.playerLayer
      .rect(screenX + tileSize * 0.18, screenY + tileSize * 0.15 + bob, tileSize * 0.64, tileSize * 0.78)
      .fill({ color: bodyColor })
      .stroke({ color: 0xffffff, alpha: 0.85, width: Math.max(1, this.camera.state.zoom) });
    this.playerLayer
      .circle(screenX + tileSize / 2 + facingOffset[0] * this.camera.state.zoom, screenY + tileSize * 0.35 + bob + facingOffset[1] * this.camera.state.zoom, tileSize * 0.11)
      .fill({ color: 0x101626 });
  }

  private renderDebugOverlay(): void {
    const tileSize = 32 * this.camera.state.zoom;
    const width = this.app?.screen.width ?? 0;
    const height = this.app?.screen.height ?? 0;

    this.debugOverlay.clear();
    for (
      let x = -((this.camera.state.x * this.camera.state.zoom) % tileSize);
      x < width;
      x += tileSize
    ) {
      this.debugOverlay
        .moveTo(x, 0)
        .lineTo(x, height)
        .stroke({ color: 0xffffff, alpha: 0.16, width: 1 });
    }
    for (
      let y = -((this.camera.state.y * this.camera.state.zoom) % tileSize);
      y < height;
      y += tileSize
    ) {
      this.debugOverlay
        .moveTo(0, y)
        .lineTo(width, y)
        .stroke({ color: 0xffffff, alpha: 0.16, width: 1 });
    }
  }
}
