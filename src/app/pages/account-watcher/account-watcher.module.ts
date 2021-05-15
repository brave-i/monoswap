import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';

import { AccountWatcherRoutingModule } from './account-watcher-routing.module';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AccountWatcherComponent } from './account-watcher.component';

@NgModule({
  imports: [
    CommonModule,
    AccountWatcherRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [AccountWatcherComponent],
})
export class AccountWatcherModule {}
