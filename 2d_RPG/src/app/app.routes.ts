import { Routes } from '@angular/router';
import { MainLayout } from './editor/components/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    title: 'Angular 2D RPG Editor',
  },
];
