import { OrderCreatedEvent, OrderStatus } from "@ppreistickets/common";
import { OrderCreatedListener } from "../order-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import  mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../../models/ticket";

const setup = async () => {
    //create and save a ticket
    const ticket = await Ticket.build({
        title: 'concert',
        price: 20,
        userId: mongoose.Types.ObjectId().toHexString(), 
    });
    await ticket.save();
    //create an instance of the listener
    const listener = new OrderCreatedListener(natsWrapper.client);

    //create fake data event
    const data: OrderCreatedEvent['data'] = {
        id: mongoose.Types.ObjectId().toHexString(), 
        status: OrderStatus.Created,
        userId: mongoose.Types.ObjectId().toHexString(), 
        expiresAt: new Date().toUTCString(),
        ticket: {
            id: ticket.id,
            price: ticket.price
        },
        version: 0
    };

    //create a fake message object
    //@ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return {listener, data, msg, ticket};

};

it('sets the userId of the ticket', async () => {
    const {listener, data, msg, ticket} = await setup();

    //call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    const ticketUpdated = await Ticket.findById(data.ticket.id);

    //write assertions to make sure a ticket was reserved!
    expect(ticketUpdated!.orderId).toEqual(data.id);
});

it('acks the message', async () => {
    const {listener, data, msg} = await setup();

    //call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    //write assertions to make sure ack function is called!
    expect(msg.ack).toHaveBeenCalled();


});


it('publishes a ticket updated event', async () => {
    const {listener, data, msg} = await setup();

    //call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    //write assertions to make sure a publish method pis called!
    expect(natsWrapper.client.publish).toHaveBeenCalled();
    
    
    const ticketUpdatedData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);

    expect(ticketUpdatedData.orderId).toEqual(data.id);


})
