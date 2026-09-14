import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'new-match-list',
    pathMatch: 'full',
  },
  {
    path: 'domain-whitelisting',
    loadComponent: () =>
      import('./features/domain-whitelisting/domain-whitelisting').then(
        (m) => m.DomainWhitelisting,
      ),
  },
  {
    path: 'new-match-list',
    loadComponent: () =>
      import('./features/new-matches-list/new-matches-list').then((m) => m.NewMatchesList),
  },
  {
    path: 'old-match-list',
    loadComponent: () => import('./features/matches-list/matches-list').then((m) => m.MatchesList),
  },
];
