import { Order } from './types/Order';
import { createPosition } from './positionCreator';
import {subClient, queryClient} from './processorSubscriptionClient';

export const subscribeToMarkets = () => {
    console.log("Subscribing to markets");
    const subscription = subClient.subscribe({
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
    const subscription = subClient.subscribe({
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
    const biggestShortOrder = await queryClient.request(
        `query orders {
            orders(
                where: {
                    market: { id_eq: "${marketId}" },
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
    console.log("Biggest short order: ", biggestShortOrder);
    const smallestLongOrder = await queryClient.request( 
        `query orders {
            orders(
                where: {
                    market: { id_eq: "${marketId}" },
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
    
    console.log("Smallest long order: ", smallestLongOrder);
    var orderBookOverlappingOrders : any;
    // TODO: this query - troubleshoot
    if(smallestLongOrder !== undefined && biggestShortOrder !== undefined) {	
        orderBookOverlappingOrders = await queryClient.request(`
            query orders {
                orders(
                    where: {
                        market: { id_eq: "${marketId}" },
                        status_eq: ACTIVE,
                        OR: [
                            AND: [
                                { side_eq: SHORT, price_gte: ${smallestLongOrder} }, 
                                { side_eq: SHORT, price_lte: ${biggestShortOrder} },
                            ],
                            AND: [
                                { side_eq: LONG, price_gte: ${smallestLongOrder} },
                                { side_eq: LONG, price_lte: ${biggestShortOrder} }
                            ]
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
        manageOrders((orderBookOverlappingOrders as any).orders, marketId);
    }
}

const manageOrders = async (values: { id: string, price: bigint, who: string, side: string }[], marketId: string) => {
    console.log("____________________________________________________________________________________________________")
    const orders = values.map(value => { 
        return new Order(value.id, value.price, value.who, value.side) 
    });
    const sortedLongOrderCollection : Set<Order> = new Set(orders
        .filter(order => order.side === 'LONG')
        .sort((a : Order, b : Order) => { 
            return BigInt(a.price).toString().localeCompare(BigInt(b.price).toString());
        }));
    console.log(sortedLongOrderCollection);
    const sortedShortOrderCollection : Set<Order> = new Set(orders
        .filter(order => order.side === 'SHORT')
        .sort((a: Order, b: Order) => { 
            return BigInt(a.price).toString().localeCompare(BigInt(b.price).toString());
        }));
    console.log(sortedShortOrderCollection);
    while(!(sortedLongOrderCollection.size === 0 || sortedShortOrderCollection.size === 0)) {
        const nextLong = sortedLongOrderCollection.values().next().value;
        console.log(nextLong);
        let nextShort: Order | undefined; 
        for(const shortOrder of sortedShortOrderCollection) {
            if(shortOrder.who !== nextLong.who && shortOrder.price <= nextLong.price) {
                nextShort = shortOrder;
                console.log(nextShort);
                break;
            }
        }
        if(nextShort !== undefined) {
            await createPosition(marketId, nextShort.id, nextLong.id);
            sortedShortOrderCollection.delete(nextShort);
        }
        sortedLongOrderCollection.delete(nextLong); // Long will be deleted anyway: if there is no short, it will be deleted because there is no match, if there is it would be consumed
    }
}
