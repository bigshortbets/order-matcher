import { subscribeToMarkets } from "./nodeSubscriptionManager";
import { initializePolkadotApi } from "./positionCreator";
initializePolkadotApi();
// invoke market subscription from processorSubscriptionManager.ts
subscribeToMarkets();


// TODO: push this
// TODO: create .env file
// TODO: check if this works
