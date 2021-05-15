import { NgModule } from '@angular/core';

import { RouterModule, Routes } from '@angular/router';
import {HotPairsPancakeListingComponent} from './hot-pairs-pancake-listing.component';



const routes: Routes = [{ path: '', component: HotPairsPancakeListingComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HotPairsPancakeListingRoutingModule {}
