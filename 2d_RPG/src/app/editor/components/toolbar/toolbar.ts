import { Component, inject } from '@angular/core';
import { EditorStateService, EditorTool } from '../../../core/state/editor-state.service';

interface ToolButton {
  readonly id: EditorTool;
  readonly label: string;
  readonly shortcut: string;
}

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar {
  protected readonly editorState = inject(EditorStateService);
  protected readonly tools: readonly ToolButton[] = [
    { id: 'select', label: 'Select', shortcut: 'V' },
    { id: 'paint', label: 'Paint', shortcut: 'B' },
    { id: 'erase', label: 'Erase', shortcut: 'E' },
    { id: 'events', label: 'Events', shortcut: 'G' },
  ];
}
