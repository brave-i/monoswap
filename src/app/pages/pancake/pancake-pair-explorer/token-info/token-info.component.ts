import { Component, OnInit, Input, AfterContentChecked } from '@angular/core';
import { ChartToken } from 'src/app/models/chartToken';
import { PancakePairDTO, TokenDTO } from 'src/app/models/pairDTO';
import { Favorite } from 'src/app/models/favorites';
import { TokenService } from 'src/app/services/token.service';
import { Observable } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { CurrencyPipe } from '@angular/common';
import { CoinGeckoTokenInfo } from 'src/app/models/coinGeckoTokenInfo';
import { EtherService } from '../../../../services/ether.service';
import { HistoricTokenService } from '../../../../services/historic-token.service';

@Component({
  selector: 'app-token-info',
  templateUrl: './token-info.component.html',
  styleUrls: ['./token-info.component.scss'],
})
export class TokenInfoComponent implements OnInit, AfterContentChecked {
  @Input() pairInfo: PancakePairDTO;
  @Input() dailyVolume: number;
  @Input() ethPrice: number;
  @Input() geckoInfo: CoinGeckoTokenInfo;

  totalLiquidity = 0;
  isSaved = false;
  isPairSaved$: Observable<boolean>;
  constructor(
    private tokenService: TokenService,
    private titleService: Title,
    private currencyPipe: CurrencyPipe,
    private etherService: EtherService,
    private historicTokenService: HistoricTokenService
  ) {}

  ngOnInit(): void {
    this.isPairSaved$ = this.tokenService.isPairSaved$(this.pairInfo.id);

    const tokenAmount = +this.pairInfo.reserveToken;

    const quoteAmount = +this.pairInfo.reserveQuoteToken;

    this.totalLiquidity =
      tokenAmount * this.pairInfo.priceInUSD +
      quoteAmount * this.pairInfo.priceInQuote;
    const accountid = this.etherService.getAccountConnected();
    if (accountid != null) {
      this.historicTokenService.AddhistoricNavigationPancake(
        this.etherService.getAccountConnected(),
        this.pairInfo.id,
        this.pairInfo.priceInUSD,
        this.pairInfo.tokenSymbol
      );
    }
  }

  ngAfterContentChecked(): void {
    this.titleService.setTitle(
      `${this.currencyPipe.transform(
        this.pairInfo.priceInUSD,
        'USD',
        'symbol',
        '1.2-4'
      )} ${this.pairInfo.tokenSymbol}`
    );
  }

  savePair() {
    const pair: Favorite = {
      id: this.pairInfo.id,
      name: this.pairInfo.tokenSymbol,
      tokenId: this.pairInfo.id,
      higherSavedPrice: null,
      lowerSavedPrice: null,
      myEntry: 0,
      priceUSD: this.pairInfo.priceInUSD,
      priceETH: 0,
    };
    this.tokenService.savePair(pair);
  }

  removePair() {
    this.tokenService.removePairById(this.pairInfo.id);
  }
}
