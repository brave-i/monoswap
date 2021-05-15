import { NewPairs } from './new-pairs';

export class HistoricToken
{
    public idToken : string;
    public accountInfoSee: any;
    public currentPrice: number;
    public nameToken : string;
    public CountVisite : string;
    public listaccountsSeeTokens : ListaccountsSeeTokens;
}

export class ListaccountsSeeTokens
{
    public accountId : string;
    public dateLastSee: string;
    public seeHighPrice: number;
    public seeLastPrice : number;
    public seeLowPrice : number;
    public tokenId : string;
    public tokenName : string;
}