export interface Favorite {
  id: string;
  name: string;
  tokenId: string;
  higherSavedPrice?: number;
  lowerSavedPrice?: number;
  myEntry?: number;
  priceUSD?: number;
  priceETH?: number;
}
