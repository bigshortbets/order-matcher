import { GraphQLClient } from 'graphql-request';
import fetch from 'cross-fetch';
const WebSocket = require('ws')
const { createClient } = require('graphql-ws');

const subClient = createClient({
  webSocketImpl: WebSocket,
  url: (process.env.WS_PROVIDER_URL as string) + "/graphql",
});
const queryClient = new GraphQLClient((process.env.HTTP_PROVIDER_URL as string) + "/graphql", {
  headers: {
    'Content-Type': 'application/json',
  },
  fetch
});

export {queryClient, subClient};