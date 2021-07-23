import { Stan } from 'node-nats-streaming';
import { Subjects } from "./base/subjects";
interface Event {
    subject: Subjects;
    data: any;
}
export declare abstract class Publisher<T extends Event> {
    abstract subject: T['subject'];
    private client;
    constructor(client: Stan);
    publish(data: T['data']): Promise<void>;
}
export {};
