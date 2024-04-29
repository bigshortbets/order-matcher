import * as dotenv from "dotenv";
import { subscribeToOrders } from "./nodeSubscriptionManager";
import { initializePolkadotApi } from "./positionCreator";

dotenv.config();

initializePolkadotApi().then(subscribeToOrders);
