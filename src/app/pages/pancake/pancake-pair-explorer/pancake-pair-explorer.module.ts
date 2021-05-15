import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../../shared/shared.module';

import { PancakePairExplorerRoutingModule } from './pancake-pair-explorer-routing.module';

import { PancakePairExplorerComponent } from './pancake-pair-explorer.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TokenInfoComponent } from './token-info/token-info.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    PancakePairExplorerRoutingModule,
  ],
  declarations: [PancakePairExplorerComponent, TokenInfoComponent],
  exports: [PancakePairExplorerComponent],
})
export class PancakePairExplorerModule {}
