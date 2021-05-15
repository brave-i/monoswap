import { Component, OnInit, OnDestroy } from '@angular/core';
import { WhaleService } from 'src/app/services/whale.service';
import { QueryRef } from 'apollo-angular/query-ref';
import { Subscription } from 'rxjs';
import { Apollo } from 'apollo-angular';
import { SwapDTO } from 'src/app/models/swapDTO';
import { ColumnItem } from 'src/app/models/columnItem';
import { ChartToken } from 'src/app/models/chartToken';
import { PairDTO } from 'src/app/models/pairDTO';

@Component({
  selector: 'app-whale-alert',
  templateUrl: './whale-alert.component.html',
  styleUrls: ['./whale-alert.component.scss'],
})
export class WhaleAlertComponent implements OnInit, OnDestroy {
  private query: QueryRef<any>;
  subscription: Subscription;
  interval;
  startTimestamp: number;
  tokenFilterVisible = false;
  searchToken = '';

  swaps: any[];
  listOfColumns: ColumnItem[] = [
    {
      name: 'Date',
    },
    {
      name: 'Token',
    },
    {
      name: 'Type',
    },
    {
      name: 'Total (USD)',
    },
    {
      name: 'Total ETH',
    },
    {
      name: 'Links',
    },
  ];

  constructor(public whaleService: WhaleService) {}
  ngOnInit(): void {
    let startDate = new Date();
    startDate.setHours(startDate.getHours() - 240);
    startDate.setMilliseconds(0);
    this.startTimestamp = startDate.valueOf() / 1000;

    this.query = this.whaleService.getWhaleTransactions();

    this.fetchData();

    this.interval = setInterval(() => {
      this.refetchWithNewVar();
    }, 8000);
  }

  private fetchData() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = this.query.valueChanges.subscribe(({ data }) => {
      this.swaps = data.swaps.filter((s: SwapDTO) => this.isEthSwap(s.pair));
      /* this.swaps = this.swaps.filter(
        (s: SwapDTO) => +s.pair.createdAtTimestamp > this.startTimestamp
      ); */
      this.swaps = this.swaps
        .map((s) => ({
          ...s,
          isTokenFirst: this.isTokenFirst(s.pair),
          type: this.getSwapType(s),
          symbol: this.isTokenFirst(s.pair)
            ? s.pair.token0.symbol
            : s.pair.token1.symbol,
          amountEth: this.getEthAmount(s),
          makerId: this.getSwapType(s) === 'buy' ? s.to : s.to,
        }))
        .filter(
          (item) =>
            item.symbol
              .toLowerCase()
              .indexOf(this.searchToken.toLowerCase()) !== -1
        );
    });
  }

  refetchWithNewVar() {
    const variables = {
      ...this.whaleService.whalesDefaultVar,
    };
    this.query.setVariables(variables);
    this.query.refetch();
  }

  formatDate(timestamp: number) {
    return new Date(timestamp * 1000);
  }

  identify(index, item: ChartToken) {
    return item.txId;
  }

  isTokenFirst(pair: PairDTO) {
    return (
      pair.token1.symbol === 'WETH' ||
      pair.token1.symbol === 'sUSD' ||
      pair.token1.symbol === 'yDAI+yUSDC+yUSDT+yTUSD'
    );
  }

  isEthSwap(pair: PairDTO) {
    return pair.token0.symbol === 'WETH' || pair.token1.symbol === 'WETH';
  }

  getEthAmount(swap: SwapDTO) {
    const isFirst = this.isTokenFirst(swap.pair);
    return isFirst
      ? swap.amount0Out > 0
        ? swap.amount1In
        : swap.amount1Out
      : swap.amount0Out > 0
      ? swap.amount0Out
      : swap.amount0In;
  }

  getSwapType(s: SwapDTO) {
    return (this.isTokenFirst(s.pair) && s.amount0In > 0) ||
      (!this.isTokenFirst(s.pair) && s.amount1In > 0)
      ? 'sell'
      : 'buy';
  }

  resetTokenSearch(): void {
    this.searchToken = '';
    this.fetchData();
  }

  searchTokenFn(): void {
    this.tokenFilterVisible = false;
    this.fetchData();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    clearInterval(this.interval);
  }
}
