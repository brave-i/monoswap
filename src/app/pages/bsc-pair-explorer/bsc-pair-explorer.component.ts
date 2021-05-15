import { Component, OnInit, OnDestroy } from '@angular/core';

import {
  NzTableFilterFn,
  NzTableFilterList,
  NzTableSortFn,
  NzTableSortOrder,
} from 'ng-zorro-antd/table';

import { Apollo, QueryRef } from 'apollo-angular';
import gql from 'graphql-tag';

import { createChart } from 'lightweight-charts';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChartToken } from 'src/app/models/chartToken';
import { PairDTO, TokenDTO } from 'src/app/models/pairDTO';
import { TokenService } from 'src/app/services/token.service';
import { Favorite } from 'src/app/models/favorites';
import { map } from 'rxjs/operators';
import { ColumnItem } from 'src/app/models/columnItem';
import { LocalStorageService } from 'src/app/services/local-storage.service';

const darkTheme = {
  chart: {
    layout: {
      backgroundColor: '#0e1011',
      lineColor: '#2B2B43',
      textColor: '#D9D9D9',
    },
    watermark: {
      color: 'rgba(0, 0, 0, 0)',
    },
    crosshair: {
      color: '#758696',
    },
    grid: {
      vertLines: {
        color: '#0e1011',
      },
      horzLines: {
        color: '#363C4E',
      },
    },
  },
  series: {
    topColor: 'rgba(32, 226, 47, 0.56)',
    bottomColor: 'rgba(32, 226, 47, 0.04)',
    lineColor: 'rgba(32, 226, 47, 1)',
  },
};

const lightTheme = {
  chart: {
    layout: {
      backgroundColor: '#FFFFFF',
      lineColor: '#2B2B43',
      textColor: '#191919',
    },
    watermark: {
      color: 'rgba(0, 0, 0, 0)',
    },
    grid: {
      vertLines: {
        visible: false,
      },
      horzLines: {
        color: '#c1c1c1',
      },
    },
  },
  series: {
    topColor: 'rgba(33, 150, 243, 0.56)',
    bottomColor: 'rgba(33, 150, 243, 0.04)',
    lineColor: 'rgba(33, 150, 243, 1)',
  },
};

const SWAPS_QUERY = gql`
  query CurrentTokenData(
    $tokenId: ID!
    $pairIn: [String]
    $yesterday: Int!
    $currentOlderTimestamp: ID!
    $fromTimestamp: Int!
  ) {
    pairHourDatas(where: { hourStartUnix_gt: $yesterday, pair: $tokenId }) {
      hourlyVolumeToken0
      hourlyVolumeToken1
      hourlyVolumeUSD
    }
    pair(id: $tokenId) {
      id
      createdAtTimestamp
      reserve0
      reserve1
      txCount
      token0 {
        id
        decimals
        symbol
        name
      }
      token1 {
        id
        decimals
        symbol
        name
      }
    }
    swaps(
      first: 1000
      where: {
        pair_in: $pairIn
        timestamp_gt: $currentOlderTimestamp
        timestamp_lt: $fromTimestamp
      }
      orderBy: timestamp
      orderDirection: desc
    ) {
      pair {
        token0 {
          symbol
        }
        token1 {
          symbol
        }
      }
      transaction {
        id
      }
      timestamp
      sender
      amount0In
      amount1In
      amount0Out
      amount1Out
      amountUSD
      to
    }
  }
`;

@Component({
  selector: 'app-bsc-pair-explorer',
  templateUrl: './bsc-pair-explorer.component.html',
  styleUrls: ['./bsc-pair-explorer.component.scss'],
})
export class BscPairExplorerComponent implements OnInit, OnDestroy {
  pairInfo: PairDTO;
  token: TokenDTO;

  counter = 0;
  startTimestamp = 0;
  yesterday = 0;
  now = 0;
  searchValue = 0;
  visible = false;
  interval;
  chart;
  timeInterval = 15;
  iteration = 0;

  mostRecentTimestamp = 0;
  oldestTimestamp = 1757605586;

  currentFav: Favorite;

  fetchMoreIsLoading = false;

  get savedPriceAlert() {
    return this.currentFav.higherSavedPrice
      ? this.currentFav.higherSavedPrice
      : this.currentFav.lowerSavedPrice;
  }

  set savedPriceAlert(val: number) {
    if (!val || val == 0) {
      this.currentFav.higherSavedPrice = 0;
      this.currentFav.lowerSavedPrice = 0;
    }
    if (val > this.listOfData[0].priceUSD) {
      this.currentFav.higherSavedPrice = val;
    } else {
      this.currentFav.lowerSavedPrice = val;
    }
  }

  listOfColumns: ColumnItem[] = [
    {
      name: 'Date',
    },
    {
      name: 'Type',
      filterMultiple: true,
      listOfFilter: [
        { text: 'Buy', value: 'buy' },
        { text: 'Sell', value: 'sell' },
      ],
      filterFn: (list: string[], item: ChartToken) =>
        list.some((name) => item.type.indexOf(name) !== -1),
    },
    {
      name: 'Price (USD)',
      /* sortOrder: null,
      sortFn: (a: ChartToken, b: ChartToken) => a.price - b.price,
      filterMultiple: false,
      listOfFilter: [
        { text: 'London', value: 'London' },
        { text: 'Sidney', value: 'Sidney' },
      ],
      filterFn: (price: number, item: ChartToken) => item.price >= price, */
    },
    {
      name: 'Price (BNB)',
    },
    {
      name: 'Amount',
    },
    {
      name: 'Total BNB',
    },
    {
      name: 'Maker',
    },
    {
      name: 'Links',
    },
  ];
  listOfData: ChartToken[] = [];
  listOfDisplayData: ChartToken[] = [];

  private query: QueryRef<any>;
  loading = true;
  error: any;
  lineSeries;

  subscription: Subscription;
  subscriptionQuery: Subscription;
  tokenId: string;

  tokenIsFirstInPair = false;
  dailyVolume = 0;
  ethPrice = 0;
  geckoInfo: { id: string; logoUrl: string } = null;

  constructor(
    private apollo: Apollo,
    private route: ActivatedRoute,
    private tokenService: TokenService,
    private router: Router,
    private localStorage: LocalStorageService
  ) {}
  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => {
      return false;
    };
    this.listOfData = this.listOfDisplayData = [];

    let now = new Date();
    now.setMilliseconds(0);
    this.now = now.valueOf();
    this.oldestTimestamp = 1757605586;

    let startDate = new Date();
    startDate.setHours(startDate.getHours() - 24);
    startDate.setMilliseconds(0);
    this.startTimestamp = startDate.valueOf();

    let yesterdayDate = new Date();
    yesterdayDate.setHours(startDate.getHours() - 24);
    yesterdayDate.setMilliseconds(0);
    yesterdayDate.setSeconds(0);
    yesterdayDate.setMinutes(0);
    this.yesterday = yesterdayDate.valueOf();
    this.interval = setInterval(() => {
      this.mostRecentTimestamp =
        this.listOfData && this.listOfData.length && this.listOfData[0].date;

      this.query.setVariables({
        tokenId: this.tokenId,
        pairIn: [this.tokenId],
        currentOlderTimestamp: +this.mostRecentTimestamp,
        startTimestamp: this.startTimestamp / 1000,
        yesterday: this.yesterday / 1000,
        fromTimestamp: 1757605586,
      });
      this.query.refetch();
    }, 8000);

    this.subscription = this.route.params.subscribe((params) => {
      setTimeout(() => {
        this.chart = createChart('chart', {
          height: 300,
          width: this.tokenService.isCollapsed
            ? window.innerWidth - 142
            : window.innerWidth - 720,
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            rightOffset: 1,
            barSpacing: 0,
            lockVisibleTimeRangeOnResize: false,
          },
          rightPriceScale: {
            autoScale: true,
            scaleMargins: {
              top: 0.05,
              bottom: 0.05,
            },
          },
          handleScale: {
            axisDoubleClickReset: true,
          },
          crosshair: {
            mode: 0,
          },
        });

        this.lineSeries = this.chart.addCandlestickSeries();

        this.lineSeries.applyOptions({
          priceFormat: {
            type: 'price',
            precision: 4,
            minMove: 0.0001,
          },
          timeScale: {
            autoScale: false,
          },
        });
      }, 1);

      this.tokenId =
        params['tokenId'] && (params['tokenId'] as string).toLocaleLowerCase();
      this.geckoInfo = null;

      this.tokenService.savedPairs$
        .pipe(map((sp) => sp.find((p) => p.id === this.tokenId)))
        .subscribe((p) => {
          return p
            ? (this.currentFav = {
                ...p,
                myEntry: p.myEntry > 0 ? p.myEntry : +p.priceUSD.toFixed(6),
              })
            : (this.currentFav = null);
        });

      this.resetChart();
      this.timeInterval = 5;
      this.lineSeries && this.lineSeries.setData([]);
      this.subscriptionQuery && this.subscriptionQuery.unsubscribe();

      this.query = this.apollo.use('pancakeswap').watchQuery({
        query: SWAPS_QUERY,
        variables: {
          tokenId: this.tokenId,
          pairIn: [this.tokenId],
          currentOlderTimestamp: this.mostRecentTimestamp,
          startTimestamp: this.startTimestamp / 1000,
          yesterday: this.yesterday / 1000,
          fromTimestamp: +this.oldestTimestamp,
        },
      });
      setTimeout(() => {
        this.getPairData();
        this.tokenService.resize$.subscribe(({ width, height }) => {
          const calculatedWidth = this.tokenService.isCollapsed
            ? width - 130
            : width - 640;
          this.chart.resize(calculatedWidth, 300);

          this.chart.timeScale().fitContent();
        });

        this.localStorage.isDarkMode$.subscribe((isDark) => {
          if (isDark) {
            this.chart.applyOptions(darkTheme.chart);
            this.lineSeries.applyOptions(darkTheme.series);
          } else {
            this.chart.applyOptions(lightTheme.chart);
            this.lineSeries.applyOptions(lightTheme.series);
          }
        });
      }, 1);
    });
  }

  private resetChart() {
    this.listOfData = [];
    this.listOfDisplayData = [];
    this.counter = 0;
  }

  private getPairData() {
    this.subscriptionQuery = this.query.valueChanges.subscribe((result) => {
      // console.log('getData');
      this.pairInfo = result.data.pair;
      this.tokenIsFirstInPair =
        result.data.pair.token1.id ===
        '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
      this.token = !this.tokenIsFirstInPair
        ? result.data.pair.token1
        : result.data.pair.token0;
      // console.log(result);
      this.listOfData = [...this.buildSwaps(result), ...this.listOfData];
      this.listOfData = this.removeDuplicateSwaps([...this.listOfData]);

      // console.log(this.listOfData);

      this.listOfDisplayData = [...this.listOfData];
      !this.searchValue ? this.reset() : this.search();

      const data = this.getCandlesData();
      // console.log(data);
      this.lineSeries.setData(data);

      this.dailyVolume = this.getDailyVolume(result.data.pairHourDatas);

      this.counter = this.counter + 1;
      if (this.counter === 1) {
        /* this.tokenService.getTokenGeckoInfo(this.token.id).subscribe(
          (res) => {
            this.geckoInfo = res;
          },
          ({ error }) => {
            this.geckoInfo = null;
          }
        ); */
        this.chart.timeScale().fitContent();
        this.fetchMoreQuery();
      }
      this.loading = result.loading;
      this.error = result.error;
    });
  }

  getCandlesData() {
    let objArray = [...this.listOfData].map((d) => ({
      date: this.roundTimeQuarterHour(d.date),
      price: d.priceUSD,
    }));

    const groupBy = (array) => {
      return array.reduce((result, currentValue) => {
        (result[currentValue.date] = result[currentValue.date] || []).push(
          currentValue
        );
        return result;
      }, {});
    };

    const grouped = Object.values(groupBy(objArray)) as any[];

    const groupedAndReduced = grouped.map((gr) =>
      gr.reduce(
        (res, curr) => ({
          time: (curr.date as Date).valueOf() / 1000,
          close: gr.length && gr[0].price,
          open: gr.length && gr[gr.length - 1].price,
          high: Math.max.apply(
            Math,
            gr.map(function (o) {
              return o.price;
            })
          ),
          low: Math.min.apply(
            Math,
            gr.map(function (o) {
              return o.price;
            })
          ),
        }),
        {}
      )
    );
    const sorted = groupedAndReduced.sort(function (a, b) {
      return a.time - b.time;
    });
    return sorted;
  }

  fetchMoreQuery() {
    let currentId = '';
    this.fetchMoreIsLoading = true;
    this.oldestTimestamp =
      this.listOfData &&
      this.listOfData.length &&
      this.listOfData[this.listOfData.length - 1].date;

    this.query
      .fetchMore({
        variables: {
          tokenId: this.tokenId,
          pairIn: [this.tokenId],
          currentOlderTimestamp: 0,
          startTimestamp: this.startTimestamp / 1000,
          yesterday: this.yesterday / 1000,
          fromTimestamp: +this.oldestTimestamp,
        },
      })
      .then((res) => {
        const newData = this.buildSwaps(res);
        currentId = newData[0] && newData[0].txId;
        const found =
          currentId && this.listOfData.find((d) => d.txId === currentId);

        const noMoreNeeded = !currentId || !!found;
        const merged = [...this.listOfData, ...newData];
        this.listOfData = this.removeDuplicateSwaps(merged);
        this.listOfDisplayData = [...this.listOfData];

        if (this.listOfData && this.listOfData.length) {
          const timeRange =
            this.listOfData[0].date -
            this.listOfData[this.listOfData.length - 1].date;
          const timeRangeInHours = timeRange / 3600;
          this.timeInterval =
            timeRangeInHours > 360
              ? 720
              : timeRangeInHours > 168
              ? 240
              : timeRangeInHours > 72
              ? 60
              : timeRangeInHours > 48
              ? 30
              : timeRangeInHours > 24
              ? 15
              : timeRangeInHours > 12
              ? 10
              : timeRangeInHours > 4
              ? 5
              : timeRangeInHours > 2
              ? 3
              : 1;
        }
        this.timeChanged();
        // console.log('found', !!found);

        if (!noMoreNeeded && this.iteration < 5) {
          this.iteration++;
          // console.log('MORE', this.iteration);
          this.fetchMoreQuery();
        } else {
          this.iteration = 0;
          this.fetchMoreIsLoading = false;
        }
      })
      .catch((err) => {
        console.log(err);
        this.fetchMoreIsLoading = false;
      });
  }

  private buildSwaps(fetchMoreResult: any): ChartToken[] {
    return fetchMoreResult.data.swaps.map((sw) => {
      const ethAmount = this.tokenIsFirstInPair
        ? sw.amount1In > 0
          ? sw.amount1In
          : sw.amount1Out
        : sw.amount0In > 0
        ? sw.amount0In
        : sw.amount0Out;
      const tokenAount = this.tokenIsFirstInPair
        ? sw.amount0In > 0
          ? sw.amount0In
          : sw.amount0Out
        : sw.amount1In > 0
        ? sw.amount1In
        : sw.amount1Out;
      const dd = {
        date: sw.timestamp,
        type: this.tokenIsFirstInPair
          ? sw.amount1In > 0
            ? 'buy'
            : 'sell'
          : sw.amount0In > 0
          ? 'buy'
          : 'sell',
        priceUSD: sw.amountUSD / tokenAount,
        priceETH: ethAmount / tokenAount,
        amountToken: tokenAount,
        amountEth: ethAmount,
        makerId: !this.tokenIsFirstInPair
          ? sw.amount0In > 0
            ? sw.to
            : sw.sender
          : sw.amount1In > 0
          ? sw.to
          : sw.sender,
        txId: sw.transaction.id,
      } as ChartToken;

      return dd;
    });
  }

  getDailyVolume(pairHourData: any[]) {
    /* const volume = pairHourData.reduce((res, curr) => {
      return res + +curr.hourlyVolumeUSD;
    }, 0); */
    const volume = pairHourData.reduce((res, curr) => {
      return (
        res +
        +(this.tokenIsFirstInPair
          ? curr.hourlyVolumeToken1
          : curr.hourlyVolumeToken0) *
          380
      );
    }, 0);
    return volume;
  }

  formatDate(timestamp: number) {
    return new Date(timestamp * 1000);
  }

  sortDate(a: number, b: number) {
    return a - b;
  }

  reset(): void {
    this.searchValue = 0;
    this.oldestTimestamp = 1757605586;
    this.search();
  }

  search(): void {
    this.visible = false;
    this.listOfDisplayData = this.listOfData.filter(
      (item: ChartToken) => item.amountEth >= this.searchValue
    );
  }

  identify(index, item: ChartToken) {
    return item.txId;
  }

  timeChanged() {
    const data = this.getCandlesData();
    this.lineSeries.setData(data);

    this.chart.timeScale().fitContent();
  }

  roundTimeQuarterHour(time) {
    var timeToReturn = this.formatDate(time);
    timeToReturn.setMilliseconds(0);
    timeToReturn.setSeconds(0);
    if (this.timeInterval <= 60) {
      timeToReturn.setMinutes(
        Math.round(timeToReturn.getMinutes() / this.timeInterval) *
          this.timeInterval
      );
    } else {
      timeToReturn.setMinutes(0);
      timeToReturn.setHours(
        Math.round(timeToReturn.getHours() / (this.timeInterval / 60)) *
          (this.timeInterval / 60)
      );
    }
    return timeToReturn;
  }

  savePriceAlert(val: number) {
    this.savedPriceAlert = val;
    this.tokenService.savePair(this.currentFav);
  }

  saveMyEntry() {
    this.tokenService.savePair(this.currentFav);
  }

  removeDuplicateSwaps(myArr) {
    return myArr
      .filter((obj, pos, arr) => {
        return arr.map((mapObj) => mapObj.txId).indexOf(obj.txId) === pos;
      })
      .sort((a, b) => b.date - a.date);
  }

  ngOnDestroy(): void {
    this.query && this.query.stopPolling();
    clearInterval(this.interval);
    this.subscription.unsubscribe();
    this.subscriptionQuery.unsubscribe();
  }
}
