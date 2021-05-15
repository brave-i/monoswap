import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';

import { NewListingRoutingModule } from './new-listing-routing.module';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NewListingComponent } from './new-listing.component';

@NgModule({
  imports: [
    CommonModule,
    NewListingRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [NewListingComponent],
})
export class NewListingModule {}
