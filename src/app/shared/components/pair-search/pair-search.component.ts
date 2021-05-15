import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  Renderer2,
} from '@angular/core';
import { TokenService } from 'src/app/services/token.service';
import { QueryRef } from 'apollo-angular';
import { BehaviorSubject, fromEvent, of, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  take,
  tap,
} from 'rxjs/operators';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-pair-search',
  templateUrl: './pair-search.component.html',
  styleUrls: ['./pair-search.component.scss'],
})
export class PairSearchComponent implements OnInit, AfterViewInit {
  private query: QueryRef<any>;
  subscriptionQuery: Subscription;

  selectedValue = null;
  listOfOption: Array<{ value: string; text: string }> = [];
  nzFilterOption = () => true;

  isSearching = false;
  searchString: BehaviorSubject<string>;

  get isPancake() {
    return this.router.url.indexOf('pancake') > -1;
  }

  constructor(
    private tokenService: TokenService,
    private router: Router,
    private currencyPipe: CurrencyPipe,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.searchString = new BehaviorSubject('');

    this.searchString
      .pipe(
        filter((res) => res.length > 1),
        debounceTime(1200),
        distinctUntilChanged()
      )
      .subscribe((value) => {
        this.isSearching = true;
        this.listOfOption = [];
        if (this.isPancake) {
          this.tokenService.getPairFromSearchStringBEP(value).subscribe(
            (res) => {
              const listOfOption: Array<{ value: string; text: string }> = [];
              if (res && res.length > 0) {
                res.forEach((pair) => {
                  this.listOfOption = res.map((opt: any) => ({
                    value: opt.adressPair,
                    text: `${opt.namePair} (${opt.nameToken})`,
                  }));
                  // this.pushTokensBSC(pair, listOfOption);
                });
              }
              this.isSearching = false;
            },
            ({ error }) => {
              console.log(error);
            }
          );
        } else {
          this.tokenService.getPairFromSearchStringERC(value).subscribe(
            (res) => {
              const listOfOption: Array<{ value: string; text: string }> = [];
              const pair = res && res[0];
              if (pair) {
                res.forEach((pair) => {
                  this.pushTokens(pair, listOfOption);
                });
              }
              this.isSearching = false;
            },
            ({ error }) => {
              console.log(error);
            }
          );
        }
      });
  }

  searchERC(value: string) {
    const listOfOption: Array<{ value: string; text: string }> = [];
    if (value && value.length > 2) {
    }
  }

  search(value: string) {
    this.searchString.next(value);
  }

  private pushTokens(pair: any, listOfOption) {
    const token = { value: pair.id, text: '' };
    const volumeTxt =
      +pair.volumeUSD > 0
        ? ` Vol: ${this.formatToCurrency(pair.volumeUSD)}`
        : '';
    token.text =
      pair.token0.id === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
        ? `${pair.token1.symbol} (${pair.token1.name})${volumeTxt}`
        : `${pair.token0.symbol} (${pair.token0.name})${volumeTxt}`;

    listOfOption.push(token);
    this.listOfOption = listOfOption;
  }

  private pushTokensBSC(pair: any, listOfOption) {
    const token = { value: pair.id, text: '' };
    const volumeTxt =
      +pair.volumeUSD > 0 ? `${this.formatToCurrency(pair.volumeUSD)}` : '';
    token.text =
      pair.token0.id === '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
        ? `${pair.token0.symbol}-${pair.token1.symbol} (${pair.token1.name}) ${volumeTxt}`
        : `${pair.token0.symbol}-${pair.token1.symbol} (${pair.token0.name}) ${volumeTxt}`;

    listOfOption.push(token);
    this.listOfOption = listOfOption;
  }

  formatToCurrency(value: number) {
    return this.currencyPipe.transform(
      Math.round(value),
      'USD',
      'symbol',
      '1.0-0'
    );
  }

  searchSelected() {
    this.router.navigateByUrl(
      `${this.isPancake ? '/pancake-pair-explorer/' : '/pair-explorer/'}${
        this.selectedValue
      }`
    );
    this.selectedValue = '';
  }

  onBlur() {
    setTimeout(() => {
      const allEles: any = document.querySelectorAll(
        'nz-select nz-select-top-control nz-select-search input'
      );
      for (const ele of allEles) {
        this.renderer.removeAttribute(ele, 'readonly');
      }
    }, 500);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const allEles: any = document.querySelectorAll(
        'nz-select nz-select-top-control nz-select-search input'
      );
      for (const ele of allEles) {
        this.renderer.removeAttribute(ele, 'readonly');
      }
    }, 1500);
  }
}
