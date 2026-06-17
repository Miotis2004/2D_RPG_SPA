import { Component, computed, inject, signal } from '@angular/core';
import { DockingPanel } from '../../../shared/components/docking-panel/docking-panel';
import { TerrainType } from '../../../shared/models/tile';
import { TilesetService } from '../../services/tileset.service';

@Component({
  selector: 'app-tileset-editor',
  imports: [DockingPanel],
  templateUrl: './tileset-editor.html',
  styleUrl: './tileset-editor.scss',
})
export class TilesetEditor {
  protected readonly tilesetService = inject(TilesetService);
  protected readonly terrainTypes: readonly TerrainType[] = ['grass', 'water', 'forest', 'mountain', 'road', 'sand'];
  protected readonly importError = signal('');
  protected readonly selectedTileset = this.tilesetService.selectedTileset;
  protected readonly selectedTile = this.tilesetService.selectedTile;
  protected readonly gridStyle = computed(() => ({
    gridTemplateColumns: `repeat(${this.selectedTileset()?.columns ?? 1}, minmax(1.9rem, 1fr))`,
  }));

  protected async importTileset(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.importError.set('');
    try {
      await this.tilesetService.importPng(file);
    } catch (error) {
      this.importError.set(error instanceof Error ? error.message : 'Unable to import tileset.');
    } finally {
      input.value = '';
    }
  }
}
