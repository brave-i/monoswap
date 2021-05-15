import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import {
  map,
  tap,
  catchError,
  delay,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from 'rxjs/operators';

import { Apollo, QueryRef } from 'apollo-angular';
import gql from 'graphql-tag';
import { LocalStorageService } from './local-storage.service';
import { Favorite } from '../models/favorites';
import { PairDTO } from '../models/pairDTO';
import { CoinGeckoTokenInfo } from '../models/coinGeckoTokenInfo';
import { EtherService } from './ether.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BscToken } from '../models/bscToken';
import { NewPairs } from '../models/new-pairs';

const HEALTH = gql`
  query getHealth($graphName: String!) {
    indexingStatusForCurrentVersion(subgraphName: $graphName) {
      subgraph
      synced
      health
      fatalError {
        message
        block {
          number
          hash
        }
        handler
      }
      chains {
        network
        ... on EthereumIndexingStatus {
          latestBlock {
            number
            hash
          }
          chainHeadBlock {
            number
            hash
          }
        }
      }
    }
  }
`;

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

const GET_PAIRID_FROM_TXID = gql`
  query getPairId($txId: String!) {
    transaction(id: $txId) {
      id
      swaps {
        id
        pair {
          id
        }
      }
    }
  }
`;

const GET_PAIRID_FROM_TOKENSYMBOL = gql`
  query getPairId($tokenSymbol: String!) {
    pairs(where: { reserveETH_gt: 1, token0: $tokenId }) {
      id
    }
  }
`;

const GET_LAST_SWAP = gql`
  query getLastSwap {
    swaps(first: 1, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
    }
  }
`;

const PANCAKE_TOKEN_SEARCH = gql`
  query getPancakeTokens($id: String, $value: String) {
    resSymbol: tokens(
      where: { symbol_contains: $value, totalLiquidity_gt: 10 }
      orderBy: totalLiquidity
      orderDirection: desc
    ) {
      id
      symbol
      name
      totalLiquidity
      __typename
    }
    resName: tokens(
      where: { name_contains: $value, totalLiquidity_gt: 10 }
      orderBy: totalLiquidity
      orderDirection: desc
    ) {
      id
      symbol
      name
      totalLiquidity
      __typename
    }
    resAddress: tokens(
      where: { id: $id, totalLiquidity_gt: 10 }
      orderBy: totalLiquidity
      orderDirection: desc
    ) {
      id
      symbol
      name
      totalLiquidity
      __typename
    }
  }
`;

const PANCAKE_PAIRS_SEARCH = gql`
  query getPancakePairs($id: String, $tokens: [String]) {
    res0: pairs(
      where: { token0_in: $tokens, volumeUSD_gt: 10000 }
      orderBy: reserveETH
      orderDirection: desc
    ) {
      id
      volumeUSD
      token0 {
        id
        symbol
        name
        __typename
      }
      token1 {
        id
        symbol
        name
        __typename
      }
      __typename
    }
    res1: pairs(
      where: { token1_in: $tokens, volumeUSD_gt: 10000 }
      orderBy: reserveETH
      orderDirection: desc
    ) {
      id
      volumeUSD
      token0 {
        id
        symbol
        name
        __typename
      }
      token1 {
        id
        symbol
        name
        __typename
      }
      __typename
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  queryGetTokens: QueryRef<any>;
  page = 0;
  savedPairs$ = new BehaviorSubject(this.savedPairs);
  chartIsReady = new BehaviorSubject(false);
  token0 = {
    id: '',
    symbol: '',
  };
  token1 = {
    id: '',
    symbol: '',
  };

  ethPrice = 0;

  resize$;
  isCollapsed = false;

  constructor(
    private http: HttpClient,
    private apollo: Apollo,
    private localStorage: LocalStorageService,
    private notification: NzNotificationService,
    private etherService: EtherService
  ) {}

  getTokenGeckoInfo(contractAddress): Observable<CoinGeckoTokenInfo> {
    const url = `https://api.coingecko.com/api/v3/coins/ethereum/contract/${contractAddress}`;
    return this.http.get<any>(url).pipe(
      map((res) => ({
        id: res.id,
        logoUrl: res.image.thumb,
        homepage: res.links.homepage[0],
        twitter_handle: res.links.twitter_screen_name,
        discord_link: res.links.chat_url[0].includes('discord')
          ? res.links.chat_url[0]
          : '',
        market_cap_usd: res.market_data.market_cap.usd,
        total_supply: res.market_data.total_supply,
        circulating_supply: res.market_data.circulating_supply,
        price_change_percentage_24h:
          res.market_data.price_change_percentage_24h,
        price_change_percentage_7d: res.market_data.price_change_percentage_7d,
        market_cap_change_percentage_24h_in_currency:
          res.market_data.market_cap_change_percentage_24h_in_currency.usd,
        telegram_channel_identifier: res.links.telegram_channel_identifier,
      }))
    );
  }

  getPairFromToken(
    tokenSymbol: string
  ): Observable<{ id: string; logoUrl: string }> {
    const url = `https://astrotools.azurewebsites.net/api/pairs/${tokenSymbol}`;
    return this.http.get<any>(url).pipe(
      catchError((error) => {
        if (error.error instanceof ErrorEvent) {
        } else {
        }
        return of([]);
      })
    );
  }

  getPairFromSearchStringERC(searchString: string): Observable<PairDTO[]> {
    //const url = `https://astrotools.azurewebsites.net/api/pairs/ERC-20/${searchString}`;
    const url = `https://ch-ndp-one.xyz/tokens/${searchString}`;
    return this.http.get<any>(url).pipe(
      catchError((error) => {
        if (error.error instanceof ErrorEvent) {
        } else {
        }
        return of([]);
      })
    );
  }

  getTokensPancake(searchString: string): Observable<any> {
    let tokensIds = [];
    const queryTokens = this.apollo.use('pancakeswap').watchQuery({
      query: PANCAKE_TOKEN_SEARCH,
      variables: {
        id: searchString,
        value: searchString,
      },
    });

    const queryPairs = this.apollo.use('pancakeswap').watchQuery({
      query: PANCAKE_PAIRS_SEARCH,
    });

    return queryTokens.valueChanges.pipe(
      switchMap((resTokens: any) => {
        const res: any = [
          ...resTokens.data.resSymbol,
          ...resTokens.data.resName,
          ...resTokens.data.resAddress,
        ];
        tokensIds = res.map((token) => token.id);
        queryPairs.setVariables({ id: searchString, tokens: tokensIds });
        return queryPairs.valueChanges.pipe(
          map((res: any) => {
            return (
              res &&
              res.data &&
              res.data.res0 && [...res.data.res0, ...res.data.res1]
            );
          })
        );
      })
    );
  }

  getPairFromSearchStringBEP(searchString: string): Observable<PairDTO[]> {
    const url = `https://ae-mx.be/api/PancakePairs/SearchStringPairs?searchString=${searchString}`;
    return this.http.get<any>(url).pipe(
      catchError((error) => {
        if (error.error instanceof ErrorEvent) {
        } else {
        }
        return of([]);
      })
    );
  }

  getEthPrice() {
    this.http
      .get<any>(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      )
      .pipe(
        map((res) => res.ethereum.usd),
        tap((res) => (this.ethPrice = res))
      )
      .subscribe();
  }

  getTransactionInfo(txId: string): Observable<string> {
    return this.http
      .get<any>(
        `https://api.ethplorer.io/getTxInfo/${txId}?apiKey=EK-5A1Ks-VFG6W7q-wUwNs`
      )
      .pipe(map((res) => res.from));
  }

  getBscTokens(): Observable<BscToken[]> {
    return this.http
      .get<any[]>(
        `https://astrotools.azurewebsites.net/api/pairs/BEP-20/alertNewToken/`
      )
      .pipe(
        map((res: any[]) =>
          res.map((token) => ({
            tokenId: token._id,
            tokenName: token.tokenName,
            creationDate: token.dateCreationToken,
            officialSite: token.officialSite,
            holders: token.holderCount,
            oldHolders: token.holderCountOld,
            contractId: token.contractId,
            updateDate: token.dateUpdate,
            linksSocial: token.linksSocial,
          }))
        )
      );
  }

  getERCTokens(pairs: NewPairs[]): Observable<NewPairs[]> {
    const date = pairs && pairs.length ? pairs[0].createdAtTimestamp : 0;
    return this.http
      .get<any[]>(
        `https://astrotools.azurewebsites.net/api/pairs/ERC-20/alertNewToken/${date}`
      )
      .pipe();
  }
  getPancakeTokens(pairs: NewPairs[]): Observable<NewPairs[]> {
    const date = pairs && pairs.length ? pairs[0].createdAtTimestamp : 0;
    return this.http
      .get<any[]>(
        `https://astrotools.azurewebsites.net/api/pairs/PANCAKE/alertNewToken/${date}`
      )
      .pipe();
  }

  getLastSwap(): QueryRef<any> {
    return this.apollo.watchQuery({
      query: GET_LAST_SWAP,
    });
  }

  getTokenPrice(id: string): QueryRef<any> {
    return this.apollo.watchQuery({
      query: TOKEN_PRICE_QUERY,
      variables: {
        tokenId: id,
      },
    });
  }

  getPairIdFromTxId(tokenSymbol: string): QueryRef<any> {
    return this.apollo.watchQuery({
      query: GET_PAIRID_FROM_TOKENSYMBOL,
      variables: {
        tokenSymbol: tokenSymbol,
      },
    });
  }

  getTokensPrice(ids: string[]): QueryRef<any> {
    return this.apollo.watchQuery({
      query: TOKENS_PRICE_QUERY,
      variables: {
        tokenIds: ids,
      },
    });
  }

  getTokens() {
    return this.apollo.watchQuery({
      query: TOKEN_QUERY,
      variables: {
        page: 0,
      },
    });
  }

  getTokenByPairId(pairId: string) {
    return this.apollo.watchQuery({
      query: TOKEN_BYPAIRID,
      variables: {
        pairId,
      },
    });
  }

  getGraphHealth(graphName: string) {
    return this.apollo.use('thegraph').watchQuery({
      query: HEALTH,
      variables: {
        graphName,
      },
    });
  }

  setTokentId({ address, symbol }) {
    if (address === '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c') {
      this.token1.id = address;
      this.token1.symbol = symbol;
    } else {
      this.token0.id = address;
      this.token0.symbol = symbol;
    }
  }

  /* getTokens(page) {
    return this.apollo.watchQuery({
      query: TOKEN_QUERY,
      variables: {
        page: page * 1000,
      },
    });
  } */

  isPairSaved$(id: string): Observable<boolean> {
    return this.savedPairs$.pipe(map((p) => !!p.find((f) => f.id === id)));
  }

  isTokenFirst(inputAddress: string): boolean {
    return this.token0.id === inputAddress;
  }

  get getTokenSymbol() {
    return this.token0.id.toLowerCase() !==
      '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'
      ? this.token0.symbol
      : this.token1.symbol;
  }

  savePair(favorite: Favorite) {
    /* if (this.etherService.noAstro && this.savedPairs.length >= 4) {
      this.notification
        .blank(
          `LEVEL UP!`,
          `Hold at least 1 ASTRO to add more favorites and alerts`,
          { nzDuration: 0 }
        )
        .onClick.subscribe(() => {
        });
      return;
    } */
    let fav = this.savedPairs.find((f) => f.id === favorite.id);
    fav && this.removePair(fav);
    this.savedPairs = [...this.savedPairs, favorite];
  }

  removePair(favorite: Favorite) {
    this.savedPairs = this.savedPairs.filter((p) => p.id !== favorite.id);
  }
  removePairById(id: string) {
    this.savedPairs = this.savedPairs.filter((p) => p.id !== id);
  }

  set savedPairs(value: Favorite[]) {
    this.savedPairs$.next(value);
    this.localStorage.setSavedPairs(value);
  }

  get savedPairs(): Favorite[] {
    return this.localStorage.getSavedPairs();
  }
}
