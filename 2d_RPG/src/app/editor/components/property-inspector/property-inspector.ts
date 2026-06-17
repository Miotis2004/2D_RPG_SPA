import { Component, inject } from '@angular/core';
import { DockingPanel } from '../../../shared/components/docking-panel/docking-panel';
import { EditorStateService } from '../../../core/state/editor-state.service';
import { TilesetService } from '../../services/tileset.service';
import { MapEditorService } from '../../services/map-editor.service';

@Component({
  selector: 'app-property-inspector',
  imports: [DockingPanel],
  templateUrl: './property-inspector.html',
  styleUrl: './property-inspector.scss',
})
export class PropertyInspector {
  protected readonly editorState = inject(EditorStateService);
  protected readonly tilesetService = inject(TilesetService);
  protected readonly mapEditor = inject(MapEditorService);
}
