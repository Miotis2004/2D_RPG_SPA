import { Component, inject } from '@angular/core';
import { DockingPanel } from '../../../shared/components/docking-panel/docking-panel';
import { EditorStateService } from '../../../core/state/editor-state.service';

interface AssetEntry {
  readonly id: string;
  readonly name: string;
  readonly type: string;
}

@Component({
  selector: 'app-asset-browser',
  imports: [DockingPanel],
  templateUrl: './asset-browser.html',
  styleUrl: './asset-browser.scss',
})
export class AssetBrowser {
  protected readonly editorState = inject(EditorStateService);
  protected readonly assets: readonly AssetEntry[] = [
    { id: 'grasslands-tileset', name: 'Grasslands', type: 'Tileset' },
    { id: 'hero-sprite', name: 'Hero', type: 'Character' },
    { id: 'village-map', name: 'Village', type: 'Map' },
  ];
}
