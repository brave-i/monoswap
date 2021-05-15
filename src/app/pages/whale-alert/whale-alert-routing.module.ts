import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WhaleAlertComponent } from './whale-alert.component';

const routes: Routes = [{ path: '', component: WhaleAlertComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WhaleAlertRoutingModule {}
