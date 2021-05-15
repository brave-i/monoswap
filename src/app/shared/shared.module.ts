import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NzFormModule } from 'ng-zorro-antd/form';
import { IconsProviderModule } from '../icons-provider.module';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { SavedPairsComponent } from './components/saved-pairs/saved-pairs.component';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { PairSearchComponent } from './components/pair-search/pair-search.component';
import { CurrencyPipe } from '@angular/common';
import { MomentModule } from 'ngx-moment';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { TvChartComponent } from './components/tv-chart/tv-chart.component';

@NgModule({
  imports: [
    CommonModule,
    NzSelectModule,
    FormsModule,
    NzLayoutModule,
    NzAvatarModule,
    IconsProviderModule,
    NzDropDownModule,
    MomentModule,
  ],
  declarations: [SavedPairsComponent, PairSearchComponent, TvChartComponent],
  exports: [
    IconsProviderModule,
    NzFormModule,
    NzLayoutModule,
    NzMenuModule,
    NzCheckboxModule,
    NzInputModule,
    NzButtonModule,
    NzTableModule,
    NzDropDownModule,
    NzSelectModule,
    NzListModule,
    NzDatePickerModule,
    NzTimePickerModule,
    NzEmptyModule,
    NzInputNumberModule,
    NzModalModule,
    NzDividerModule,
    NzAlertModule,
    NzDrawerModule,
    NzNotificationModule,
    NzToolTipModule,
    NzTagModule,
    ReactiveFormsModule,
    TvChartComponent,
    PairSearchComponent,
    MomentModule,
  ],
  providers: [CurrencyPipe],
})
export class SharedModule {}
