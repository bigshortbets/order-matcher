import { subscribeToMarkets } from "./nodeSubscriptionManager";
import { initializePolkadotApi } from "./positionCreator";
initializePolkadotApi();
// invoke market subscription from processorSubscriptionManager.ts
subscribeToMarkets();


// TODO: create .env file
