import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';

import { BscPairExplorerRoutingModule } from './bsc-pair-explorer-routing.module';

import { BscPairExplorerComponent } from './bsc-pair-explorer.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TokenInfoComponent } from './token-info/token-info.component';

@NgModule({
  imports: [
    CommonModule,
    BscPairExplorerRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [BscPairExplorerComponent, TokenInfoComponent],
  exports: [BscPairExplorerComponent],
})
export class BscPairExplorerModule {}
