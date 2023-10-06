import { subscribeToMarkets } from "./nodeSubscriptionManager";
import { initializePolkadotApi } from "./positionCreator";

initializePolkadotApi().then(subscribeToMarkets);
