import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'domain-whitelisting',
    loadComponent: () =>
      import('./features/domain-whitelisting/domain-whitelisting').then(
        (m) => m.DomainWhitelisting,
      )
  },
];
