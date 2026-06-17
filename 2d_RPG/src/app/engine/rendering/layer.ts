import { Container, Graphics } from 'pixi.js';
import { Viewport } from './viewport';

export interface TileLayerOptions {
  readonly name: string;
  readonly tileSize: number;
  readonly parallax?: number;
}

export class Layer {
  readonly container = new Container();
  private readonly graphics = new Graphics();
  private readonly parallax: number;

  constructor(private readonly options: TileLayerOptions) {
    this.parallax = options.parallax ?? 1;
    this.container.label = options.name;
    this.container.addChild(this.graphics);
  }

  render(viewport: Viewport): void {
    const bounds = viewport.bounds;
    const tileSize = this.options.tileSize;
    const startColumn = Math.floor(bounds.left / tileSize) - 1;
    const endColumn = Math.ceil(bounds.right / tileSize) + 1;
    const startRow = Math.floor(bounds.top / tileSize) - 1;
    const endRow = Math.ceil(bounds.bottom / tileSize) + 1;

    this.container.position.set(
      -bounds.left * viewport.cameraState.zoom * this.parallax,
      -bounds.top * viewport.cameraState.zoom * this.parallax,
    );
    this.container.scale.set(viewport.cameraState.zoom);

    this.graphics.clear();
    for (let column = startColumn; column <= endColumn; column++) {
      for (let row = startRow; row <= endRow; row++) {
        const isAlt = Math.abs(column + row) % 2 === 0;
        const color = isAlt ? 0x1b7f4c : 0x23633f;
        this.graphics.rect(column * tileSize, row * tileSize, tileSize, tileSize).fill(color);
      }
    }
  }
}
