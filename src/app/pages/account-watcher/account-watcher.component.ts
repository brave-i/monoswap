import { Component, OnInit } from '@angular/core';
import { Subscription, BehaviorSubject } from 'rxjs';
import { ColumnItem } from 'src/app/models/columnItem';
import { AccountService } from 'src/app/services/account.service';
import { EtherScanAccountInfo } from 'src/app/models/etherScanAccountInfo';

@Component({
  selector: 'app-whale-alert',
  templateUrl: './account-watcher.component.html',
  styleUrls: ['./account-watcher.component.scss'],
})
export class AccountWatcherComponent implements OnInit {
  subscription: Subscription;
  interval;
  accountInfo$: BehaviorSubject<EtherScanAccountInfo[]>;

  addressInput = '';
  currentAddress = '';

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

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.currentAddress = this.addressInput;
    this.accountInfo$ = this.accountService.accountInfo$;
  }

  formatDate(timestamp: number) {
    return new Date(timestamp * 1000);
  }

  identify(index, item: EtherScanAccountInfo) {
    return item.hash;
  }

  getSwapType(a: EtherScanAccountInfo) {
    return a.from.toLowerCase() === this.currentAddress.toLowerCase()
      ? 'out'
      : 'in';
  }

  getTokenAmount(a: EtherScanAccountInfo) {
    return +a.value / Math.pow(10, +a.tokenDecimal);
  }

  addAccount() {
    if (this.addressInput.length !== 42) return;
    this.currentAddress = this.addressInput;
    this.accountService.observeAccountInfo(this.currentAddress);
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
