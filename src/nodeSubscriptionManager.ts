import { Observable, gql } from '@apollo/client';
import client from './processorSubscriptionClient';
import { Order } from './types/Order';
import { createPosition } from './positionCreator';


const  MARKETS_SUBSCRIPTION= gql`
   subscription markets {
    markets {
        id
    }
}
`;
const ORDERS_SUBSCRIPTION = gql`
    subscription orders($marketId: String!) {
        orders(
            where: {
                market: { id: $marketId },
                status: OPEN,
                _or: [
                    {
                        side: SHORT,
                        price_gte: {
                            _avg: {
                                orders(
                                    where: {
                                        side: LONG,
                                        market: { id: $marketId },
                                        status: OPEN
                                    },
                                    orderBy: price_asc,
                                    first: 1
                                ) {
                                    price
                                }
                            }
                        }
                    },
                    {
                        side: LONG,
                        price_lte: {
                            _avg: {
                                orders(
                                    where: {
                                        side: SHORT,
                                        market: { id: $marketId },
                                        status: OPEN
                                    },
                                    orderBy: price_desc,
                                    first: 1
                                ) {
                                    price
                                }
                            }
                        }
                    }
                ]
            }
        ) {
            id
            side
            price
            status
        }
    }
`;

export const subscribeToMarkets = () => {
    const observable = client.subscribe({
        query: MARKETS_SUBSCRIPTION,
    });
    const subscription = observable.subscribe({
        next: (data: any) => {
            manageMarkets(data.marketsTickers.map((item : any ) => item.id));
        },
        error: (error : any) => {
            console.error('Market subscription error:', error);
        }
    });

    return () => {
        subscription.unsubscribe();
    };
}
const marketSubscriptionMap : Map<string, any> = new Map();
const manageMarkets = (markets : string[]) => {
    marketSubscriptionMap.forEach((value: any[], key: string) => {
        if (!markets.includes(key)) {
            value.forEach((unsubscribe: () => void) => {
                unsubscribe();
            });
            marketSubscriptionMap.delete(key);
        }
    });
    markets.forEach((marketId: string) => {
        if (!marketSubscriptionMap.has(marketId)) {
            marketSubscriptionMap.set(marketId, subscribeToOrders(marketId))
        }
    });
}

const subscribeToOrders = (marketId: string) => {
    const observable = client.subscribe({
        query: ORDERS_SUBSCRIPTION,
        variables: { marketId }
    });
    const subscription = observable.subscribe({
        next: (data: any) => {
            manageOrders(data.orders, marketId);
        },
        error: (error : any) => {
            console.error('Order subscription error:', error);
        }
    });

    return () => {
        subscription.unsubscribe();
    }
}

const manageOrders = (values: { id: string, price: bigint, amount: number, status: string, side: string }[], marketId: string) => {
    const orders = values.map(value => { 
        return new Order(value.id, value.price, value.amount, value.status, value.side) 
    });
    const sortedLongOrderIterator = orders
        .filter(order => order.side === 'LONG')
        .sort((a : Order, b : Order) => { 
            return BigInt(a.price).toString().localeCompare(BigInt(b.price).toString());
        })
        .values();

    const sortedShortOrdersIterator = orders
        .filter(order => order.side === 'SHORT')
        .sort((a: Order, b: Order) => { 
            return BigInt(a.price).toString().localeCompare(BigInt(b.price).toString());
        })
        .values();
    // iterate over both arrays until one of them is empty
    for(let longOrder = sortedLongOrderIterator.next(), shortOrder = sortedShortOrdersIterator.next(); 
        !longOrder.done && !shortOrder.done; 
        longOrder = sortedLongOrderIterator.next(), shortOrder = sortedShortOrdersIterator.next()) {
        createPosition(marketId, longOrder.value.id, shortOrder.value.id);
    }
}
