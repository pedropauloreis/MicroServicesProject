import { Publisher, Subjects, OrderCreatedEvent, OrderCancelledEvent } from  '@ppreistickets/common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
    
    //subject: Subjects.TicketCreated = Subjects.TicketCreated;
    readonly subject = Subjects.OrderCancelled;
    
}

