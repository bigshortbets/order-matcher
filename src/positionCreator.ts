import { ApiPromise, HttpProvider, Keyring } from '@polkadot/api';
let provider : HttpProvider;
let api : any;
export const createPosition = async (marketId: string, buyerId : string, sellerId: string) => {
    const position = await api.tx.market.createPosition(marketId, buyerId, sellerId);
    try {
        await position.send();
        console.log(`Position created, market id: ${marketId}, buyer id: ${buyerId}, seller id: ${sellerId}`);
    }
    catch (error) { console.error("Position creation, error caught: ", error) }
}

export const initializePolkadotApi = async () => { 
    provider = new HttpProvider("http://localhost:8888")
    api = await ApiPromise.create().then(res => console.log("Polkadot API initialized")); // TODO: przekazać indexer
 }