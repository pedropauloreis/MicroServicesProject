import { Message } from "node-nats-streaming";
import { Listener, Subjects,  TicketCreatedEvent} from "@ppreistickets/common"
import { Ticket } from "../../models/ticket";
import { queueGroupName } from "./queue-group-name";

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
    
    //subject: Subjects.TicketCreated = Subjects.TicketCreated;
    readonly subject = Subjects.TicketCreated;
    
    queueGroupName = queueGroupName;

    async onMessage(data: TicketCreatedEvent['data'], msg: Message) {
        
        const {id, title, price, version} = data;
        const ticket = Ticket.build({
            id,
            title,
            price,
            version
        });
        await ticket.save();
        msg.ack();
       
        
    }
}
