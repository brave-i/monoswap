import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AstroTier2Guard } from './shared/guards/astro.guard';
import { AstroTier3Guard } from './shared/guards/astroT3.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'pair-explorer/0x7df4a1d4a8d8390bef36f311252423cce04e5647',
    pathMatch: 'full',
  },
  {
    path: 'whale-alert',
    canLoad: [AstroTier3Guard],
    loadChildren: () =>
      import('./pages/whale-alert/whale-alert.module').then(
        (m) => m.WhaleAlertModule
      ),
  },
  {
    path: 'pair-explorer',
    loadChildren: () =>
      import('./pages/pair-explorer/pair-explorer.module').then(
        (m) => m.PairExplorerModule
      ),
  },
  {
    path: 'tokens-explorer',
    canLoad: [AstroTier3Guard],
    loadChildren: () =>
      import('./pages/tokens-explorer/tokens-explorer.module').then(
        (m) => m.TokensExplorerModule
      ),
  },
  {
    path: 'account-watcher',
    canLoad: [AstroTier3Guard],
    loadChildren: () =>
      import('./pages/account-watcher/account-watcher.module').then(
        (m) => m.AccountWatcherModule
      ),
  },
  {
    path: 'new-listing',
    canLoad: [AstroTier2Guard],
    loadChildren: () =>
      import('./pages/new-listing/new-listing.module').then(
        (m) => m.NewListingModule
      ),
  },
  {
    path: 'trending-pairs',
    canLoad: [],
    loadChildren: () =>
      import('./pages/hot-pairs-listing/hot-pairs-listing.module').then(
        (m) => m.HotPairsListingModule
      ),
  },
  {
    path: 'bsc-new-listing',
    loadChildren: () =>
      import('./pages/bsc-new-listing/bsc-new-listing.module').then(
        (m) => m.BscNewListingModule
      ),
  },
  {
    path: 'bsc-pair-explorer',
    loadChildren: () =>
      import('./pages/bsc-pair-explorer/bsc-pair-explorer.module').then(
        (m) => m.BscPairExplorerModule
      ),
  },
  {
    path: 'bsc-tokens-explorer',
    loadChildren: () =>
      import('./pages/bsc-tokens-explorer/bsc-tokens-explorer.module').then(
        (m) => m.BscTokensExplorerModule
      ),
  },
  {
    path: 'pancake-pair-explorer',
    loadChildren: () =>
      import(
        './pages/pancake/pancake-pair-explorer/pancake-pair-explorer.module'
      ).then((m) => m.PancakePairExplorerModule),
  },
  {
    path: 'pancake-tokens-explorer',
    loadChildren: () =>
      import(
        './pages/pancake/pancake-tokens-explorer/pancake-tokens-explorer.module'
      ).then((m) => m.PankcakeTokensExplorerModule),
  },
  {
    path: 'new-listing-pancake',
    loadChildren: () =>
      import('./pages/new-listing-Pancake/new-listing-pancake.module').then(
        (m) => m.NewListingPancakeModule
      ),
  },
  {
    path: 'trending-pairs-pancake',
    canLoad: [],
    loadChildren: () =>
      import('./pages/hot-pairs-pancake-listing/hot-pairs-pancake-listing.module').then(
        (m) => m.HotPairsPancakeListingModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
