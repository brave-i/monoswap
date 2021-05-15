export interface BscToken {
  tokenId: string;
  tokenName: string;
  creationDate: Date;
  officialSite: string;
  holders: number;
  oldHolders: number;
  contractId: string;
  updateDate: Date;
  linksSocial: { type: string; link: string }[];
}

