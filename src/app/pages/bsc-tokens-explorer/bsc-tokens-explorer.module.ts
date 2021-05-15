import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';

import { BscTokensExplorerRoutingModule } from './bsc-tokens-explorer-routing.module';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BscTokensExplorerComponent } from './bsc-tokens-explorer.component';

@NgModule({
  imports: [
    CommonModule,
    BscTokensExplorerRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [BscTokensExplorerComponent],
})
export class BscTokensExplorerModule {}
