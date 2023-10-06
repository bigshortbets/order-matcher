import { ApiPromise, HttpProvider} from '@polkadot/api';
let provider : HttpProvider;
let api : any;

export const createPosition = async (buyerId : string, sellerId: string, marketId: string) => {
    console.log("Creating position");
    console.log(buyerId, sellerId, marketId);   
    const position = await api.tx.market.createPosition(marketId, buyerId, sellerId);
    try {
        await position.send();
        console.log(`Position created, market id: ${marketId}, buyer id: ${buyerId}, seller id: ${sellerId}`);
    }
    catch (error) { console.error("Position creation, error caught: ", error) }
}

export const initializePolkadotApi = async () => { 
    provider = new HttpProvider(process.env.SUBSTRATE_NODE_URL as string)
    api = await  ApiPromise.create()
    console.log("Polkadot Api created")
}
