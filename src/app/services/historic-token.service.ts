import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HistoricTokenService {
  constructor(public http: HttpClient) {}
  public async AddhistoricNavigation(
    idAccount: string,
    idToken: string,
    price: number,
    nameToken: string
  ) {
    const formData = new FormData();
    formData.append('idAccount', idAccount);
    formData.append('idToken', idToken);
    formData.append('price', price.toString());
    formData.append('nameToken', nameToken);
    /* console.log('::Service HOT');
    console.log('formdata::', formData); */
    await this.http
      .post(
        'https://astrotools.azurewebsites.net/api/pairs/ERC-20/HOTPAIR',
        formData
      )
      .subscribe();
  }
  public async AddhistoricNavigationPancake(
    idAccount: string,
    idToken: string,
    price: number,
    nameToken: string
  ) {
    const formData = new FormData();
    formData.append('idAccount', idAccount);
    formData.append('idToken', idToken);
    formData.append('price', price.toString());
    formData.append('nameToken', nameToken);
    /* console.log('::Service HOT');
    console.log('formdata::', formData); */
    await this.http
      .post(
        'https://astrotools.azurewebsites.net/api/pairs/PANCAKE/HOTPAIR',
        formData
      )
      .subscribe();
  }

  gethotPair(
    lapsHours: string,
    pageSize: number,
    pageNum: number,
    idAccount: string
  ) {
    // console.log(lapsHours);
    return this.http.get<any>(
      'https://astrotools.azurewebsites.net/api/pairs/ERC-20/HOTPAIR',
      {
        params: new HttpParams()
          .set('lapsHours', lapsHours)
          .set('pageSize', pageSize.toString())
          .set('pageNum', pageNum.toString())
          .set('idAccount', idAccount),
      }
    );
  }

  gethotPairPancake(
    lapsHours: string,
    pageSize: number,
    pageNum: number,
    idAccount: string
  ) {
    // console.log(lapsHours);
    return this.http.get<any>(
      'https://astrotools.azurewebsites.net/api/pairs/PANCAKE/HOTPAIR',
      {
        params: new HttpParams()
          .set('lapsHours', lapsHours)
          .set('pageSize', pageSize.toString())
          .set('pageNum', pageNum.toString())
          .set('idAccount', idAccount),
      }
    );
  }
}
