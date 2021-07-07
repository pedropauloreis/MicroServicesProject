import { Message } from "node-nats-streaming";
import { Listener, Subjects,  PaymentCreatedEvent, OrderStatus} from "@ppreistickets/common"
import { Order } from "../../models/order";
import { queueGroupName } from "./queue-group-name";

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
    
    //subject: Subjects.TicketCreated = Subjects.TicketCreated;
    readonly subject = Subjects.PaymentCreated;
    
    queueGroupName = queueGroupName;

    async onMessage(data: PaymentCreatedEvent['data'], msg: Message) {
        
        const {id, orderId } = data;
        const order = await Order.findById(orderId);
        if(!order)
        {
            throw new Error('Order not Found!');
            
        }

        order.set({status: OrderStatus.Complete})

        await order.save();
        msg.ack();
       
        
    }
}
