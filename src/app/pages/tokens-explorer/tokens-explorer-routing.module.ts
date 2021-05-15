import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TokensExplorerComponent } from './tokens-explorer.component';

const routes: Routes = [{ path: '', component: TokensExplorerComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TokensExplorerRoutingModule {}
