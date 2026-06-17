import { DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { EditorStateService } from '../../../core/state/editor-state.service';
import { Renderer, RendererSnapshot } from '../../rendering/renderer';

@Component({
  selector: 'app-render-viewport',
  imports: [DecimalPipe],
  templateUrl: './render-viewport.html',
  styleUrl: './render-viewport.scss',
})
export class RenderViewport implements AfterViewInit, OnDestroy {
  @ViewChild('viewportHost', { static: true })
  private readonly viewportHost!: ElementRef<HTMLElement>;

  protected readonly editorState = inject(EditorStateService);
  protected readonly rendererSnapshot = signal<RendererSnapshot>({
    cameraX: 0,
    cameraY: 0,
    zoom: 1,
    visibleTiles: 0,
  });
  private readonly renderer = new Renderer();
  private readonly resizeObserver = new ResizeObserver(() => this.renderer.resize());
  private pointerId?: number;
  private lastPointer?: { readonly x: number; readonly y: number };

  async ngAfterViewInit(): Promise<void> {
    const host = this.viewportHost.nativeElement;
    await this.renderer.initialize(host);
    this.resizeObserver.observe(host);
    this.syncSnapshot();
  }

  ngOnDestroy(): void {
    this.resizeObserver.disconnect();
    this.renderer.destroy();
  }

  protected startPan(event: PointerEvent): void {
    this.pointerId = event.pointerId;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.viewportHost.nativeElement.setPointerCapture(event.pointerId);
  }

  protected pan(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId || !this.lastPointer) {
      return;
    }

    const deltaX = this.lastPointer.x - event.clientX;
    const deltaY = this.lastPointer.y - event.clientY;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.rendererSnapshot.set(this.renderer.pan(deltaX, deltaY));
  }

  protected stopPan(event: PointerEvent): void {
    if (this.pointerId === event.pointerId) {
      this.pointerId = undefined;
      this.lastPointer = undefined;
    }
  }

  protected zoom(event: WheelEvent): void {
    event.preventDefault();
    const bounds = this.viewportHost.nativeElement.getBoundingClientRect();
    const snapshot = this.renderer.zoomAt(event.deltaY, {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
    this.rendererSnapshot.set(snapshot);
    this.editorState.setZoom(Math.round(snapshot.zoom * 100) / 100);
  }

  private syncSnapshot(): void {
    this.rendererSnapshot.set(this.renderer.currentSnapshot());
  }
}
