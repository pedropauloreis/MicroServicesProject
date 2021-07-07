import { Publisher, Subjects, ExpirationCompleteEvent } from  '@ppreistickets/common';

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
    
    //subject: Subjects.TicketCreated = Subjects.TicketCreated;
    readonly subject = Subjects.ExpirationComplete;
    
}
