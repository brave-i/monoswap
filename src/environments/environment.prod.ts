export const environment = {
  production: true,
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
