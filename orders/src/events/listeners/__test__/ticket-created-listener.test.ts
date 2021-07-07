import { TicketCreatedEvent } from "@ppreistickets/common";
import { TicketCreatedListener } from "../ticket-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import  mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../../models/ticket";

const setup = async () => {
    //create an instance of the listener
    const listener = new TicketCreatedListener(natsWrapper.client);

    //create fake data event
    const data: TicketCreatedEvent['data'] = {
        id: mongoose.Types.ObjectId().toHexString(), 
        title: 'concert',
        price: 20,
        userId: mongoose.Types.ObjectId().toHexString(),
        version: 0
    }

    //create a fake message object
    //@ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return {listener, data, msg};

};

it('creates and saves a ticket', async () => {
    const {listener, data, msg} = await setup();


    //call the onMessage function with data object + message object
    await listener.onMessage(data, msg);


    //write assertions to make sure a ticket was created!
    const ticket = await Ticket.findById(data.id);

    expect(ticket).toBeDefined();
    expect(ticket!.title).toEqual(data.title);
    expect(ticket!.price).toEqual(data.price);
    expect(ticket!.version).toEqual(0);

});

it('acks the message', async () => {
    const {listener, data, msg} = await setup();

    //call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    //write assertions to make sure ack function is called!
    expect(msg.ack).toHaveBeenCalled();


})
