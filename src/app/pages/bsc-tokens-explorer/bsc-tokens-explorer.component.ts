import { Component, OnInit } from '@angular/core';

import { QueryRef } from 'apollo-angular/query-ref';
import { Subscription } from 'rxjs';
import { Apollo } from 'apollo-angular';
import { ColumnItem } from 'src/app/models/columnItem';
import { WhaleService } from 'src/app/services/whale.service';
import { PairDTO } from 'src/app/models/pairDTO';
import { ChartToken } from 'src/app/models/chartToken';
import { ChartTokens } from 'src/app/models/chartTokens';
import { GetTokensOptions } from 'src/app/models/getTokensOptions';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-tokens-explorer',
  templateUrl: './bsc-tokens-explorer.component.html',
  styleUrls: ['./bsc-tokens-explorer.component.scss'],
})
export class BscTokensExplorerComponent implements OnInit {
  private query: QueryRef<any>;
  subscription: Subscription;
  interval;
  pairs: PairDTO[];
  options: GetTokensOptions = {
    minVolume: 1000,
    minTxCount: 10,
    minLiquidity: 1000,
    minDaysOld: 15,
  };

  listOfColumns: ColumnItem[] = [
    {
      name: 'Symbol',
    },
    {
      name: 'Liquidity ($)',
    },
    {
      name: 'Volume ($)',
    },
    {
      name: 'Volume / day',
    },
    {
      name: 'Tx count',
    },
    {
      name: 'Age (days)',
    },
  ];

  constructor(
    private whaleService: WhaleService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData() {
    this.query = this.whaleService.getTokensStats(this.options, 'pancakeswap');
    const today = new Date().valueOf();

    this.subscription = this.query.valueChanges.subscribe(({ data }) => {
      this.pairs = data.pairs
        .map((p: PairDTO) => {
          const daysOld =
            (today / 1000 - p.createdAtTimestamp) / (60 * 60 * 24);
          return {
            creationDate: p.createdAtTimestamp,
            dailyVolume: p.volumeUSD / daysOld,
            id: p.id,
            txCount: p.txCount,
            volumeUSD: p.volumeUSD,
            reserveUSD: p.reserveUSD,
            symbol: this.getTokenSymbol(p),
            daysOld: daysOld,
          } as ChartTokens;
        })
        .filter((p: ChartTokens) => this.filterSymbols(p))
        .sort((a, b) => +b.reserveUSD - +a.reserveUSD);
    });
  }

  formatDate(timestamp: number) {
    return new Date(timestamp * 1000);
  }

  identify(index, item: ChartTokens) {
    return item.id;
  }

  isTokenFirst(pair: PairDTO) {
    return (
      pair.token1.symbol === 'WBNB' ||
      pair.token1.symbol === 'sUSD' ||
      pair.token1.symbol === 'yDAI+yUSDC+yUSDT+yTUSD'
    );
  }

  getTokenSymbol(pair: PairDTO) {
    return this.isTokenFirst(pair) ? pair.token0.symbol : pair.token1.symbol;
  }

  filterSymbols(pair: ChartTokens) {
    return (
      pair.symbol !== 'WBNB' &&
      pair.symbol !== 'BUSD' &&
      pair.symbol !== 'yyDAI+yUSDC+yUSDT+yTUSD'
    );
  }

  search() {
    this.subscription.unsubscribe();
    this.fetchData();
  }
}
