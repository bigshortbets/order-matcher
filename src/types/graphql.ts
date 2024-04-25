type Market = {
  id: string;
  blockHeight: string;
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
  blockHeight: string;
};

export type OrderData = {
  orders: Order[];
  squidStatus: BlockHeight;
};
