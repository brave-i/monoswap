import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../../shared/shared.module';

import { PankcakeTokensExplorerRoutingModule } from './pancake-tokens-explorer-routing.module';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PankcakeTokensExplorerComponent } from './pancake-tokens-explorer.component';

@NgModule({
  imports: [
    CommonModule,
    PankcakeTokensExplorerRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [PankcakeTokensExplorerComponent],
})
export class PankcakeTokensExplorerModule {}
