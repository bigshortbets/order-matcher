import { ApiPromise, HttpProvider, WsProvider} from '@polkadot/api';
let provider : HttpProvider;
let api : any;

export const createPosition = async (marketId: string, sellerId: string, buyerId : string) => {
    console.log(`Attempting to create position for: market id: ${marketId}, seller id: ${sellerId}, buyer id: ${buyerId}`);
    console.log(buyerId, sellerId, marketId);   
    const position = await api.tx.market.createPosition(marketId, sellerId, buyerId);
    try {
        await position.send();
        console.log(`Position created, market id: ${marketId}, seller id: ${sellerId}, buyer id: ${buyerId}`);
    }
    catch (error) { console.error("Position creation, error caught: ", error) }
}

export const initializePolkadotApi = async () => { 
    let provider : any;
    const providerAddress = process.env.NODE_PROVIDER_PROTO as string + "://" + process.env.NODE_PROVIDER_ADDRESS as string;
    switch(process.env.NODE_PROVIDER_PROTO) {
        case "http":
            provider = new HttpProvider(providerAddress)
            break;
        case "ws":
            provider = new WsProvider(providerAddress)
            break;
        default:
            console.error("Invalid node provider protocol")
    } 
    api = await ApiPromise.create({provider: provider})
    console.log("Polkadot Api created")
}
