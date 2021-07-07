import { TicketUpdatedEvent } from "@ppreistickets/common";
import { TicketUpdatedListener } from "../ticket-updated-listener";
import { natsWrapper } from "../../../nats-wrapper";
import  mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../../models/ticket";

const setup = async () => {
    //create an instance of the listener
    const listener = new TicketUpdatedListener(natsWrapper.client);

    //create and save a ticket
    const ticket = Ticket.build({
        id: mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20,
        version: 0
    });

    await ticket.save();


    //create fake data event
    const data: TicketUpdatedEvent['data'] = {
        id: ticket.id,
        title: 'new_concert',
        price: 999,
        userId: mongoose.Types.ObjectId().toHexString(),
        version: ticket.version + 1
    }

    //create a fake message object
    //@ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return {listener, data, msg, ticket};

};

it('finds and updates and saves a ticket', async () => {
    const {listener, data, msg, ticket} = await setup();


    //call the onMessage function with data object + message object
    await listener.onMessage(data, msg);


    //write assertions to make sure a ticket was created!
    const ticketUpdated = await Ticket.findById(ticket.id);

    expect(ticketUpdated).toBeDefined();
    expect(ticketUpdated!.title).toEqual(data.title);
    expect(ticketUpdated!.price).toEqual(data.price);
    expect(ticketUpdated!.version).toEqual(data.version);

});

it('acks the message', async () => {
    const {listener, data, msg} = await setup();


    //call the onMessage function with data object + message object
    await listener.onMessage(data, msg);


    //write assertions to make sure ack function is called!
    expect(msg.ack).toHaveBeenCalled();

});

it('does not call ack if the event has a skipped version number', async () => {
    const {listener, msg, data} = await setup();
    
    //skipping version number
    data.version = 10;
    
    
    try{
        await listener.onMessage(data,msg);
    }
    catch(err)
    {

    }

    expect(msg.ack).not.toHaveBeenCalled();
});
