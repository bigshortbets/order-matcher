type Market = {
  id: string;
};
type BlockHeight = {
  height: number;
};

type Order = {
  market: Market;
};

export type OrderData = {
  orders: Order[];
  squidStatus: BlockHeight;
};
