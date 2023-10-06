import { Order } from './types/Order';
import { createPosition } from './positionCreator';
import client from './processorSubscriptionClient';

export const subscribeToMarkets = () => {
    console.log("Subscribing to markets");
    const subscription = client.subscribe({
        query: `
            subscription markets {
                markets {
                    id
                }
            }`
    },
    {
        next: (data: any) => {
            manageMarkets(data.data.markets.map((item : any ) => item.id));
        },
        error: (error : any) => {
            console.error('Market subscription error:', error);
        },
        complete: () => {
            console.log('Market subscription complete');
        },
    });

    return () => {
        console.log("Unsubscribing from markets");
        subscription.unsubscribe();
    };
}

const marketSubscriptionMap : Map<string, any> = new Map();
const manageMarkets = (markets : string[]) => {
    console.log(markets)
    markets.forEach((marketId: string) => {
        if (!marketSubscriptionMap.has(marketId)) {
            marketSubscriptionMap.set(marketId, subscribeToOrders(marketId))
        }
    });
    marketSubscriptionMap.forEach((value: any[], key: string) => {
        if (!markets.includes(key)) {
            value.forEach((unsubscribe: () => void) => {
                unsubscribe();
            });
            marketSubscriptionMap.delete(key);
        }
    });
}

const subscribeToOrders = (marketId: string) => {
    console.log(`Subscribing to orders for market ${marketId}`);
    const subscription = client.subscribe({
        query: 
            `subscription orders {
                orders(limit: 1, where: {market: {id_eq: "${marketId}"}}, orderBy: timestamp_DESC) {
                    id
                }
            }`
        },
        {
            next: async (data: any) => {
                await manageOrdersChange(data, marketId);
            },
            error: (error : any) => {
                console.error('Order subscription error:', error);
            }
        });

    return () => {
        subscription.unsubscribe();
    }
}
const manageOrdersChange = async (data: any, marketId: string) => {
    console.log("Order change detected");
    const biggestShortOrder = await client.request(
        `query orders {
            orders(
                where: {
                    market: { id_eq: ${marketId} },
                    side_eq: SHORT,
                    status_eq: ACTIVE 
                },
                orderBy: price_DESC,
                limit: 1
            ) {
                price
            }
        }`
    )
    console.log(biggestShortOrder);
    const smallestLongOrder = await client.request( 
        `query orders {
            orders(
                where: {
                    market: { id_eq: ${marketId} },
                    side_eq: LONG,
                    status_eq: ACTIVE
                },
                orderBy: price_ASC,
                limit: 1
            ) {
                price
            }
        }`
    )
    
    console.log(smallestLongOrder);
    const orderBookOverlappingOrders = await client.request(`
        query orders {
            orders(
                where: {
                    market: { id_eq: ${marketId} },
                    status_eq: ACTIVE,
                    OR: [
                        { side_eq: SHORT, price_gte: ${smallestLongOrder} },
                        { side_eq: LONG, price_lte: ${biggestShortOrder} }
                    ]
                }
            ) {
                id
                side
                price
                who
            }
        }
    `)
    console.log(orderBookOverlappingOrders);
    manageOrders((orderBookOverlappingOrders as any).data.orders, marketId);
}

const manageOrders = async (values: { id: string, price: bigint, amount: number, status: string, side: string }[], marketId: string) => {
    const orders = values.map(value => { 
        return new Order(value.id, value.price, value.amount, value.status, value.side) 
    });
    const sortedLongOrderCollection : Set<Order> = new Set(orders
        .filter(order => order.side === 'LONG')
        .sort((a : Order, b : Order) => { 
            return BigInt(a.price).toString().localeCompare(BigInt(b.price).toString());
        }));

    const sortedShortOrderCollection : Set<Order> = new Set(orders
        .filter(order => order.side === 'SHORT')
        .sort((a: Order, b: Order) => { 
            return BigInt(a.price).toString().localeCompare(BigInt(b.price).toString());
        }));
    while(!(sortedLongOrderCollection.size === 0 || sortedShortOrderCollection.size === 0)) {
        const nextLong = sortedLongOrderCollection.values().next().value;
        let nextShort: Order | undefined; 
        for(const shortOrder of sortedShortOrderCollection) {
            if(shortOrder.who !== nextLong.who && shortOrder.price <= nextLong.price) {
                nextShort = shortOrder;
                break;
            }
        }
        if(nextShort !== undefined) {
            await createPosition(nextLong.id, nextShort.id, marketId);
            sortedShortOrderCollection.delete(nextShort);
        }
        sortedLongOrderCollection.delete(nextLong);
    }
}
