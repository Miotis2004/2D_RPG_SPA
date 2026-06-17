export interface CameraState {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

export class Camera {
  private readonly minZoom = 0.25;
  private readonly maxZoom = 4;
  private cameraState: CameraState = { x: 0, y: 0, zoom: 1 };

  get state(): CameraState {
    return this.cameraState;
  }

  pan(deltaX: number, deltaY: number): void {
    this.cameraState = {
      ...this.cameraState,
      x: this.cameraState.x + deltaX / this.cameraState.zoom,
      y: this.cameraState.y + deltaY / this.cameraState.zoom,
    };
  }

  focus(x: number, y: number): void {
    this.cameraState = { ...this.cameraState, x, y };
  }

  setZoom(zoom: number, anchor?: { readonly x: number; readonly y: number }): void {
    const clampedZoom = Math.min(this.maxZoom, Math.max(this.minZoom, zoom));
    if (!anchor) {
      this.cameraState = { ...this.cameraState, zoom: clampedZoom };
      return;
    }

    const worldX = this.cameraState.x + anchor.x / this.cameraState.zoom;
    const worldY = this.cameraState.y + anchor.y / this.cameraState.zoom;

    this.cameraState = {
      x: worldX - anchor.x / clampedZoom,
      y: worldY - anchor.y / clampedZoom,
      zoom: clampedZoom,
    };
  }
}
