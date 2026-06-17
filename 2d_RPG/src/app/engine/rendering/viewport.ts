import { Camera, CameraState } from './camera';

export interface ViewportBounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
}

export class Viewport {
  constructor(
    readonly camera: Camera,
    private screenWidth = 1,
    private screenHeight = 1,
  ) {}

  resize(width: number, height: number): void {
    this.screenWidth = Math.max(1, width);
    this.screenHeight = Math.max(1, height);
  }

  get cameraState(): CameraState {
    return this.camera.state;
  }

  get bounds(): ViewportBounds {
    const { x, y, zoom } = this.camera.state;
    const width = this.screenWidth / zoom;
    const height = this.screenHeight / zoom;

    return {
      left: x,
      top: y,
      right: x + width,
      bottom: y + height,
      width,
      height,
    };
  }
}
