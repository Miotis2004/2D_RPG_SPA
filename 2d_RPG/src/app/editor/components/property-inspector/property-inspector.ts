import { Component, inject } from '@angular/core';
import { DockingPanel } from '../../../shared/components/docking-panel/docking-panel';
import { EditorStateService } from '../../../core/state/editor-state.service';

@Component({
  selector: 'app-property-inspector',
  imports: [DockingPanel],
  templateUrl: './property-inspector.html',
  styleUrl: './property-inspector.scss',
})
export class PropertyInspector {
  protected readonly editorState = inject(EditorStateService);
}
