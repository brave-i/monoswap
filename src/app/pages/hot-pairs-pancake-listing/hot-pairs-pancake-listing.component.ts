import {Component, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {tap} from 'rxjs/operators';
import {ColumnItem} from 'src/app/models/columnItem';
import {HistoricToken} from 'src/app/models/HistoricToken';
import {EtherService} from 'src/app/services/ether.service';
import {HistoricTokenService} from 'src/app/services/historic-token.service';

@Component({
  selector: 'app-hot-pairs-listing',
  templateUrl: './hot-pairs-pancake-listing.component.html',
  styleUrls: ['./hot-pairs-pancake-listing.component.scss'],
})
export class HotPairsPancakeListingComponent implements OnInit {
  sub: Subscription;
  hotpairs: any[] = [];
  isAuth: boolean;
  hotpairs$: BehaviorSubject<any[]> = new BehaviorSubject([]);

  pageSize = 12;
  listOfColumns: ColumnItem[] = [
    {
      name: 'Ranking',
    },
    {
      name: 'Symbol',
    },
    {
      name: 'Name',
    },
  ];

  constructor(
    public historicSercice: HistoricTokenService,
    public etherService: EtherService
  ) {
  }

  ngOnInit(): void {
    this.etherService.connectedAddress$.subscribe((accountid) => {
      this.isAuth = true;
      this.historicSercice
        .gethotPairPancake('12', this.pageSize, 0, accountid)
        .pipe(
          tap((res) => {
            // console.log(res);
          })
        )
        .subscribe((res) => {
          this.hotpairs = res;
          this.hotpairs$.next(this.hotpairs);
        });
    });
  }

  getPriceChange(data: HistoricToken) {
    return (
      ((data.currentPrice - data.accountInfoSee.seeLastPrice) /
        data.accountInfoSee.seeLastPrice) *
      100
    );
  }

  isNew(timestamp: number) {
    const now = Date.now();
    const diffInMs = now - +timestamp * 1000;
    const oneDay = 24 * 60 * 60 * 1000;
    // debugger;
    return diffInMs < oneDay;
  }
}
