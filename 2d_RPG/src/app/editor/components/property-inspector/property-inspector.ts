import { Component, inject, signal } from '@angular/core';
import { DockingPanel } from '../../../shared/components/docking-panel/docking-panel';
import { EditorStateService } from '../../../core/state/editor-state.service';
import { TilesetService } from '../../services/tileset.service';
import { MapEditorService } from '../../services/map-editor.service';

type InspectorTab = 'properties' | 'development';

interface DevelopmentStep {
  readonly title: string;
  readonly description: string;
  readonly artifacts: readonly string[];
}

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
  protected readonly activeTab = signal<InspectorTab>('properties');

  protected readonly developmentSteps: readonly DevelopmentStep[] = [
    {
      title: 'Angular application foundation',
      description:
        'Created the browser-based editor shell with routing, shared styling, and standalone Angular components.',
      artifacts: ['Application bootstrap', 'Main editor route', 'Global SCSS theme'],
    },
    {
      title: 'Editor workspace shell',
      description:
        'Built the primary RPG Forge workspace with left, center, and right docking regions.',
      artifacts: ['Toolbar', 'Docking panels', 'Responsive layout'],
    },
    {
      title: 'Map rendering viewport',
      description:
        'Implemented the central viewport used to preview the current map with camera, layer, and renderer support.',
      artifacts: ['Render viewport component', 'Camera model', 'Map renderer'],
    },
    {
      title: 'Editor state and map services',
      description:
        'Added shared editor state plus map editing services for active tools, zoom, selected assets, layers, and collision summaries.',
      artifacts: ['Editor state service', 'Map editor service', 'Shared map models'],
    },
    {
      title: 'Tileset and asset workflows',
      description:
        'Created asset browsing and tileset editing panels so tile metadata, terrain, and collision state can be inspected.',
      artifacts: ['Asset browser', 'Tileset editor', 'Tileset service'],
    },
    {
      title: 'Collision and player systems',
      description: 'Added engine systems and tests for player movement and map collision behavior.',
      artifacts: ['Collision system', 'Player system', 'Unit test coverage'],
    },
    {
      title: 'Entity system',
      description:
        'Added typed runtime entities for NPCs, monsters, items, triggers, and vehicles with map metadata and tests.',
      artifacts: ['Entity model', 'Entity system', 'Map entity samples'],
    },
  ];
}
