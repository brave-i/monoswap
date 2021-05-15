import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AccountWatcherComponent } from './account-watcher.component';

const routes: Routes = [{ path: '', component: AccountWatcherComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccountWatcherRoutingModule {}
