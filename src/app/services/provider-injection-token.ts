import { InjectionToken } from '@angular/core';
import { getDefaultProvider, providers } from 'ethers';
import { environment } from 'src/environments/environment';

export const PROVIDER = new InjectionToken<providers.BaseProvider>(
  'Ethereum Provider',
  {
    providedIn: 'root',
    factory: () =>
      getDefaultProvider(environment.network, {
        etherscan: 'RQ9XCD4DKV45FD6VGP71SM3Z5X3KNXCJV7',
        infura: '5eb1a274744d48869a7a37c12ce115d2',
      }),
  }
);
