import { Component, OnInit } from '@angular/core';
import { WhaleService } from 'src/app/services/whale.service';
import { Subscription, Observable, BehaviorSubject } from 'rxjs';
import { ColumnItem } from 'src/app/models/columnItem';
import { FirebaseService } from 'src/app/services/firebase.service';
import { NewPairs } from 'src/app/models/new-pairs';
import { tap } from 'rxjs/operators';
import { OnDestroy } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TokenService } from 'src/app/services/token.service';

@Component({
  selector: 'app-new-tokens',
  templateUrl: './new-listing.component.html',
  styleUrls: ['./new-listing.component.scss'],
})
export class NewListingComponent implements OnInit, OnDestroy {
  listOfColumns: ColumnItem[] = [
    {
      name: 'Creation date',
    },
    {
      name: 'Token',
    },
    {
      name: 'Price (USD)',
    },
    /* {
      name: 'Initial / Current Pool token',
    }, */
    {
      name: 'Initial / Current Pool ETH',
    },
    {
      name: 'Market Cap',
    },
    {
      name: 'Tx Count',
    },
    {
      name: 'Price Change',
    },
    {
      name: 'Holders',
    },
    {
      name: 'Actions',
    },
    {
      name: 'Contract',
    },
  ];

  sub: Subscription;
  currentPairs: NewPairs[] = [];
  currentPairs$: BehaviorSubject< NewPairs[]> = new BehaviorSubject([]);
  interval;

  constructor(
    private tokenService: TokenService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.fetchData();
    /* this.interval = setInterval(() => {
      this.fetchData();
    }, 6000); */
  }

  private fetchData() {
    this.tokenService
      .getERCTokens(this.currentPairs)
      .pipe(
        tap((res) => {
          // console.log(res);
          if (
            this.currentPairs &&
            this.currentPairs.length &&
            res &&
            res.length
          ) {
            this.notify(res[0]);
          }
        })
      )
      .subscribe((res) => {
        this.currentPairs = [...this.currentPairs, ...res];
        this.currentPairs = this.removeDuplicateSwaps([...this.currentPairs]);
        this.currentPairs$.next(this.currentPairs);
        setTimeout(() => this.fetchData(), 6000);
      });
  }

  removeDuplicateSwaps(myArr) {
    return myArr
      .filter((obj, pos, arr) => {
        return arr.map((mapObj) => mapObj.idToken).indexOf(obj.idToken) === pos;
      })
      .sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
  }

  formatDate(timestamp: number) {
    return new Date(+timestamp * 1000);
  }

  getPriceChange(newPair: any) {
    return (
      ((newPair.currentInfos.currentPriceUSD -
        newPair.initialInfos.initialPriceUSD) /
        newPair.initialInfos.initialPriceUSD) *
      100
    );
  }

  identify(index, item: NewPairs) {
    return item.idPair;
  }

  notify(newPair: NewPairs) {
    const upAudio = document.getElementById('new-listing') as HTMLMediaElement;
    upAudio.volume = 0.7;
    upAudio.play();

    const message = newPair.holderCount
      ? `${newPair.tokenName} with ${newPair.holderCount} holders just listed`
      : `${newPair.tokenName} just listed`;

    this.notification
      .blank(`NEW LISTING - ${newPair.tokenName}`, message, { nzDuration: 0 })
      .onClick.subscribe(() => {
        console.log('notification clicked!');
      });
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }
}
