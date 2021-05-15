import { Component, OnInit, Input, AfterContentChecked } from '@angular/core';
import { ChartToken } from 'src/app/models/chartToken';
import { PairDTO, TokenDTO } from 'src/app/models/pairDTO';
import { Favorite } from 'src/app/models/favorites';
import { TokenService } from 'src/app/services/token.service';
import { Observable } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { CurrencyPipe } from '@angular/common';
import { CoinGeckoTokenInfo } from 'src/app/models/coinGeckoTokenInfo';

@Component({
  selector: 'app-token-info',
  templateUrl: './token-info.component.html',
  styleUrls: ['./token-info.component.scss'],
})
export class TokenInfoComponent implements OnInit, AfterContentChecked {
  @Input() pairInfo: PairDTO;
  @Input() tokenInfo: ChartToken;
  @Input() token: TokenDTO;
  @Input() tokenIsFirstInPair: boolean;
  @Input() dailyVolume: number;
  @Input() ethPrice: number;
  @Input() geckoInfo: CoinGeckoTokenInfo;

  totalLiquidity = 0;
  isSaved = false;
  isPairSaved$: Observable<boolean>;
  constructor(
    private tokenService: TokenService,
    private titleService: Title,
    private currencyPipe: CurrencyPipe
  ) {}

  ngOnInit(): void {
    this.isPairSaved$ = this.tokenService.isPairSaved$(this.pairInfo.id);

    const tokenAmount = !this.tokenIsFirstInPair
      ? +this.pairInfo.reserve1
      : +this.pairInfo.reserve0;

    const ethAmount = this.tokenIsFirstInPair
      ? +this.pairInfo.reserve1
      : +this.pairInfo.reserve0;

    this.totalLiquidity =
      tokenAmount * this.tokenInfo.priceUSD + ethAmount * this.ethPrice;
  }

  ngAfterContentChecked(): void {
    this.titleService.setTitle(
      `${this.currencyPipe.transform(
        this.tokenInfo.priceUSD,
        'USD',
        'symbol',
        '1.2-4'
      )} ${this.token.symbol}`
    );
  }

  savePair() {
    const pair: Favorite = {
      id: this.pairInfo.id,
      name: this.token.symbol,
      tokenId: this.token.id,
      higherSavedPrice: null,
      lowerSavedPrice: null,
      myEntry: 0,
      priceUSD: this.tokenInfo.priceUSD,
      priceETH: this.tokenInfo.priceETH,
    };
    this.tokenService.savePair(pair);
  }

  removePair() {
    this.tokenService.removePairById(this.pairInfo.id);
  }
}
