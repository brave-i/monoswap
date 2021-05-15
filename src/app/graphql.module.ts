import { NgModule } from '@angular/core';
import { Apollo, APOLLO_OPTIONS } from 'apollo-angular';
import {
  ApolloClientOptions,
  DefaultOptions,
  InMemoryCache,
} from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
import { HttpHeaders } from '@angular/common/http';

const uri = 'https://ch-ndp-one.xyz/';
const uri2 =
  'https://subgraph.bscswap.com/subgraphs/name/bscswap/bscswap-subgraph';
const uri3 = 'https://api.thegraph.com/index-node/graphql';
const uri4 =
  'https://api.bscgraph.org/subgraphs/id/QmUDNRjYZ7XbgTvfVnXHj6LcTNacDD9GPXHWLjdTKi6om6';
const bitquery = 'https://graphql.bitquery.io';

const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
};

export function createApollo(httpLink: HttpLink): ApolloClientOptions<any> {
  return {
    link: httpLink.create({ uri }),
    cache: new InMemoryCache({
      dataIdFromObject: (object) => (object as any).id,
    }),
  };
}

@NgModule({
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
  ],
})
export class GraphQLModule {
  constructor(apollo: Apollo, httpLink: HttpLink) {
    apollo.createNamed('bscswap', {
      link: httpLink.create({ uri: uri2 }),
      cache: new InMemoryCache({
        dataIdFromObject: (object) => (object as any).id,
      }),
    });

    apollo.createNamed('pancakeswap', {
      link: httpLink.create({ uri: uri4 }),
      cache: new InMemoryCache({
        dataIdFromObject: (object) => (object as any).id,
      }),
    });

    apollo.createNamed('thegraph', {
      link: httpLink.create({ uri: uri3 }),
      cache: new InMemoryCache({
        dataIdFromObject: (object) => (object as any).id,
      }),
    });

    apollo.createNamed('bitquery', {
      link: httpLink.create({
        uri: bitquery,
        headers: new HttpHeaders({
          'X-API-KEY': 'BQYWodqxFmFv20cwx5yBnMY3ideIGF7n',
        }),
      }),
      cache: new InMemoryCache({ resultCaching: true }),
      defaultOptions,
    });
  }
}
