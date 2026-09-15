import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'matches/new',
    loadComponent: () =>
      import('./features/match-management/new-matches-list/new-matches-list')
        .then(m => m.NewMatchesList)
  },

  {
    path: 'matches/old',
    loadComponent: () =>
      import('./features/match-management/old-matches-list/old-matches-list')
        .then(m => m.OldMatchesList)
  },
  
  {
    path: 'websites',
    loadComponent: () =>
      import('./features/website/domain-whitelisting/domain-whitelisting')
        .then(m => m.DomainWhitelisting)
  },

  {
    path: '',
    redirectTo: 'matches/new',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: 'matches/new'
  }
];
