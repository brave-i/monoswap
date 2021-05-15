import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PancakePairExplorerComponent } from './pancake-pair-explorer.component';

const routes: Routes = [
  { path: ':tokenId', component: PancakePairExplorerComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PancakePairExplorerRoutingModule {}
