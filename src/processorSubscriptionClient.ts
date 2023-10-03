import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
    uri: `wss://${process.env.INDEXER_ADDRESS}/graphql` || `wss://127.0.0.1:4350/graphql`,
    cache: new InMemoryCache()
})

export default client;