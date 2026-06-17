import { Application, Container, Graphics } from 'pixi.js';
import { Camera } from './camera';
import { Layer } from './layer';
import { Viewport } from './viewport';

export interface RendererSnapshot {
  readonly cameraX: number;
  readonly cameraY: number;
  readonly zoom: number;
  readonly visibleTiles: number;
}

export class Renderer {
  readonly camera = new Camera();
  readonly viewport = new Viewport(this.camera);
  private readonly layers: Layer[] = [new Layer({ name: 'Ground', tileSize: 32 })];
  private readonly world = new Container();
  private readonly debugOverlay = new Graphics();
  private app?: Application;
  private snapshot: RendererSnapshot = { cameraX: 0, cameraY: 0, zoom: 1, visibleTiles: 0 };

  async initialize(host: HTMLElement): Promise<void> {
    this.app = new Application();
    await this.app.init({ antialias: false, background: '#101626', resizeTo: host });
    host.appendChild(this.app.canvas);
    this.world.addChild(...this.layers.map((layer) => layer.container), this.debugOverlay);
    this.app.stage.addChild(this.world);
    this.app.ticker.add(() => this.render());
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

  currentSnapshot(): RendererSnapshot {
    return this.snapshot;
  }

  private render(): RendererSnapshot {
    this.layers.forEach((layer) => layer.render(this.viewport));
    this.renderDebugOverlay();
    const bounds = this.viewport.bounds;
    const visibleTiles = Math.ceil(bounds.width / 32) * Math.ceil(bounds.height / 32);
    this.snapshot = {
      cameraX: Math.round(this.camera.state.x),
      cameraY: Math.round(this.camera.state.y),
      zoom: this.camera.state.zoom,
      visibleTiles,
    };
    return this.snapshot;
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
