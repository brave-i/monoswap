import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BscPairExplorerComponent } from './bsc-pair-explorer.component';

const routes: Routes = [
  { path: ':tokenId', component: BscPairExplorerComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BscPairExplorerRoutingModule {}
