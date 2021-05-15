import { Inject, Injectable, Provider } from '@angular/core';
import { Signer, utils, providers, Wallet, ethers, Contract } from 'ethers';
import { PROVIDER } from './provider-injection-token';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';

import {
  LOCAL_STORAGE,
  StorageService,
  StorageTranscoders,
} from 'ngx-webstorage-service';
import { BehaviorSubject, of } from 'rxjs';
import { WEB3 } from './web3';
import Web3 from 'web3';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { astroNFT } from '../models/astroNFT.enum';
import { environment } from 'src/environments/environment';

declare let require: any;
declare let window: any;
// const Web3 = require('web3');

const daiAbi = [
  // Some details about the token
  'function name() view returns (string)',
  'function symbol() view returns (string)',

  // Get the account balance
  'function balanceOf(address) view returns (uint)',

  // Send some of your tokens to someone else
  'function transfer(address to, uint amount)',

  // An event triggered whenever anyone transfers to someone else
  'event Transfer(address indexed from, address indexed to, uint amount)',
  'function getValue() view returns (string value)',
];

@Injectable({ providedIn: 'root' })
export class EtherService {
  private wallet: Wallet;
  // web3;
  enable;
  account;
  astroAddress = '0xcbd55d4ffc43467142761a764763652b48b969ff';
  secondTokenAddress = '0x62359ed7505efc61ff1d56fef82158ccaffa23d7';
  powerUpAddress = '0xd8cd8cb7f468ef175bc01c48497d3f7fa27b4653';

  connectedAddress = '';
  astroAmount = 0;
  secondTokenAmount = 0;
  idAccount: string;

  connectedAddress$ = new BehaviorSubject('');

  hasLvl1 = false;
  hasLvl2 = false;
  hasLvl3 = false;

  public connector;

  constructor(
    @Inject(PROVIDER) public provider: providers.BaseProvider,
    @Inject(WEB3) private web3: Web3,
    @Inject(LOCAL_STORAGE) private storage: StorageService,
    private http: HttpClient
  ) {
    // Create a connector
    this.createConnector();

    if (window.ethereum === undefined) {
      // alert('Non-Ethereum browser detected. Install MetaMask');
    } else {
      if (typeof window.web3 !== 'undefined') {
        // this.web3 = window.web3.currentProvider;
      } else {
        // this.web3 = new Web3.providers.HttpProvider('http://localhost:8545');
      }
      // console.log('transfer.service :: constructor :: window.ethereum');
      // this.web3 = new Web3(window.ethereum);
      // console.log('transfer.service :: constructor :: this.web3');
      // console.log(this.web3);

      window.ethereum.on('accountsChanged', async (res) => {
        this.web3.eth.getAccounts(async (error, accounts) => {
          // console.log(accounts[0], 'current account after account change');
          const account = accounts && accounts[0];
          this.idAccount = account;
          await this.afterConnection(account);
        });
      });
    }

    this.connectedAddress$.subscribe(async (res) => {
      if (!res) return;
      this.idAccount = res;
      // this.hasLvl1 = await this.getHasNFT(astroNFT.Lvl_1_NoobCanon, res.toLowerCase());
      this.hasLvl2 = await this.getHasNFT(
        astroNFT.Lvl_2_PipeCleaner,
        res.toLowerCase()
      );
      this.hasLvl3 = await this.getHasNFT(
        astroNFT.Lvl_3_BFG9001,
        res.toLowerCase()
      );
      // console.log('levels', { lvl1: this.hasLvl1, lvl2: this.hasLvl2, lvl3: this.hasLvl3});
    });
  }

  private createConnector() {
    this.connector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org',
      qrcodeModal: QRCodeModal,
    });

    this.connector.on('connect', async (error, payload) => {
      if (error) {
        throw error;
      }

      QRCodeModal.close();
      // Get provided accounts and chainId
      const { accounts, chainId } = payload.s[0];
      await this.afterConnection(accounts && accounts[0]);
    });

    this.connector.on('disconnect', (error, payload) => {
      if (error) {
        throw error;
      }
      this.afterConnection('');
    });

    this.connector.on('session_update', async (error, payload) => {
      if (error) {
        throw error;
      }
      const { accounts, chainId } = payload.params[0];
      await this.afterConnection(accounts && accounts[0]);
    });

    if (this.connector.connected) {
      this.afterConnection(this.connector.accounts[0]);
    }
  }

  private async afterConnection(account: string) {
    this.connectedAddress = account;
    this.connectedAddress$.next(this.connectedAddress);

    const balance = await this.getTokenBalance(account, this.astroAddress);
    /* const balanceSecondToken = await this.getTokenBalance(
      account,
      this.secondTokenAddress
    ); */
    this.astroAmount =
      +balance > this.astroAmount ? +balance : this.astroAmount;

    /* this.secondTokenAmount =
            +balanceSecondToken > this.secondTokenAmount
              ? +balanceSecondToken
              : this.secondTokenAmount; */

    return Promise.resolve(true);
  }

  getAccountConnected(): string {
    return this.idAccount ?? null;
  }
  getHasNFT(id: number, address: string): Promise<boolean> {
    const url = `https://api-mainnet.rarible.com/ownerships/0xd8cd8cb7f468ef175bc01c48497d3f7fa27b4653%3A${id}%3A${address}`;
    return this.http
      .get<any>(url)
      .pipe(
        catchError((error) => {
          if (error.error instanceof ErrorEvent) {
          } else {
          }
          return of(false);
        }),
        map((r) => {
          if (!r) {
            return false;
          } else {
            return r.ownership.token === this.powerUpAddress;
          }
        })
      )
      .toPromise();
  }

  // 8-bit - 0
  get noAstro() {
    return this.astroAmount < 1;
  }

  // 8-bit - 1
  get astroTier1() {
    return this.astroAmount >= 1 && this.astroAmount < 250;
  }

  // 16-bit - 1000
  get astroTier2() {
    return (
      (this.astroAmount >= 250 || this.secondTokenAmount >= 0.1) &&
      this.astroAmount < 1000
    );
  }

  // 32-bit - 1000
  get astroTier3() {
    return (
      (this.astroAmount >= 1000 && this.astroAmount < 20000) ||
      (this.hasLvl2 && !this.hasLvl3)
    );
  }

  // 64-bit - 20000
  get astroTier4() {
    return this.astroAmount >= 20000 || this.hasLvl3 || !environment.production;
  }

  get hasTier1Access() {
    return (
      this.astroTier1 || this.astroTier2 || this.astroTier3 || this.astroTier4
    );
  }

  get hasTier2Access() {
    return this.astroTier2 || this.astroTier3 || this.astroTier4;
  }

  get hasTier3Access() {
    return this.astroTier3 || this.astroTier4;
  }

  public async getBalances() {
    this.astroAmount = await this.getTokenBalance('', this.astroAddress);
    /* this.secondTokenAmount = await this.getTokenBalance(
      '',
      this.secondTokenAddress
    ); */
  }

  public async getTokenBalance(
    account: string,
    tokenAddress = this.astroAddress
  ): Promise<any> {
    if (!account) {
      account = await this.getAccount();
      this.connectedAddress = account;
      this.connectedAddress$.next(this.connectedAddress);
      // console.log('transfer.service :: getUserBalance :: account');
      // console.log(account);
    }

    const contract = new Contract(tokenAddress, daiAbi, this.provider);
    const balance =
      //20000;
      (await contract.balanceOf(account)) / 10 ** 18;
    return balance;
  }

  async enableMetaMaskAccount(): Promise<any> {
    let enable = false;
    await new Promise((resolve, reject) => {
      enable = window.ethereum.enable();
    });
    return Promise.resolve(enable);
  }

  async enableWalletConnect(): Promise<any> {
    if (!this.connector.connected) {
      this.createConnector();
      this.connector.createSession().then(() => {
        // get uri for QR Code modal
        const uri = this.connector.uri;
        QRCodeModal.open(uri, () => {
          QRCodeModal.close();
        });
      });
    }
    return Promise.resolve(true);
  }

  disconnectWalletConnect() {
    this.connector.killSession();
  }

  private async getAccount(): Promise<any> {
    // console.log('transfer.service :: getAccount :: start');
    if (this.account == null) {
      this.account = (await new Promise((resolve, reject) => {
        // console.log('transfer.service :: getAccount :: eth');
        // console.log(this.web3.eth);
        this.web3.eth.getAccounts((err, retAccount) => {
          /* console.log('transfer.service :: getAccount: retAccount');
          console.log(retAccount); */
          if (retAccount) {
            this.account = retAccount[0];
            resolve(this.account);
          } else {
            /*  alert('transfer.service :: getAccount :: no accounts found.');
            reject('No accounts found.'); */
          }
          if (err != null) {
            /* alert('transfer.service :: getAccount :: error retrieving account');
            reject('Error retrieving account'); */
          }
        });
      })) as Promise<any>;
    }
    return Promise.resolve(this.account);
  }

  async getFrom(txId: string) {
    const res = await this.web3.eth.getTransactionReceipt(txId);
    return res.from;
  }

  public async getUserBalance(): Promise<any> {
    const account = await this.getAccount();
    // console.log('transfer.service :: getUserBalance :: account');
    // console.log(account);
    return new Promise((resolve, reject) => {
      this.web3.eth.getBalance(account, function (err, balance) {
        // console.log('transfer.service :: getUserBalance :: getBalance');
        // console.log(balance);
        if (!err) {
          const retVal = {
            account,
            balance,
          };
          resolve(retVal);
        } else {
          reject({ account: 'error', balance: 0 });
        }
      });
    }) as Promise<any>;
  }

  getInfo(): Contract {
    return new ethers.Contract(this.astroAddress, daiAbi, this.provider);
  }
}
