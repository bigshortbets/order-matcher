import { ApiPromise, HttpProvider} from '@polkadot/api';
let provider : HttpProvider;
let api : any;

export const createPosition = async (marketId: string, sellerId: string, buyerId : string) => {
    console.log("Attempting to create position for: market id: ${marketId}, seller id: ${sellerId}, buyer id: ${buyerId}");
    console.log(buyerId, sellerId, marketId);   
    const position = await api.tx.market.createPosition(marketId, sellerId, buyerId);
    try {
        await position.send();
        console.log(`Position created, market id: ${marketId}, seller id: ${sellerId}, buyer id: ${buyerId}`);
    }
    catch (error) { console.error("Position creation, error caught: ", error) }
}

export const initializePolkadotApi = async () => { 
    provider = new HttpProvider(process.env.SUBSTRATE_NODE_URL as string)
    api = await  ApiPromise.create()
    console.log("Polkadot Api created")
}
