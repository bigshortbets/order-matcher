import { ApiPromise, HttpProvider, WsProvider} from '@polkadot/api';
let api : any;

export const createPosition = async (marketId: string, sellerId: string, buyerId : string) => {
    console.info(
      `${marketId} | Attempting to create position for: market id: ${marketId}, seller id: ${sellerId}, buyer id: ${buyerId}`
    );
    const position = await api.tx.market.createPosition(marketId, sellerId, buyerId);
    try {
        await position.send();
        console.info(
          `${marketId} | Position created, market id: ${marketId}, seller id: ${sellerId}, buyer id: ${buyerId}`
        );
    }
    catch (error: any) { 
        console.error(
          `${marketId} | Error caught during position creation, for market id: ${marketId}: seller id: ${sellerId}, buyer id: ${buyerId}.\nError text:\n`,
          error.message
        ); 
    }
}

export const initializePolkadotApi = async () => { 
    let provider : any;
    const providerAddress = process.env.NODE_PROVIDER_PROTO as string + "://" + process.env.NODE_PROVIDER_ADDRESS as string;
    switch(process.env.NODE_PROVIDER_PROTO) {
        case "http":
        case "https":
            provider = new HttpProvider(providerAddress)
            break;
        case "ws":
        case "wss":
            provider = new WsProvider(providerAddress)
            break;
        default:
            console.error("Invalid node provider protocol")
    } 
    api = await ApiPromise.create({provider: provider})
    console.log("Polkadot Api initialized")
}
