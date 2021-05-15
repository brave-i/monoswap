import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';

import { NewListingPancakeRoutingModule } from './new-listing-pancake-routing.module';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NewListingPancakeComponent } from './new-listing-pancake.component';

@NgModule({
  imports: [
    CommonModule,
    NewListingPancakeRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [NewListingPancakeComponent],
})
export class NewListingPancakeModule {}
