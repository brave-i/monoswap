import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';

import { PairExplorerRoutingModule } from './pair-explorer-routing.module';

import { PairExplorerComponent } from './pair-explorer.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TokenInfoComponent } from './token-info/token-info.component';
import { AddressTradesComponent } from '../../shared/components/address-trades/address-trades.component';

@NgModule({
  imports: [
    CommonModule,
    PairExplorerRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [
    PairExplorerComponent,
    TokenInfoComponent,
    AddressTradesComponent,
  ],
  exports: [PairExplorerComponent],
})
export class PairExplorerModule {}
