import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap, min } from 'rxjs/operators';

import { Apollo, QueryRef } from 'apollo-angular';
import gql from 'graphql-tag';
import { LocalStorageService } from './local-storage.service';
import { Favorite } from '../models/favorites';
import { GetTokensOptions } from '../models/getTokensOptions';

const TOKEN_BYPAIRID = gql`
  query getToken($pairId: String!) {
    pair(id: $pairId) {
      id
      token0 {
        symbol
        name
        id
      }
      token1 {
        symbol
        name
        id
      }
      volumeUSD
    }
  }
`;

const TOKEN_QUERY = gql`
  query getTokens($page: Int!) {
    pairs(first: 500, skip: $page) {
      id
      token0 {
        symbol
      }
      token1 {
        symbol
      }
      volumeUSD
    }
  }
`;

const TOKEN_PRICE_QUERY = gql`
  query getTokenPrice($tokenId: String!) {
    token(id: $tokenId) {
      id
      symbol
      derivedETH
    }
  }
`;

const TOKENS_PRICE_QUERY = gql`
  query getTokenPrice($tokenIds: [String!]) {
    tokens(where: { id_in: $tokenIds }) {
      id
      symbol
      derivedETH
    }
  }
`;

const WHALE_TRANSACTIONS = gql`
  query getWhaleTransac($exceptPairIds: [String!], $minAmountUSD: Int!) {
    swaps(
      where: { amountUSD_gte: $minAmountUSD, pair_not_in: $exceptPairIds }
      orderBy: timestamp
      orderDirection: desc
    ) {
      timestamp
      amountUSD
      amount0In
      amount0Out
      amount1In
      amount1Out
      sender: from
      to
      transaction {
        id
        swaps(first: 5) {
          sender: from
          to
        }
      }
      pair {
        id
        createdAtTimestamp
        token0 {
          symbol
        }
        token1 {
          symbol
        }
      }
    }
  }
`;

const TOKENS_STATS = gql`
  query getTokensStats(
    $minVolume: Int!
    $minTxCount: Int!
    $minLiquidity: Int!
    $minDaysOld: Int!
  ) {
    pairs(
      where: {
        createdAtTimestamp_gte: $minDaysOld
        volumeUSD_gte: $minVolume
        txCount_gte: $minTxCount
        reserveUSD_gte: $minLiquidity
      }
    ) {
      id
      token0 {
        id
        name
        symbol
        tradeVolumeUSD
      }
      token1 {
        id
        name
        symbol
        tradeVolumeUSD
      }
      volumeUSD
      txCount
      reserveUSD
      createdAtTimestamp
    }
  }
`;
const BasePairId = '0xaad22f5543fcdaa694b68f94be177b561836ae57';
const DaiPairId = '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11';
const YsdPairId = '0x2c7a51a357d5739c5c74bf3c96816849d2c9f726';
const EthDaiPairId = '0x55df969467ebdf954fe33470ed9c3c0f8fab0816';
const UsdcWethPairId = '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc';
const UsdtEthPairId = '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852';
const AMPLPairId = '0xc5be99a02c6857f9eac67bbce58df5572498f40c';
const SUSDPairId = '0xf80758ab42c3b07da84053fd88804bcb6baa4b5c';

@Injectable({
  providedIn: 'root',
})
export class WhaleService {
  queryGetTokens: QueryRef<any>;

  whalesDefaultVar = {
    exceptPairIds: [
      BasePairId,
      DaiPairId,
      YsdPairId,
      EthDaiPairId,
      UsdcWethPairId,
      UsdtEthPairId,
      SUSDPairId,
    ],
    minAmountUSD: 10000,
  };

  constructor(
    private http: HttpClient,
    private apollo: Apollo,
    private localStorage: LocalStorageService
  ) {}

  getWhaleTransactions(): QueryRef<any> {
    return this.apollo.watchQuery({
      query: WHALE_TRANSACTIONS,
      variables: this.whalesDefaultVar,
    });
  }

  getTokensStats(
    options: GetTokensOptions,
    exchange = 'uniswap'
  ): QueryRef<any> {
    const daysOldEpoch = options.minDaysOld * 24 * 60 * 60;
    const minDate = Math.round(new Date().valueOf() / 1000) - daysOldEpoch;
    const client =
      exchange === 'uniswap' ? this.apollo : this.apollo.use(exchange);
    return client.watchQuery({
      query: TOKENS_STATS,
      variables: {
        minLiquidity: options.minLiquidity,
        minTxCount: options.minTxCount,
        minVolume: options.minVolume,
        minDaysOld: minDate,
      },
    });
  }
}
