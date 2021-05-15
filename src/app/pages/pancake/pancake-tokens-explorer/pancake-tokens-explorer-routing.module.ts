import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PankcakeTokensExplorerComponent } from './pancake-tokens-explorer.component';

const routes: Routes = [{ path: '', component: PankcakeTokensExplorerComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PankcakeTokensExplorerRoutingModule {}
