# Yakuswap

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.1.1.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

query: "{ pairHourDatas(where: { hourStartUnix_gt: 1596780469, pair: "0x6a3d23fa07c455f88d70c29d230467c407a3964b"}) { hourlyVolumeToken0 hourlyVolumeToken1 } pair(id: "0x6a3d23fa07c455f88d70c29d230467c407a3964b") { id createdAtTimestamp reserve0 reserve1 token0 { id decimals symbol name } token1 { id decimals symbol name } } swaps (first: 800, where: {pair_in: ["0x6a3d23fa07c455f88d70c29d230467c407a3964b"], timestamp_gt: 1596866794}, orderBy: timestamp, orderDirection:desc) { pair { token0 { symbol} token1 { symbol} } transaction { id} timestamp sender amount0In amount1In amount0Out amount1Out amountUSD to } }"
