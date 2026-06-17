import { Component } from '@angular/core';
import { AssetBrowser } from '../asset-browser/asset-browser';
import { PropertyInspector } from '../property-inspector/property-inspector';
import { Toolbar } from '../toolbar/toolbar';
import { TilesetEditor } from '../tileset-editor/tileset-editor';
import { RenderViewport } from '../../../engine/components/render-viewport/render-viewport';

@Component({
  selector: 'app-main-layout',
  imports: [AssetBrowser, PropertyInspector, RenderViewport, TilesetEditor, Toolbar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {}
