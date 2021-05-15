import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HotPairsListingComponent } from './hot-pairs-listing.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { HotPairsListingRoutingModule } from './hot-pairs-listing-routing.module';


@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    HotPairsListingRoutingModule,
    ReactiveFormsModule,
  ],
  declarations: [HotPairsListingComponent],
})
export class HotPairsListingModule { }
