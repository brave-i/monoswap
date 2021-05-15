import { Component, Input, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ColumnItem } from 'src/app/models/columnItem';
import { EtherScanAccountInfo } from 'src/app/models/etherScanAccountInfo';
import { AccountService } from 'src/app/services/account.service';
import { EtherService } from 'src/app/services/ether.service';

@Component({
  selector: 'app-address-trades',
  templateUrl: './address-trades.component.html',
  styleUrls: ['./address-trades.component.scss'],
})
export class AddressTradesComponent implements OnInit {
  subscription: Subscription;
  interval;
  accountInfo$: Observable<EtherScanAccountInfo[]>;

  listOfColumns: ColumnItem[] = [
    {
      name: 'Date',
    },
    {
      name: 'Type',
    },
    {
      name: 'Token',
    },
    {
      name: 'Token Amount',
    },
    {
      name: 'Links',
    },
  ];

  @Input() address = '';
  @Input() symbol = '';

  constructor(
    private accountService: AccountService,
    private etherService: EtherService
  ) {}

  ngOnInit(): void {
    this.accountInfo$ = this.accountService.accountInfo$.pipe(
      map((res) =>
        res.filter(
          (info) => info.tokenSymbol.toLowerCase() === this.symbol.toLowerCase()
        )
      )
    );
    this.addAccount();
  }

  formatDate(timestamp: number) {
    return new Date(timestamp * 1000);
  }

  identify(index, item: EtherScanAccountInfo) {
    return item.hash;
  }

  getSwapType(a: EtherScanAccountInfo) {
    return a.from.toLowerCase() ===
      this.etherService.connectedAddress.toLowerCase()
      ? 'out'
      : 'in';
  }

  getTokenAmount(a: EtherScanAccountInfo) {
    return +a.value / Math.pow(10, +a.tokenDecimal);
  }

  addAccount() {
    if (!this.address || this.address.length !== 42) return;
    this.accountService.observeMyAccount();
  }

  async redirectToPair(tokenSymbol: string) {
    const pairId = await this.accountService.getPairIdForTokenSymbol(
      tokenSymbol
    );
    if (pairId) {
      const link = '/pair-explorer/' + pairId;
      window.open(link, '_blank');
    }
  }
}
