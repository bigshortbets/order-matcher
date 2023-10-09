import * as dotenv from "dotenv";
import { subscribeToMarkets } from "./nodeSubscriptionManager";
import { initializePolkadotApi } from "./positionCreator";

dotenv.config();

initializePolkadotApi().then(subscribeToMarkets);
