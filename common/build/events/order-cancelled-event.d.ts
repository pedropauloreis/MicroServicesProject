import { Subjects } from "./base/subjects";
export interface OrderCancelledEvent {
    subject: Subjects.OrderCancelled;
    data: {
        id: string;
        ticket: {
            id: string;
        };
        version: number;
    };
}
