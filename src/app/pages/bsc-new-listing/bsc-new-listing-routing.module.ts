import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BscNewListingComponent } from './bsc-new-listing.component';

const routes: Routes = [{ path: '', component: BscNewListingComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BscNewListingRoutingModule {}
