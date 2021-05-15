import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PairExplorerComponent } from './pair-explorer.component';

const routes: Routes = [{ path: ':tokenId', component: PairExplorerComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PairExplorerRoutingModule {}
