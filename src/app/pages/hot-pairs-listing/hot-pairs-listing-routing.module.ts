import { NgModule } from '@angular/core';

import { RouterModule, Routes } from '@angular/router';
import { HotPairsListingComponent } from './hot-pairs-listing.component';



const routes: Routes = [{ path: '', component: HotPairsListingComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HotPairsListingRoutingModule {}
