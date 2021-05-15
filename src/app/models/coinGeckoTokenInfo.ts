export interface CoinGeckoTokenInfo {
  id: string;
  logoUrl: string;
  homepage: string;
  twitter_handle: string;
  telegram_channel_identifier: string;
  discord_link: string;
  market_cap_usd: number;
  total_supply: number;
  circulating_supply: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  market_cap_change_percentage_24h_in_currency: number;
}
