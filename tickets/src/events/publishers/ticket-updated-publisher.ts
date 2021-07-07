import { Publisher, Subjects, TicketUpdatedEvent } from  '@ppreistickets/common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
    
    //subject: Subjects.TicketCreated = Subjects.TicketCreated;
    readonly subject = Subjects.TicketUpdated;
    
}

