export class Order {
    id: string;
    price: bigint;
    amount: number;
    status: string;
    side: string;

    constructor(id: string, price: bigint, amount: number, status: string, side: string) {
        this.id = id;
        this.price = price;
        this.amount = amount;
        this.status = status;
        this.side = side
    }
}