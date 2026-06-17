import { Component, input } from '@angular/core';

@Component({
  selector: 'app-docking-panel',
  templateUrl: './docking-panel.html',
  styleUrl: './docking-panel.scss',
})
export class DockingPanel {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
