import { DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  effect,
  signal,
} from '@angular/core';
import { EditorStateService } from '../../../core/state/editor-state.service';
import { Renderer, RendererSnapshot } from '../../rendering/renderer';
import { MapEditorService } from '../../../editor/services/map-editor.service';
import { TilesetService } from '../../../editor/services/tileset.service';
import { CollisionSystem } from '../../collision/collision-system';

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
  protected readonly mapEditor = inject(MapEditorService);
  private readonly tilesetService = inject(TilesetService);
  private readonly collisionSystem = inject(CollisionSystem);
  protected readonly movementPreview = signal('Movement validator ready');
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
  private dragStartTile?: { readonly column: number; readonly row: number };

  constructor() {
    effect(() => {
      const gameMap = this.mapEditor.map();
      this.rendererSnapshot.set(this.renderer.renderMap(gameMap));
    });
  }

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
    this.dragStartTile = this.tileFromEvent(event);
    this.viewportHost.nativeElement.setPointerCapture(event.pointerId);

    if (this.editorState.activeTool() === 'select' || event.button === 1) {
      return;
    }

    this.applyTool(this.dragStartTile);
  }

  protected pan(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId || !this.lastPointer) {
      return;
    }

    if (this.editorState.activeTool() === 'select' || event.buttons === 4) {
      const deltaX = this.lastPointer.x - event.clientX;
      const deltaY = this.lastPointer.y - event.clientY;
      this.lastPointer = { x: event.clientX, y: event.clientY };
      this.rendererSnapshot.set(this.renderer.pan(deltaX, deltaY));
      return;
    }

    this.lastPointer = { x: event.clientX, y: event.clientY };
    if (this.editorState.activeTool() === 'paint' || this.editorState.activeTool() === 'erase' || this.editorState.activeTool() === 'collision') {
      this.applyTool(this.tileFromEvent(event));
    }
  }

  protected stopPan(event: PointerEvent): void {
    if (this.pointerId === event.pointerId) {
      if (this.dragStartTile) {
        this.finishDragTool(this.tileFromEvent(event));
      }
      this.pointerId = undefined;
      this.lastPointer = undefined;
      this.dragStartTile = undefined;
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

  protected focusMap(): void {
    this.rendererSnapshot.set(this.renderer.focus(0, 0));
  }

  private applyTool(tile: { readonly column: number; readonly row: number }): void {
    const selectedTile = this.tilesetService.selectedTile();
    switch (this.editorState.activeTool()) {
      case 'paint':
        if (selectedTile) this.mapEditor.paintTile(tile.column, tile.row, selectedTile.id);
        break;
      case 'erase':
        this.mapEditor.eraseTile(tile.column, tile.row);
        break;
      case 'collision':
        this.mapEditor.toggleCollision(tile.column, tile.row);
        break;
      case 'fill':
        if (selectedTile) this.mapEditor.fill(selectedTile.id);
        break;
    }
  }

  private finishDragTool(tile: { readonly column: number; readonly row: number }): void {
    const selectedTile = this.tilesetService.selectedTile();
    if (!selectedTile || !this.dragStartTile) return;
    if (this.editorState.activeTool() === 'rectangle') {
      this.mapEditor.paintRectangle(this.dragStartTile, tile, selectedTile.id);
    }
    if (this.editorState.activeTool() === 'circle') {
      this.mapEditor.paintCircle(this.dragStartTile, tile, selectedTile.id);
    }
  }

  private tileFromEvent(event: PointerEvent): { readonly column: number; readonly row: number } {
    const bounds = this.viewportHost.nativeElement.getBoundingClientRect();
    const tile = this.renderer.screenToTile({ x: event.clientX - bounds.left, y: event.clientY - bounds.top }, this.mapEditor.map().tileSize);
    const validation = this.collisionSystem.validateMovement(this.mapEditor.map(), tile, this.tilesetService.tilesets());
    this.movementPreview.set(validation.valid ? `Open: ${tile.column}, ${tile.row}` : `Blocked: ${validation.hits.map((hit) => hit.name).join(', ')}`);
    return tile;
  }

  private syncSnapshot(): void {
    this.rendererSnapshot.set(this.renderer.renderMap(this.mapEditor.map()));
  }
}
