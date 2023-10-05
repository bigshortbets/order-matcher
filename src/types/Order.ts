export class Order {
    id: string;
    price: bigint;
    amount: number;
    who: string
    side: string;

    constructor(id: string, price: bigint, amount: number, who: string, side: string) {
        this.id = id;
        this.price = price;
        this.amount = amount;
        this.who = who;
        this.side = side
    }
}