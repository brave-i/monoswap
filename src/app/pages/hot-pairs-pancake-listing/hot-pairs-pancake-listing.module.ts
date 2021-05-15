import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from 'src/app/shared/shared.module';
import {HotPairsPancakeListingComponent} from './hot-pairs-pancake-listing.component';
import {HotPairsPancakeListingRoutingModule} from './hot-pairs-pancake-listing-routing.module';


@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    HotPairsPancakeListingRoutingModule,
  ],
  declarations: [HotPairsPancakeListingComponent],
})
export class HotPairsPancakeListingModule {
}
