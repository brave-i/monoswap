import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BscTokensExplorerComponent } from './bsc-tokens-explorer.component';

const routes: Routes = [{ path: '', component: BscTokensExplorerComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BscTokensExplorerRoutingModule {}
