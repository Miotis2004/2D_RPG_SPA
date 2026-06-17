import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { EditorStateService } from '../../../core/state/editor-state.service';

@Component({
  selector: 'app-render-viewport',
  templateUrl: './render-viewport.html',
  styleUrl: './render-viewport.scss',
})
export class RenderViewport implements AfterViewInit, OnDestroy {
  @ViewChild('viewportCanvas', { static: true }) private readonly viewportCanvas!: ElementRef<HTMLCanvasElement>;

  protected readonly editorState = inject(EditorStateService);
  private animationFrame = 0;
  private context?: CanvasRenderingContext2D;

  ngAfterViewInit(): void {
    const canvas = this.viewportCanvas.nativeElement;
    this.context = canvas.getContext('2d') ?? undefined;
    this.resizeCanvas();
    this.renderPreview();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrame);
  }

  private resizeCanvas(): void {
    const canvas = this.viewportCanvas.nativeElement;
    const bounds = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(bounds.width * window.devicePixelRatio));
    canvas.height = Math.max(1, Math.floor(bounds.height * window.devicePixelRatio));
  }

  private renderPreview(): void {
    if (!this.context) {
      return;
    }

    const canvas = this.viewportCanvas.nativeElement;
    const context = this.context;
    const tileSize = 32 * window.devicePixelRatio;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#101626';
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < canvas.width; x += tileSize) {
      for (let y = 0; y < canvas.height; y += tileSize) {
        context.fillStyle = (x / tileSize + y / tileSize) % 2 === 0 ? '#1b7f4c' : '#23633f';
        context.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
      }
    }

    context.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    context.lineWidth = window.devicePixelRatio;
    for (let x = 0; x < canvas.width; x += tileSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }
    for (let y = 0; y < canvas.height; y += tileSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }

    this.animationFrame = requestAnimationFrame(() => this.renderPreview());
  }
}
