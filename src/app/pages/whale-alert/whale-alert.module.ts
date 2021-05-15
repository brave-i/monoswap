import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';

import { WhaleAlertRoutingModule } from './whale-alert-routing.module';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { WhaleAlertComponent } from './whale-alert.component';

@NgModule({
  imports: [
    CommonModule,
    WhaleAlertRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [WhaleAlertComponent],
})
export class WhaleAlertModule {}
