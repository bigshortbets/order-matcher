export class Order {
    id: string;
    price: bigint;
    who: string
    side: string;

    constructor(id: string, price: bigint, who: string, side: string) {
        this.id = id;
        this.price = price;
        this.who = who;
        this.side = side
    }
}