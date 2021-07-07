import { Message } from "node-nats-streaming";
import { Listener, Subjects,  OrderCreatedEvent } from "@ppreistickets/common"
import { queueGroupName } from "./queue-group-name";
import { expirationQueue } from "../../queues/expiration-queue";
import Bull from "bull";
export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
    
    //subject: Subjects.TicketCreated = Subjects.TicketCreated;
    readonly subject = Subjects.OrderCreated;
    
    queueGroupName = queueGroupName;

    async onMessage(data: OrderCreatedEvent['data'], msg: Message) {

        const delay = new Date(data.expiresAt).getTime() - new Date().getTime();

        await expirationQueue.add({
            orderId: data.id
        }, {
            delay: delay
        });


        msg.ack();
       
        
    }
}
