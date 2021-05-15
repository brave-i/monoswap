import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  AfterViewInit,
  Renderer2,
} from '@angular/core';
import { TokenService } from './services/token.service';
import { Favorite } from './models/favorites';
import { tap, switchMap, map, delay } from 'rxjs/operators';
import { of } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
  NgResizeObserver,
  ngResizeObserverProviders,
} from 'ng-resize-observer';
import { EtherService } from './services/ether.service';
import { LocalStorageService } from './services/local-storage.service';
import { popupCenter } from './shared/utils/utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [ngResizeObserverProviders],
})
export class AppComponent implements OnInit, OnDestroy {
  interval;
  interval2;
  user;

  savedPairs$;
  saved$;

  health = '';

  constructor(
    public tokenService: TokenService,
    private notification: NzNotificationService,
    private resize$: NgResizeObserver,
    public etherService: EtherService,
    public localStorage: LocalStorageService
  ) {}
  async ngOnInit(): Promise<void> {
    this.checkDarkMode();
    this.etherService.getBalances();

    this.tokenService.resize$ = this.resize$.pipe(
      map(({ contentRect }) => contentRect)
    );

    this.tokenService.getEthPrice();
    this.savedPairs$ = this.tokenService.savedPairs$;

    this.savedPairs$.subscribe((sp) => {
      if (!sp || !sp.length) {
        this.tokenService.savePair({
          id: '0x7df4a1d4a8d8390bef36f311252423cce04e5647',
          name: 'ASTRO',
          tokenId: '0xcbd55d4ffc43467142761a764763652b48b969ff',
          priceUSD: 0,
        });
      }
    });

    this.saved$ = this.tokenService.savedPairs$.pipe(
      switchMap((res) => {
        if (!(res && res.length)) return of(null);
        const query = this.tokenService.getTokensPrice(
          res.map((fav) => fav.tokenId)
        );

        this.interval = setInterval(() => {
          query.refetch();
        }, 12000);

        return query.valueChanges.pipe(
          delay(800),
          map((pl: any) => {
            // Add myEntryPrice
            return pl.data.tokens
              .map((tok) => {
                const fav = res.find((fav) => fav.name === tok.symbol);

                return {
                  ...fav,
                  ...tok,
                  tokenId: tok.id,
                  priceUSD: tok.derivedETH * this.tokenService.ethPrice,
                  id: fav.id,
                  percentage: this.getPercentageChange({
                    ...fav,
                    ...tok,
                    tokenId: tok.id,
                    priceUSD: tok.derivedETH * this.tokenService.ethPrice,
                    id: fav.id,
                  }),
                };
              })
              .sort((a, b) => a.symbol.localeCompare(b.symbol));
          }),
          tap((res) => this.checkAlerts(res))
        );
      })
    );

    const queryHealthy = this.tokenService.getGraphHealth('uniswap/uniswap-v2');

    queryHealthy.valueChanges.subscribe((res: any) => {
      if (res) {
        const changed =
          res.data.indexingStatusForCurrentVersion.health !== this.health;
        this.health = res.data.indexingStatusForCurrentVersion.health;

        if (changed && this.health !== 'healthy') {
          this.notification
            .blank(
              `We are experiencing API connection issues`,
              `Data may be delayed. AstroTools team is working on a solution. We thank you for your patience`,
              { nzDuration: 0 }
            )
            .onClick.subscribe(() => {
              console.log('notification clicked!');
            });
        }
      }
    });

    this.interval2 = setInterval(() => {
      queryHealthy.refetch();
    }, 120000);
  }

  connect() {
    this.etherService.enableMetaMaskAccount();
  }

  walletConnect() {
    this.etherService.enableWalletConnect();
  }

  getAccountAndBalance = () => {
    const that = this;
    this.etherService
      .getUserBalance()
      .then(function (retAccount: any) {
        that.user.address = retAccount.account;
        that.user.balance = retAccount.balance;
        // console.log('transfer.components :: getAccountAndBalance :: that.user');
        // console.log(that.user);
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  checkAlerts(favorites: any) {
    const upAudio = document.getElementById(
      'notification-up'
    ) as HTMLMediaElement;
    const downAudio = document.getElementById(
      'notification-down'
    ) as HTMLMediaElement;

    upAudio.volume = downAudio.volume = 0.7;
    favorites.forEach((fav) => {
      if (!fav.priceUSD) return;
      if (fav.higherSavedPrice && fav.priceUSD >= fav.higherSavedPrice) {
        upAudio.play();
        const tempFav = { ...fav, higherSavedPrice: null };
        this.tokenService.savePair(tempFav);
        this.notification
          .blank(
            `🟢 ${fav.name}`,
            `${fav.name} went up to $${fav.higherSavedPrice}`,
            { nzDuration: 0 }
          )
          .onClick.subscribe(() => {
            console.log('notification clicked!');
          });
      } else if (fav.lowerSavedPrice && fav.priceUSD <= fav.lowerSavedPrice) {
        downAudio.play();
        // audio.volume = 0.2;
        const tempFav = { ...fav, lowerSavedPrice: null };
        this.tokenService.savePair(tempFav);
        this.notification
          .blank(
            `🔴 ${fav.name}`,
            `${fav.name} went down to $${fav.lowerSavedPrice}`,
            { nzDuration: 0 }
          )
          .onClick.subscribe(() => {
            console.log('notification clicked!');
          });
      }
    });
  }

  getPercentageChange(fav: Favorite) {
    return fav.myEntry
      ? Math.round(((fav.priceUSD - fav.myEntry) / fav.myEntry) * 10000) / 100
      : 0;
  }

  removePair(event, fav: Favorite) {
    event.stopPropagation();
    this.tokenService.removePair(fav);
  }

  toggleDarkMode() {
    const el1 = document.getElementById('dark-reader') as any;
    if (el1.disabled) {
      el1.disabled = false;
      localStorage.setItem('darkreader', 'enabled');
      this.localStorage.setDarkMode(true);
    } else {
      el1.disabled = true;
      localStorage.setItem('darkreader', 'disabled');
      this.localStorage.setDarkMode(false);
    }
  }

  checkDarkMode() {
    const el1 = document.getElementById('dark-reader') as any;
    if (localStorage.getItem('darkreader') == 'disabled') {
      el1.disabled = true;
      this.localStorage.setDarkMode(false);
    } else {
      el1.disabled = false;
      this.localStorage.setDarkMode(true);
    }
  }

  get getBuyUrl() {
    const amount =
      this.etherService.noAstro || this.etherService.astroTier1 ? 1000 : 20000;
    return `https://app.uniswap.org/#/swap?outputCurrency=0xcbd55d4ffc43467142761a764763652b48b969ff&exactAmount=${amount}&exactField=output&theme=dark'`;
  }

  openMyZerion() {
    popupCenter({
      url: 'https://app.zerion.io/' + this.etherService.account + '/overview',
      title: 'My Zerion',
      w: 900,
      h: 620,
    });
    return false;
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
    clearInterval(this.interval2);
  }
}
