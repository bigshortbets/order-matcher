import { Order } from "./types/Order";
import { createPosition } from "./positionCreator";
import { queryClient } from "./processorSubscriptionClient";
import { OrderData } from "./types/graphql";

export const subscribeToOrders = async () => {
  console.log(`Subscribing to orders`);
  let previousBlockHeight = 0;
    while (true) {
      const query: OrderData = await queryClient.request(
        `query markets {
          orders(where: {blockHeight_gt: "${previousBlockHeight}", status_eq: ACTIVE}) {
            market {
              id
            }
          }
          squidStatus {
            height
          }
        }`
      );
      const marketIds = new Set<string>();

      query.orders.forEach((order) => {
        marketIds.add(order.market.id);
      });

      for (const marketId of marketIds) {
        await manageOrdersChange(marketId);
      }

      previousBlockHeight = query.squidStatus.height;
      await sleep(1000);
    }
};

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
        
        console.log(`${marketId} | Cheapest short order: `, cheapestShortOrder);
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
        
        console.log(`${marketId} | Most expensive long order:  `, mostExpensiveLongOrder);
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

const manageOrdersChange = async (marketId: string) => {
    console.log(`${marketId} | Order change detected`);
    const overlappingOrders = await getOrderBookOverlap(marketId); 
    if(overlappingOrders) {
        await manageOrders((overlappingOrders as any).orders, marketId);
    }
}

const manageOrders = async (values: { id: string, price: bigint, who: string, side: string }[], marketId: string) => {

    const orders = values.map(value => { 
        return new Order(value.id, value.price, value.who, value.side) 
    });

    const sortedLongOrderCollection = getOrdersPerSideSortedByPrice(orders, 'LONG');
    const sortedShortOrderCollection = getOrdersPerSideSortedByPrice(orders, 'SHORT');
  
    for(const nextLong of sortedLongOrderCollection) {
        for(const shortOrder of sortedShortOrderCollection) {
            if (
              shortOrder.who !== nextLong.who &&
              Number(shortOrder.price) <= Number(nextLong.price)
            ) {
              console.log(nextLong);
              try {
                await createPosition(marketId, shortOrder.id, nextLong.id);
              } catch (error) {
                console.error(error);
                process.exit(0);
              }
            }
        }
    }
}

const getOrdersPerSideSortedByPrice = (orders: Order[], side: string) : Set<Order> => {
    return new Set(orders
        .filter(order => order.side === side)
        .sort((a : Order, b : Order) => { 
            return a.price.toString().localeCompare(b.price.toString());
        }));
}
