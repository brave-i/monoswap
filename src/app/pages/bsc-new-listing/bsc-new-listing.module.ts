import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';

import { BscNewListingRoutingModule } from './bsc-new-listing-routing.module';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BscNewListingComponent } from './bsc-new-listing.component';

@NgModule({
  imports: [
    CommonModule,
    BscNewListingRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [BscNewListingComponent],
})
export class BscNewListingModule {}
