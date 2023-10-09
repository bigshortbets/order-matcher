import { GraphQLClient } from 'graphql-request';
import fetch from 'cross-fetch';
import * as dotenv from 'dotenv';
const WebSocket = require('ws')
const { createClient } = require('graphql-ws');
dotenv.config()
const subClient = createClient({
  webSocketImpl: WebSocket,
  url: (process.env.SUBSCRIPTION_CLIENT_PROTO as string) + "://" + (process.env.INDEXER_ADDRESS as string )  + "/graphql",
});
const queryClient = new GraphQLClient(
  (process.env.QUERY_CLIENT_PROTO as string) + "://" + (process.env.INDEXER_ADDRESS as string ) + "/graphql", 
  {
    headers: {
      'Content-Type': 'application/json',
    },
    fetch
  }
);

export {queryClient, subClient};