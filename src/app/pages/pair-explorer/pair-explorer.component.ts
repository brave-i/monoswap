import { Component, OnInit, OnDestroy } from '@angular/core';

import {
  NzTableFilterFn,
  NzTableFilterList,
  NzTableSortFn,
  NzTableSortOrder,
} from 'ng-zorro-antd/table';

import { Apollo, QueryRef } from 'apollo-angular';
import gql from 'graphql-tag';

import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChartToken } from 'src/app/models/chartToken';
import { PairDTO, TokenDTO } from 'src/app/models/pairDTO';
import { TokenService } from 'src/app/services/token.service';
import { Favorite } from 'src/app/models/favorites';
import { filter, map, tap } from 'rxjs/operators';
import { ColumnItem } from 'src/app/models/columnItem';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { EtherService } from 'src/app/services/ether.service';
import { DomSanitizer } from '@angular/platform-browser';
import { popupCenter } from 'src/app/shared/utils/utils';
import { SwapDTO } from 'src/app/models/swapDTO';
import { HistoricTokenService } from 'src/app/services/historic-token.service';

const SWAPS_QUERY = gql`
  query CurrentTokenData(
    $pairId: ID!
    $pairIn: [String]
    $yesterday: Int!
    $currentOlderTimestamp: ID!
    $fromTimestamp: Int!
  ) {
    pairHourDatas(where: { hourStartUnix_gt: $yesterday, pair: $pairId }) {
      hourlyVolumeToken0
      hourlyVolumeToken1
      hourlyVolumeUSD
    }
    pair(id: $pairId) {
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
      sender: from
      amount0In
      amount1In
      amount0Out
      amount1Out
      amountUSD
      to
    }
  }
`;

const CANDLES_QUERY = gql`
  query CandlesData(
    $tokenId: String!
    $from: ISO8601DateTime!
    $to: ISO8601DateTime!
    $timeframe: Int
    $limit: Int
  ) {
    ethereum(network: ethereum) {
      dexTrades(
        options: { limit: $limit, asc: "timeInterval.minute" }
        date: { between: [$from, $to] }
        exchangeName: { is: "Uniswap" }
        tradeAmountUsd: { gt: 10 }
        any: [
          {
            baseCurrency: { is: $tokenId }
            quoteCurrency: { is: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" }
          }
          {
            baseCurrency: { is: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" }
            quoteCurrency: { is: "0xdac17f958d2ee523a2206206994597c13d831ec7" }
          }
        ]
      ) {
        timeInterval {
          minute(count: $timeframe)
        }
        baseCurrency {
          symbol
          address
        }
        baseAmount
        quoteCurrency {
          symbol
          address
        }
        quoteAmount
        trades: count
        quotePrice
        averageQuotePrice: quotePrice(calculate: average)
        maximum_price: quotePrice(calculate: maximum)
        minimum_price: quotePrice(calculate: minimum)
        open_price: minimum(of: block, get: quote_price)
        close_price: maximum(of: block, get: quote_price)
      }
    }
  }
`;

@Component({
  selector: 'app-pair-explorer',
  templateUrl: './pair-explorer.component.html',
  styleUrls: ['./pair-explorer.component.scss'],
})
export class PairExplorerComponent implements OnInit, OnDestroy {
  WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
  USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
  USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
  DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
  pairInfo: PairDTO;
  token: TokenDTO;
  pairUnitVal: TokenDTO = {
    id: this.WETH,
    symbol: 'ETH',
  };

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
  lastCandleData = {};
  tvSub;
  isInitiated = false;

  subs = new Subscription();

  fetchMoreIsLoading = false;
  makerInterval;

  searchMaker = '';

  makers: any[] = [];

  uniswapDrawerVisible = false;
  uniswapDrawerVisible2 = false;
  myTradesDrawerVisible = false;
  myTradesDrawerVisible2 = false;

  public get pairUnit(): TokenDTO {
    return this.pairUnitVal;
  }

  public set pairUnit(v: TokenDTO) {
    this.pairUnitVal = v;
  }

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

  listOfColumns: ColumnItem[] = this.getColumns();
  listOfData: ChartToken[] = [];
  listOfDisplayData: ChartToken[] = [];
  direction = 'buy';

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
  datafeed: any = {};
  barsSub: Subscription;

  offset = new Date().getTimezoneOffset();
  makerCounter = 1;
  theme = 'dark';

  constructor(
    private apollo: Apollo,
    private route: ActivatedRoute,
    private tokenService: TokenService,
    public etherService: EtherService,
    private router: Router,
    public historicTokenService: HistoricTokenService,
    private localStorage: LocalStorageService,
    public sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => {
      return false;
    };

    this.listOfData = this.listOfDisplayData = [];

    const now = new Date();
    now.setMilliseconds(0);
    this.now = now.valueOf();
    this.oldestTimestamp = 1757605586;

    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 24);
    startDate.setMilliseconds(0);
    this.startTimestamp = startDate.valueOf();

    const yesterdayDate = new Date();
    yesterdayDate.setHours(startDate.getHours() - 24);
    yesterdayDate.setMilliseconds(0);
    yesterdayDate.setSeconds(0);
    yesterdayDate.setMinutes(0);
    this.yesterday = yesterdayDate.valueOf();
    this.interval = setInterval(() => {
      this.mostRecentTimestamp =
        this.listOfData && this.listOfData.length && this.listOfData[0].date;

      this.query.setVariables({
        pairId: this.tokenId,
        pairIn: [this.tokenId],
        currentOlderTimestamp: +this.mostRecentTimestamp,
        startTimestamp: this.startTimestamp / 1000,
        yesterday: this.yesterday / 1000,
        fromTimestamp: 1757605586,
      });
      this.query.refetch();
    }, 8000);

    const paramsSub = this.route.params.subscribe((params) => {
      setTimeout(() => {}, 1);

      this.tokenId =
        params.tokenId && (params.tokenId as string).toLocaleLowerCase();
      this.geckoInfo = null;

      const subSavedPairs = this.tokenService.savedPairs$
        .pipe(map((sp) => sp.find((p) => p.id === this.tokenId)))
        .subscribe((p) => {
          return p
            ? (this.currentFav = {
                ...p,
                myEntry: p.myEntry > 0 ? p.myEntry : +p.priceUSD.toFixed(6),
              })
            : (this.currentFav = null);
        });

      this.subs.add(subSavedPairs);

      this.query = this.apollo.watchQuery({
        query: SWAPS_QUERY,
        variables: {
          pairId: this.tokenId,
          pairIn: [this.tokenId],
          currentOlderTimestamp: this.mostRecentTimestamp,
          startTimestamp: this.startTimestamp / 1000,
          yesterday: this.yesterday / 1000,
          fromTimestamp: +this.oldestTimestamp,
        },
      });
      setTimeout(() => {
        this.getSwaps();
        const subResize = this.tokenService.resize$.subscribe(
          ({ width, height }) => {
            const calculatedWidth = this.tokenService.isCollapsed
              ? width - 130
              : width - 640;
          }
        );
        this.subs.add(subResize);
      }, 1);
    });
    this.subs.add(paramsSub);
  }

  private getPairData() {
    const supportedResolutions = [
      '1',
      '5',
      '15',
      '30',
      '60',
      '120',
      '240',
      '1440',
    ];

    const config = {
      supported_resolutions: supportedResolutions,
    };

    this.datafeed = {
      that: this,
      onReady: (cb) => {
        // console.log(' =====onReady running');
        setTimeout(() => cb(config), 0);
      },
      searchSymbols: (
        userInput,
        exchange,
        symbolType,
        onResultReadyCallback
      ) => {
        // console.log('====Search Symbols running');
      },
      resolveSymbol(
        symbolName,
        onSymbolResolvedCallback,
        onResolveErrorCallback
      ) {
        // expects a symbolInfo object in response
        // console.log('======resolveSymbol running', this.that.token);
        // console.log('resolveSymbol:',{symbolName})
        const splitData = symbolName.split(/[:/]/);
        // console.log({split_data})
        const symbolStub = {
          name: this.that.token.symbol + '/USD',
          description: '',
          type: 'crypto',
          session: '24x7',
          timezone: 'Europe/Luxembourg',
          ticker: symbolName,
          minmov: 1,
          pricescale: 10000000,
          has_daily: false,
          has_intraday: true,
          intraday_multipliers: ['1', '15', '60'],
          supported_resolution: supportedResolutions,
          volume_precision: 8,
          data_status: 'streaming',
        };

        setTimeout(() => {
          onSymbolResolvedCallback(symbolStub);
          // console.log('Resolving that symbol....', symbol_stub);
        }, 0);

        // onResolveErrorCallback('Not feeling it today')
      },
      getBars(
        symbolInfo,
        resolution,
        from,
        to,
        onHistoryCallback,
        onErrorCallback,
        firstDataRequest
      ) {
        // console.log('=====gsymbolInfo', symbolInfo);
        // console.log('=====getBars running', [from, to]);
        const timeframe = resolution === '1D' ? 1440 : +resolution;
        const d = new Date();
        const sevenDaysAgo = new Date(d.setDate(d.getDate() - 7));
        const fromDate = new Date(from * 1000);
        const toDate = new Date(to * 1000);

        // console.log('=====timeframe', timeframe);
        // console.log('function args',arguments)
        /* console.log(
          `Requesting bars between ${fromDate.toISOString()} and ${toDate.toISOString()}`
        ); */

        const barsQuery = this.that.apollo.use('bitquery').watchQuery({
          query: CANDLES_QUERY,
          variables: {
            tokenId: this.that.token.id,
            connector: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            from: fromDate,
            to: toDate,
            timeframe,
            limit: 100000,
          },
        });

        this.that.barsSub = barsQuery.valueChanges.subscribe(
          (result) => {
            const trades = result.data.ethereum.dexTrades;
            // console.log('trades', result.data.ethereum.dexTrades);
            if (!trades || !(trades.length > 0)) {
              // console.log('no trades 💥');
              onHistoryCallback([], { noData: true });
              return [];
            }

            const tokenTrades = [...trades].filter(
              (item) =>
                item &&
                item.baseCurrency.address.toLowerCase() !==
                  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
            );
            // console.log('tokenTrades', tokenTrades);

            const baseCurrencyTrades = [...trades].filter(
              (item) =>
                item &&
                item.baseCurrency.address.toLowerCase() ===
                  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
            );
            // console.log('baseCurrencyTrades', baseCurrencyTrades);

            let data = [...tokenTrades].map((bInfo) => {
              return {
                time: this.that.toTimestamp(bInfo.timeInterval.minute),
                close:
                  +bInfo.close_price *
                  baseCurrencyTrades.find(
                    (x) => x.timeInterval.minute === bInfo.timeInterval.minute
                  )?.averageQuotePrice,
                open:
                  +bInfo.open_price *
                  baseCurrencyTrades.find(
                    (x) => x.timeInterval.minute === bInfo.timeInterval.minute
                  )?.averageQuotePrice,
                high:
                  +bInfo.maximum_price *
                  baseCurrencyTrades.find(
                    (x) => x.timeInterval.minute === bInfo.timeInterval.minute
                  )?.averageQuotePrice,
                low:
                  +bInfo.minimum_price *
                  baseCurrencyTrades.find(
                    (x) => x.timeInterval.minute === bInfo.timeInterval.minute
                  )?.averageQuotePrice,
                volume:
                  +bInfo.quoteAmount *
                  baseCurrencyTrades.find(
                    (x) => x.timeInterval.minute === bInfo.timeInterval.minute
                  )?.averageQuotePrice,
                symbol: bInfo.baseCurrency.symbol,
              };
            });

            data = [...data]
              .filter((item) => item && item.symbol !== 'WETH')
              .map((item, index) => {
                if (index === 0) {
                  return item;
                } else {
                  return { ...item, open: data[index - 1].close };
                }
              });

            // console.log('data', data);
            if (data.length) {
              this.that.lastCandleTimestamp =
                data[data.length - 1].time > this.that.lastCandleTimestamp
                  ? data[data.length - 1].time
                  : this.that.lastCandleTimestamp;
              // console.log('💮', this.that.lastCandleTimestamp);
              this.that.lastCandleData = data[data.length - 1];

              onHistoryCallback([...data], { noData: false });
            } else {
              onHistoryCallback([...data], { noData: true });
            }

            return [...data];
          },
          (err) => {
            // console.log('Query Error, retrying 🎁', err);
          }
        );
      },
      subscribeBars: (
        symbolInfo,
        resolution,
        onRealtimeCallback,
        subscribeUID,
        onResetCacheNeededCallback
      ) => {
        // console.log('subscribe 💫, arg:', symbolInfo);
        // console.log('=====subscribeBars runnning');

        const newSub = {
          uid: subscribeUID,
          resolution,
          symbolInfo,
          lastBar: this.lastCandleData,
          listener: onRealtimeCallback,
        };

        this.tvSub = newSub;
        // console.log('this.tvSub', this.tvSub);

        onResetCacheNeededCallback(() => {
          // console.log('onResetCacheNeededCallback');
        });
      },
      unsubscribeBars: (subscriberUID) => {
        // console.log('=====unsubscribeBars running');
        this.barsSub.unsubscribe();
      },
      /* calculateHistoryDepth: (resolution, resolutionBack, intervalBack) => {
        //optional
        console.log('=====calculateHistoryDepth running');
        // while optional, this makes sure we request 24 hours of minute data at a time
        // CryptoCompare's minute data endpoint will throw an error if we request data beyond 7 days in the past, and return no data
        return resolution < 60
          ? { resolutionBack: 'D', intervalBack: '1' }
          : undefined;
      }, */
      getMarks: (
        symbolInfo,
        startDate,
        endDate,
        onDataCallback,
        resolution
      ) => {
        //optional
        // console.log('=====getMarks running');
      },
      getTimeScaleMarks: (
        symbolInfo,
        startDate,
        endDate,
        onDataCallback,
        resolution
      ) => {
        //optional
        // console.log('=====getTimeScaleMarks running');
      },
      getServerTime: (cb) => {
        // console.log('=====getServerTime running');
      },
    };
    setTimeout(() => {
      this.isInitiated = true;
    }, 1);
  }

  private getSwaps() {
    const swapsSub = this.query.valueChanges.subscribe(
      async (result) => {
        // console.log('getData');
        this.pairInfo = result.data.pair;
        this.tokenIsFirstInPair =
          result.data.pair.token1.id === this.WETH ||
          result.data.pair.token1.id === this.USDT ||
          result.data.pair.token1.id === this.USDC ||
          result.data.pair.token1.id === this.DAI;
        this.token = !this.tokenIsFirstInPair
          ? result.data.pair.token1
          : result.data.pair.token0;
        this.pairUnit = this.tokenIsFirstInPair
          ? result.data.pair.token1
          : result.data.pair.token0;
        const formattedSwap = this.buildSwaps(result).sort(
          (a, b) =>
            b.date - a.date ||
            b.type.localeCompare(a.type) ||
            b.priceUSD - a.priceUSD
        );

        this.counter = this.counter + 1;
        if (this.counter === 1) {
          this.getPairData();

          const chartIsReadySub = this.tokenService.chartIsReady.subscribe(
            (isReady) => {
              if (isReady) {
                setTimeout(() => {
                  const mostRecentSwap =
                    formattedSwap[formattedSwap.length - 1];
                  const lastBar = this.updateBar(mostRecentSwap, this.tvSub);
                  // console.log('lastBar 💲💲💲', lastBar);
                  this.tvSub.listener(lastBar);
                  this.tvSub.lastBar = lastBar;
                }, 3000);
              }
            }
          );

          this.subs.add(chartIsReadySub);

          this.dailyVolume = this.getDailyVolume(result.data.pairHourDatas);

          const subGecko = this.tokenService
            .getTokenGeckoInfo(this.token.id)
            .subscribe(
              (res) => {
                this.geckoInfo = res;
              },
              ({ error }) => {
                this.geckoInfo = null;
              }
            );
          this.subs.add(subGecko);
        }

        formattedSwap.reverse().forEach((fsw) => {
          if (this.tvSub) {
            if (+fsw.date * 1000 < this.tvSub.lastBar.time) {
            } else {
              //console.log('new Candle! ☢', [dd.date, this.tvSub.lastBar.time]);
              const lastBar = this.updateBar(fsw, this.tvSub);
              // console.log('lastBar 💲💲💲', lastBar);
              this.tvSub.listener(lastBar);
              this.tvSub.lastBar = lastBar;
            }
          }
        });

        this.listOfData = [...formattedSwap, ...this.listOfData];
        this.listOfData = this.removeDuplicateSwaps([...this.listOfData]);
        this.listOfColumns = this.getColumns();
        this.listOfData = [...this.listOfData].map((d) => ({
          ...d,
        }));
        this.listOfDisplayData = [...this.listOfData];

        this.loading = result.loading;
        this.error = result.error;
      },
      (err) => {
        console.log('Query Error, retrying 🎁', err);
        setTimeout(() => {
          this.getPairData();
        }, 10000);
      }
    );
    this.subs.add(swapsSub);
  }

  private buildSwaps(res: any): ChartToken[] {
    // Wait for uni fix !
    return res.data.swaps
      .filter(
        (s: SwapDTO) =>
          s.transaction.id !==
          '0xb1af4a63eecc9d36e86c8a2a939c0e56cf6e16d087b8b928c9874aaef9489985'
      )
      .map((sw) => {
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

  updateBar(swap, sub) {
    const lastBar = sub.lastBar;
    let resolution = sub.resolution;
    if (resolution.includes('D')) {
      // 1 day in minutes === 1440
      resolution = 1440;
    } else if (resolution.includes('W')) {
      // 1 week in minutes === 10080
      resolution = 10080;
    }
    const coeff = resolution * 60;
    // console.log({coeff})
    const rounded = Math.floor(swap.date / coeff) * coeff * 1000;
    const lastBarSec = lastBar.time;
    let lastBarTemp;

    if (rounded > lastBarSec) {
      // create a new candle, use last close as open **PERSONAL CHOICE**
      lastBarTemp = {
        time: rounded,
        open: lastBar.close,
        high: lastBar.close,
        low: lastBar.close,
        close: swap.priceUSD,
        volume: swap.amountToken * swap.priceUSD,
      };
    } else {
      // update lastBar candle!
      if (swap.priceUSD < lastBar.low) {
        lastBar.low = swap.priceUSD;
      } else if (swap.priceUSD > lastBar.high) {
        lastBar.high = swap.priceUSD;
      }

      lastBar.volume += swap.amountToken * swap.priceUSD;
      lastBar.close = swap.priceUSD;
      lastBarTemp = lastBar;
    }
    return lastBarTemp;
  }

  formatDate(timestamp: number) {
    return new Date(timestamp * 1000);
  }

  sortDate(a: number, b: number) {
    return a - b;
  }

  getDailyVolume(pairHourData: any[]) {
    /* const volume = pairHourData.reduce((res, curr) => {
      return res + +curr.hourlyVolumeUSD;
    }, 0); */
    const multiplicator =
      this.pairUnit.symbol === 'WETH' ? this.tokenService.ethPrice : 1;

    const volume = pairHourData.reduce((res, curr) => {
      return (
        res +
        +(this.tokenIsFirstInPair
          ? curr.hourlyVolumeToken1
          : curr.hourlyVolumeToken0) *
          multiplicator
      );
    }, 0);
    return volume;
  }

  reset(): void {
    this.searchValue = 0;
    this.oldestTimestamp = 1757605586;
    this.search();
  }

  resetMakerSearch(): void {
    this.searchMaker = '';
    this.searchMakerFn();
  }

  searchMakerFn(): void {
    this.visible = false;
    this.listOfDisplayData = [...this.listOfData].filter(
      (item: ChartToken) => item.makerId.indexOf(this.searchMaker) !== -1
    );
  }

  searchThisMaker(txId: string) {
    this.searchMaker = this.searchMaker.length ? '' : txId;
    this.searchMakerFn();
  }

  private toTimestamp(strDate) {
    const datum = Date.parse(strDate + 'Z');
    return datum;
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
      .filter((obj) => obj.amountEth > 0.00001)
      .sort(function (a, b) {
        return (
          b.date - a.date ||
          b.type.localeCompare(a.type) ||
          b.priceUSD - a.priceUSD
        );
      });
  }

  open(direction: string): void {
    this.direction = direction;
    this.uniswapDrawerVisible = true;
    setTimeout(() => {
      this.uniswapDrawerVisible2 = true;
    }, 100);
  }

  close(): void {
    this.uniswapDrawerVisible = false;
    this.uniswapDrawerVisible2 = false;
    this.myTradesDrawerVisible = false;
    this.myTradesDrawerVisible2 = false;
  }

  openMyTradesDrawer(): void {
    this.myTradesDrawerVisible = true;

    setTimeout(() => {
      this.myTradesDrawerVisible2 = true;
    }, 100);
  }

  closeMyTradesDrawer(): void {
    this.myTradesDrawerVisible = false;
    this.myTradesDrawerVisible2 = false;
  }

  getUniUrlBuy() {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://app.uniswap.org/#/swap?outputCurrency=' +
        this.token.id +
        '&theme=' +
        this.localStorage.theme
    );
  }

  getUniUrlSell() {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://app.uniswap.org/#/swap?inputCurrency=' +
        this.token.id +
        '&theme=' +
        this.localStorage.theme
    );
  }

  getOpenDrawer(direction: string) {
    this.open(direction);
  }

  openMyZerion(addressId: string) {
    popupCenter({
      url: 'https://app.zerion.io/' + addressId + '/overview',
      title: 'My Zerion',
      w: 900,
      h: 620,
    });
    return false;
  }

  clearAlerts() {
    this.savedPriceAlert = 0;
  }

  private getColumns(): ColumnItem[] {
    return [
      {
        name: 'Time',
        sortFn: (a: ChartToken, b: ChartToken) => a.date - b.date,
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
        sortFn: (a: ChartToken, b: ChartToken) => a.priceUSD - b.priceUSD,
        filterMultiple: false,
        filterFn: (price: number, item: ChartToken) => item.priceUSD >= price,
      },
      {
        name: `Price (${
          this.pairUnit.symbol === 'WETH' ? 'ETH' : this.pairUnit.symbol
        })`,
        sortFn: (a: ChartToken, b: ChartToken) => a.priceETH - b.priceETH,
      },
      {
        name: 'Token Qty',
        sortFn: (a: ChartToken, b: ChartToken) => a.amountToken - b.amountToken,
      },
      {
        name: `Total ${
          this.pairUnit.symbol === 'WETH' ? 'ETH' : this.pairUnit.symbol
        }`,
        sortFn: (a: ChartToken, b: ChartToken) => a.amountEth - b.amountEth,
      },
      {
        name: 'Address',
      },
      {
        name: 'Links',
      },
    ];
  }

  ngOnDestroy(): void {
    this.query && this.query.stopPolling();
    clearInterval(this.interval);
    this.subs.unsubscribe();
    this.tokenService.chartIsReady.next(false);
  }
}
