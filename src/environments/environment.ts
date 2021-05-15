// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  network: 'mainnet',
  firebase: {
    apiKey: 'AIzaSyDdfQgiGHnbqOfxzn42FpJKd_j35RBlNww',
    authDomain: 'astrotools-b5f44.firebaseapp.com',
    databaseURL: 'https://astrotools-b5f44.firebaseio.com',
    projectId: 'astrotools-b5f44',
    storageBucket: 'astrotools-b5f44.appspot.com',
    messagingSenderId: '244730665270',
    appId: '1:244730665270:web:9f9271ad6c32426844bb97',
    measurementId: 'G-ZERRQ8YPKD',
  },
  api: {
    etherscan: {
      addressToken:
        'https://api.etherscan.io/api?module=account&action=tokentx&address={address}&startblock={startblock}&endblock=999999999&sort=desc&apikey=BHGC1T6G39NTP54D9I1C74M1EGP6IUC65H',
    },
    astro: {
      tokenInfo:
        'https://astrotools.azurewebsites.net/api/tokens?SearchBy=3&SearchKeyword={tokenName}',
      pairInfo: 'https://astrotools.azurewebsites.net/api/pairs/{tokenId}',
    },
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
