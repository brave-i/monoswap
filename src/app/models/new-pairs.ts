export interface NewPairs {
  contractId: string;
  idPair: string;
  idToken: string;
  tokenName: string;
  contractVerified: boolean;
  createdAtTimestamp: number;
  holderCount: number;
  holderCountOld: number;
  txCount: number;
  isCodeGenerator: boolean;
  currentInfos: CurrentInfos;
  initialInfos: InitialInfos;
}

interface CurrentInfos {
  currentMarketCap: string;
  currentPoolEth: string;
  currentPoolToken: string;
  currentPriceUSD: string;
}

interface InitialInfos {
  initialMarketCap: string;
  initialPoolEth: string;
  initialPoolToken: string;
  initialPriceUSD: string;
}
