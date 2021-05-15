export interface PairDTO {
  createdAtTimestamp: number;
  id: string;
  reserve0: number;
  reserve1: number;
  token0: TokenDTO;
  token1: TokenDTO;
  txCount: number;
  reserveETH: number;
  reserveUSD: number;
  volumeUSD: number;
}

export interface PancakePairDTO {
  createdAtTimestamp: number;
  id: string;
  reserveToken: number;
  reserveQuoteToken: number;
  token: TokenDTO;
  quoteToken: TokenDTO;
  txCount: number;
  reserveUSD: number;
  volumeUSD: number;
  priceInUSD: number;
  priceInQuote: number;
  lastType: string;
  tokenSymbol: string;
  quoteSymbol: string;
  tokenId: string;
  quoteId: string;
}

export interface TokenDTO {
  decimals?: number;
  id: string;
  name?: string;
  symbol: string;
}
