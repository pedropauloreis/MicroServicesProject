import { Publisher, Subjects, OrderCreatedEvent } from  '@ppreistickets/common';

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
    
    //subject: Subjects.TicketCreated = Subjects.TicketCreated;
    readonly subject = Subjects.OrderCreated;
    
}
