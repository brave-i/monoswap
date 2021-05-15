import { PairDTO } from './pairDTO';

export interface SwapDTO {
  id: string;
  transaction?: TransactionDTO;
  timestamp: number;
  pair?: PairDTO;
  sender?: string;
  amount0In?: number;
  amount1In?: number;
  amount0Out?: number;
  amount1Out?: number;
  to?: string;
  logIndex?: number;
  amountUSD?: number;
}

export interface TransactionDTO {
  id: string;
  blockNumber: number;
  timestamp: number;
}
