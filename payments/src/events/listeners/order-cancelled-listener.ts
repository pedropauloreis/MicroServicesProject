import { Message } from "node-nats-streaming";
import { Listener, Subjects,  OrderCancelledEvent, OrderStatus} from "@ppreistickets/common"
import { queueGroupName } from "./queue-group-name";
import { Order } from "../../models/order";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
    
    //subject: Subjects.TicketCreated = Subjects.TicketCreated;
    readonly subject = Subjects.OrderCancelled;
    
    queueGroupName = queueGroupName;

    async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
        
        const {id, version} = data;
        const order = await Order.findByEvent({id,version});
        if(!order){
            throw new Error("Order not found");
            
        }
        order.set({status: OrderStatus.Cancelled});
        await order.save();
        msg.ack();
       
        
    }
}
