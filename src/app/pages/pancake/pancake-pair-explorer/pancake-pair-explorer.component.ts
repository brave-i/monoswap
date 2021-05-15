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
import { PairDTO, PancakePairDTO, TokenDTO } from 'src/app/models/pairDTO';
import { TokenService } from 'src/app/services/token.service';
import { Favorite } from 'src/app/models/favorites';
import { map } from 'rxjs/operators';
import { ColumnItem } from 'src/app/models/columnItem';
import { LocalStorageService } from 'src/app/services/local-storage.service';

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

const CANDLES_QUERY = gql`
  query CandlesData(
    $tokenId: String!
    $from: ISO8601DateTime!
    $to: ISO8601DateTime!
    $timeframe: Int
    $limit: Int
  ) {
    ethereum(network: bsc) {
      dexTrades(
        options: { limit: $limit, asc: "timeInterval.minute" }
        date: { between: [$from, $to] }
        exchangeName: { is: "Pancake" }
        tradeAmountUsd: { gt: 10 }
        any: [
          {
            baseCurrency: { is: $tokenId }
            quoteCurrency: { is: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" }
          }
          {
            baseCurrency: { is: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" }
            quoteCurrency: { is: "0xe9e7cea3dedca5984780bafc599bd69add087d56" }
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

const GETTOKENS_ADDRESSES_QUERY = gql`
  query GetTokensAddresses($pairId: String!) {
    ethereum(network: bsc) {
      dexTrades(
        options: { limit: 1, asc: "block.height" }
        exchangeName: { is: "Pancake" }
        smartContractAddress: { is: $pairId }
      ) {
        transaction {
          hash
        }
        block {
          height
          timestamp {
            time(format: "%Y-%m-%d %H:%M:%S")
          }
        }
        buyCurrency {
          symbol
          address
        }
        sellCurrency {
          symbol
          address
        }
      }
    }
  }
`;

const GET_SWAPS = gql`
  query GetSwaps($pairId: String!, $limit: Int!, $height: Int!) {
    ethereum(network: bsc) {
      dexTrades(
        options: { limit: $limit, desc: "block.height" }
        exchangeName: { is: "Pancake" }
        smartContractAddress: { is: $pairId }
        tradeAmountUsd: { gt: 10 }
        height: { gt: $height }
      ) {
        transaction {
          hash
          txFrom {
            address
          }
        }
        smartContract {
          address {
            address
          }
        }
        block {
          height
          timestamp {
            time(format: "%Y-%m-%d %H:%M:%S")
          }
        }
        inputAmount: buyAmount
        inputAmountInUsd: buyAmount(in: USD)
        inputCurrency: buyCurrency {
          symbol
          address
        }
        outputAmount: sellAmount
        outputAmountInUsd: sellAmount(in: USD)
        outputCurrency: sellCurrency {
          symbol
          address
        }
        tradeAmount(in: USD)
      }
    }
  }
`;

const GET_PAIR_INFO = gql`
  query getPairInfo($pairId: String!) {
    ethereum(network: bsc) {
      transfers(
        currency: { is: $pairId }
        amount: { gt: 0 }
        date: { since: "2021-03-01", till: "2021-03-01" }
      ) {
        currency {
          symbol
          address
        }
        volumeUSD: amount
        txCount: count
        sender_count: count(uniq: senders)
        receiver_count: count(uniq: receivers)
      }
      address(address: { is: $pairId }) {
        balances {
          currency {
            symbol
            address
          }
          value
        }
      }
    }
  }
`;

const CANDLES_QUERY2 = gql`
  query CandlesData($tokenId: String!) {
    ethereum(network: bsc) {
      dexTrades(
        options: { limit: 100, asc: "timeInterval.minute" }
        date: { since: "2021-03-07" }
        exchangeName: { is: "Pancake" }
        baseCurrency: { is: $tokenId }
        quoteCurrency: { is: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" }
      ) {
        timeInterval {
          minute(count: 15)
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
        maximum_price: quotePrice(calculate: maximum)
        minimum_price: quotePrice(calculate: minimum)
        open_price: minimum(of: block, get: quote_price)
        close_price: maximum(of: block, get: quote_price)
      }
    }
  }
`;

@Component({
  selector: 'app-pancake-pair-explorer',
  templateUrl: './pancake-pair-explorer.component.html',
  styleUrls: ['./pancake-pair-explorer.component.scss'],
})
export class PancakePairExplorerComponent implements OnInit, OnDestroy {
  pairInfo: PancakePairDTO;
  token: TokenDTO;

  counter = 0;
  startTimestamp = 0;
  yesterday = 0;
  now = 0;
  searchValue = 0;
  visible = false;
  interval;
  timeInterval = 15;
  iteration = 0;

  mostRecentTimestamp = 0;
  oldestTimestamp = 1757605586;
  timestampInit = 1575072000;
  fromBlock = 0;
  lastCandleTimestamp = 1575072000;
  lastCandleData = {};

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

  listOfColumns: ColumnItem[] = [];
  listOfData: ChartToken[] = [];
  listOfDisplayData: ChartToken[] = [];

  tvSub;

  private query: QueryRef<any>;
  loading = true;
  error: any;
  lineSeries;

  subscription: Subscription;
  subscriptionQuery: Subscription;
  barsSub: Subscription;
  swapsSub: Subscription;
  pairId: string;

  tokenIsFirstInPair = false;
  dailyVolume = 0;
  ethPrice = 0;
  geckoInfo: { id: string; logoUrl: string } = null;

  historyProvider = {};
  datafeed: any = {};
  isInitiated = false;

  subs = new Subscription();

  constructor(
    private apollo: Apollo,
    private route: ActivatedRoute,
    public tokenService: TokenService,
    private router: Router,
    private localStorage: LocalStorageService
  ) {}
  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => {
      return false;
    };

    this.listOfData = this.listOfDisplayData = [];

    const paramsSub = this.route.params.subscribe((params) => {
      this.pairId =
        params['tokenId'] && (params['tokenId'] as string).toLocaleLowerCase();
      this.geckoInfo = null;

      const queryAddresses = this.apollo.use('bitquery').watchQuery({
        query: GETTOKENS_ADDRESSES_QUERY,
        variables: {
          pairId: this.pairId,
        },
      });

      const addressesSub = queryAddresses.valueChanges.subscribe(
        ({ data }: any) => {
          // console.log(data);
          this.tokenService.setTokentId(data.ethereum.dexTrades[0].buyCurrency);
          this.tokenService.setTokentId(
            data.ethereum.dexTrades[0].sellCurrency
          );

          /*  console.log('queryAddresse', [
          this.tokenService.token0.symbol,
          this.tokenService.token1.symbol,
        ]); */

          this.listOfColumns = this.getColumns();

          setTimeout(() => {
            this.query = this.apollo.use('bitquery').watchQuery({
              query: GET_SWAPS,
              variables: {
                pairId: this.pairId,
                limit: 100,
                height: this.fromBlock,
              },
            });

            this.getPairData();
            this.getSwaps();

            this.interval = setInterval(() => {
              this.mostRecentTimestamp =
                this.listOfData &&
                this.listOfData.length &&
                this.listOfData[0].date;

              this.query.setVariables({
                pairId: this.pairId,
                limit: 10000,
                height: this.fromBlock,
              });
              this.query.refetch();
            }, 20000);
          }, 1);
        }
      );

      this.subs.add(addressesSub);

      const savedPairsSub = this.tokenService.savedPairs$
        .pipe(map((sp) => sp.find((p) => p.id === this.pairId)))
        .subscribe((p) => {
          return p
            ? (this.currentFav = {
                ...p,
                myEntry: p.myEntry > 0 ? p.myEntry : +p.priceUSD.toFixed(6),
              })
            : (this.currentFav = null);
        });
      this.subs.add(savedPairsSub);
    });

    this.subs.add(paramsSub);
  }

  private toTimestamp(strDate) {
    const datum = Date.parse(strDate + 'Z');
    return datum;
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
          name: this.that.tokenService.token0.symbol,
          description: '',
          type: 'crypto',
          session: '24x7',
          timezone: 'Europe/Luxembourg',
          ticker: symbolName,
          minmov: 1,
          pricescale: 100000,
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
            tokenId: this.that.tokenService.token0.id,
            connector: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
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
                  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'
            );
            // console.log('tokenTrades', tokenTrades);

            const baseCurrencyTrades = [...trades].filter(
              (item) => item && item.baseCurrency.symbol === 'WBNB'
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
              .filter((item) => item && item.symbol !== 'WBNB')
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
        console.log('=====getMarks running');
      },
      getTimeScaleMarks: (
        symbolInfo,
        startDate,
        endDate,
        onDataCallback,
        resolution
      ) => {
        //optional
        console.log('=====getTimeScaleMarks running');
      },
      getServerTime: (cb) => {
        // console.log('=====getServerTime running');
      },
    };
    setTimeout(() => {
      this.isInitiated = true;
    }, 1);
  }

  getSwaps() {
    const swapsSub = this.query.valueChanges.subscribe((res) => {
      this.fromBlock =
        (res &&
          res.data.ethereum.dexTrades &&
          res.data.ethereum.dexTrades[0]?.block.height) ||
        this.fromBlock;
      // console.log('BLOCK 💨', this.fromBlock);

      const swaps = res.data.ethereum.dexTrades.map((swap) => {
        const isTokenFirst = this.tokenService.isTokenFirst(
          swap.inputCurrency.address
        );
        const type = isTokenFirst ? 'sell' : 'buy';

        const tokenAmount = isTokenFirst ? swap.inputAmount : swap.outputAmount;
        const currencyAmount = isTokenFirst
          ? swap.outputAmount
          : swap.inputAmount;
        const tokenAmountInUsd = isTokenFirst
          ? swap.outputAmountInUsd
          : swap.inputAmountInUsd;
        const priceUSD = tokenAmountInUsd / tokenAmount;
        // debugger;

        const sw = {
          date: this.toTimestamp(swap.block.timestamp.time),
          type,
          priceUSD,
          priceETH: currencyAmount / tokenAmount,
          amountToken: tokenAmount,
          amountEth: currencyAmount,
          amountInUsd: swap.tradeAmount,
          makerId: swap.transaction.txFrom.address,
          txId: swap.transaction.hash,
        };

        if (this.tvSub) {
          if (sw.date < this.tvSub.lastBar.time) {
          } else {
            // console.log('new Candle! ☢', [sw.date, this.tvSub.lastBar.time]);

            const lastBar = this.updateBar(sw, this.tvSub);
            // console.log('lastBar 💲💲💲', lastBar);
            this.tvSub.listener(lastBar);
            this.tvSub.lastBar = lastBar;
          }
        }

        return sw as ChartToken;
      });

      this.listOfDisplayData = this.removeDuplicateSwaps([
        ...this.listOfDisplayData,
        ...swaps,
      ]);

      const queryPairInfo = this.apollo.use('bitquery').watchQuery({
        query: GET_PAIR_INFO,
        variables: { pairId: this.pairId },
      });

      const pairInfoSub = queryPairInfo.valueChanges.subscribe((res2) => {
        const pInfo = res2.data as any;
        this.pairInfo = {
          ...this.pairInfo,
          id: this.pairId,
          priceInUSD:
            this.listOfDisplayData && this.listOfDisplayData[0].priceUSD,
          priceInQuote:
            this.listOfDisplayData && this.listOfDisplayData[0].priceETH,
          lastType: this.listOfDisplayData && this.listOfDisplayData[0].type,
          tokenSymbol: this.tokenService.token0.symbol,
          quoteSymbol: this.tokenService.token1.symbol,
          tokenId: this.tokenService.token0.id,
          quoteId: this.tokenService.token1.id,
        };
        if (
          pInfo &&
          pInfo.ethereum.transfers &&
          pInfo.ethereum.transfers.length
        ) {
          this.pairInfo = {
            ...this.pairInfo,
            volumeUSD: pInfo.ethereum.transfers[0].volumeUSD,
            txCount: pInfo.ethereum.transfers[0].txCount,
          };
        }
        if (
          pInfo &&
          pInfo.ethereum.address &&
          pInfo.ethereum.address.length &&
          pInfo.ethereum.address[0].balances &&
          pInfo.ethereum.address[0].balances.length
        ) {
          const currenciesPooled = pInfo.ethereum.address[0].balances;
          this.pairInfo = {
            ...this.pairInfo,
            reserveToken: currenciesPooled.find(
              (cu) => cu.currency.address === this.tokenService.token0.id
            )?.value,
            reserveQuoteToken: currenciesPooled.find(
              (cu) => cu.currency.address === this.tokenService.token1.id
            )?.value,
          };
        }
      });
      this.subs.add(pairInfoSub);
      // console.log('swaps', this.listOfDisplayData);
    });
    this.subs.add(swapsSub);
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
    const rounded = Math.floor(swap.date / (coeff * 1000)) * (coeff * 1000);
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
        volume: swap.amountInUsd,
      };
    } else {
      // update lastBar candle!
      if (swap.priceUSD < lastBar.low) {
        lastBar.low = swap.priceUSD;
      } else if (swap.priceUSD > lastBar.high) {
        lastBar.high = swap.priceUSD;
      }

      lastBar.volume += swap.amountInUsd;
      lastBar.close = swap.priceUSD;
      lastBarTemp = lastBar;
    }
    return lastBarTemp;
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

  private getColumns(): ColumnItem[] {
    return [
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
        name: `Total ${this.tokenService.getTokenSymbol}`,
      },
      {
        name: 'Total BNB',
      },
      {
        name: 'Total USD',
      },
      {
        name: 'Maker',
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
  }
}
