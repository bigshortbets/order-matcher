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
        if (Array.isArray(value) && !markets.includes(key)) {
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
const getOrderBookOverlap = async (marketId: string) => {
    const cheapestShortOrder = await queryClient.request(
            `query orders {
                orders(
                    where: {
                        market: { id_eq: "${marketId}" },
                        side_eq: SHORT,
                        status_eq: ACTIVE 
                    },
                    orderBy: price_ASC,
                    limit: 1
                ) {
                    price
                }
            }`
        )
        
        console.log("Cheapest short order: ", cheapestShortOrder);
        const mostExpensiveLongOrder = await queryClient.request( 
            `query orders {
                orders(
                    where: {
                        market: { id_eq: "${marketId}" },
                        side_eq: LONG,
                        status_eq: ACTIVE
                    },
                    orderBy: price_DESC,
                    limit: 1
                ) {
                    price
                }
            }`
        )
        
        console.log("Most expensive long order:  ", mostExpensiveLongOrder);
        if(mostExpensiveLongOrder !== undefined && cheapestShortOrder !== undefined) {	
            return await queryClient.request(`
                query orders {
                    orders(
                        where: {
                            market: { id_eq: "${marketId}" },
                            status_eq: ACTIVE,
                            OR: [
                                { side_eq: SHORT, price_lte: ${mostExpensiveLongOrder} }, 
                                { side_eq: LONG, price_gte: ${cheapestShortOrder} }
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
        } else { return undefined; }
}

const manageOrdersChange = async (data: any, marketId: string) => {
    console.log("Order change detected");
    console.log("------------------------------------------------ITERATION STARTED------------------------------------------------")
    const overlappingOrders = await getOrderBookOverlap(marketId); 
    if(overlappingOrders) {
        await manageOrders((overlappingOrders as any).orders, marketId);
    }
    console.log("-----------------------------------------------ITERATION ENDED---------------------------------------------------")
}

const manageOrders = async (values: { id: string, price: bigint, who: string, side: string }[], marketId: string) => {

    const orders = values.map(value => { 
        return new Order(value.id, value.price, value.who, value.side) 
    });

    const sortedLongOrderCollection = getOrdersPerSideSortedByPrice(orders, 'LONG');
    const sortedShortOrderCollection = getOrdersPerSideSortedByPrice(orders, 'SHORT');

    while(sortedLongOrderCollection.size > 0 && sortedShortOrderCollection.size > 0) {
        const nextLong = sortedLongOrderCollection.values().next().value;
        let nextShort: Order | undefined; 
        for(const shortOrder of sortedShortOrderCollection) {
            if(shortOrder.who !== nextLong.who && shortOrder.price <= nextLong.price) {
                nextShort = shortOrder;
                break;
            }
        }
        if(nextShort !== undefined) {
            console.log(nextLong);
            console.log(nextShort);
            try {
                await createPosition(marketId, nextShort.id, nextLong.id);
            } catch (error) {
                console.error(error);
                process.exit(0);
            }
            sortedShortOrderCollection.delete(nextShort);
        }
        // Long will be deleted anyway: if there is no short, it will be deleted because there is no match, if there is it would be consumed
        sortedLongOrderCollection.delete(nextLong);
    }
}

const getOrdersPerSideSortedByPrice = (orders: Order[], side: string) : Set<Order> => {
    return new Set(orders
        .filter(order => order.side === side)
        .sort((a : Order, b : Order) => { 
            return a.price.toString().localeCompare(b.price.toString());
        }));
}
