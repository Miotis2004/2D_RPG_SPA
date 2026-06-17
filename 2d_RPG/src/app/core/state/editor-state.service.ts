import { Injectable, computed, signal } from '@angular/core';

export type EditorTool = 'select' | 'paint' | 'erase' | 'events' | 'collision' | 'terrain';

export interface EditorPanelState {
  readonly activeTool: EditorTool;
  readonly selectedAssetId: string;
  readonly zoom: number;
}

@Injectable({ providedIn: 'root' })
export class EditorStateService {
  private readonly state = signal<EditorPanelState>({
    activeTool: 'select',
    selectedAssetId: 'grasslands-tileset',
    zoom: 1,
  });

  readonly activeTool = computed(() => this.state().activeTool);
  readonly selectedAssetId = computed(() => this.state().selectedAssetId);
  readonly zoom = computed(() => this.state().zoom);

  setActiveTool(activeTool: EditorTool): void {
    this.state.update((current) => ({ ...current, activeTool }));
  }

  selectAsset(selectedAssetId: string): void {
    this.state.update((current) => ({ ...current, selectedAssetId }));
  }

  setZoom(zoom: number): void {
    this.state.update((current) => ({ ...current, zoom }));
  }
}
