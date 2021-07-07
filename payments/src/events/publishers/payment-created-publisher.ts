import { Publisher, Subjects, PaymentCreatedEvent } from  '@ppreistickets/common';

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
    
    //subject: Subjects.TicketCreated = Subjects.TicketCreated;
    readonly subject = Subjects.PaymentCreated;
    
}
