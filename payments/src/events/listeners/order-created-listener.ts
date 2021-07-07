import { Message } from "node-nats-streaming";
import { Listener, Subjects,  OrderCreatedEvent, NotFoundError} from "@ppreistickets/common"
import { queueGroupName } from "./queue-group-name";
import { Order } from "../../models/order";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
    
    //subject: Subjects.TicketCreated = Subjects.TicketCreated;
    readonly subject = Subjects.OrderCreated;
    
    queueGroupName = queueGroupName;

    async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
        
        const {id, status, userId, version} = data;
        const {price} = data.ticket;
        const order = Order.build({
            id,
            status,
            userId,
            price,
            version
        });
        await order.save();
        msg.ack();
        
    }
}

