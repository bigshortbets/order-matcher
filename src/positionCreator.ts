import { Order } from "./types/Order";
import { ApiPromise, HttpProvider, Keyring } from '@polkadot/api';

const provider = new HttpProvider("http://localhost:8888")
const api = await ApiPromise.create();
const keyring = new Keyring({ type: 'sr25519' });
const alice = keyring.addFromUri('//Alice');
export const createPosition = async (marketId: string, buyerId : string, sellerId: string) => {
    const position = await api.tx.market.createPosition(marketId, buyerId, sellerId);
    try {
        await position.signAndSend(alice, {nonce: -1});
        console.log(`Position created, market id: ${marketId}, buyer id: ${buyerId}, seller id: ${sellerId}`);
    }
    catch (error) { console.error("Position creation, error caught: ", error) }
}