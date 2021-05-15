import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NewListingPancakeComponent } from './new-listing-pancake.component';

const routes: Routes = [{ path: '', component: NewListingPancakeComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NewListingPancakeRoutingModule {}
