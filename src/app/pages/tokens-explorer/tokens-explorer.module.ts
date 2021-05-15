import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';

import { TokensExplorerRoutingModule } from './tokens-explorer-routing.module';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TokensExplorerComponent } from './tokens-explorer.component';

@NgModule({
  imports: [
    CommonModule,
    TokensExplorerRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [TokensExplorerComponent],
})
export class TokensExplorerModule {}
