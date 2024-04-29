type Market = {
  id: string;
};
type BlockHeight = {
  height: number;
};
export type MarketData = {
  markets: Market[];
  squidStatus: BlockHeight;
};

type Order = {
  id: string;
  market: Market;
};

export type OrderData = {
  orders: Order[];
  squidStatus: BlockHeight;
};
