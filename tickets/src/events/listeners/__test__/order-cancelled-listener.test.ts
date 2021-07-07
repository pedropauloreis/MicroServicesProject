import { OrderCancelledEvent, OrderStatus } from "@ppreistickets/common";
import { OrderCancelledListener } from "../order-cancelled-listener";
import { natsWrapper } from "../../../nats-wrapper";
import  mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../../models/ticket";

const setup = async () => {
    
    //create an instance of the listener
    const listener = new OrderCancelledListener(natsWrapper.client);

    //create and save a ticket
    const orderId = mongoose.Types.ObjectId().toHexString();
    
    const ticket = await Ticket.build({
        title: 'concert',
        price: 20,
        userId: mongoose.Types.ObjectId().toHexString(), 
    });
    ticket.set({orderId});
    await ticket.save();
    
    
    //create fake data event
    const data: OrderCancelledEvent['data'] = {
        id: orderId, 
        ticket: {
            id: ticket.id,
        },
        version: 0
    };

    //create a fake message object
    //@ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return {listener, data, msg, ticket, orderId};

};

it('sets the userId of the ticket to undefined', async () => {
    const {listener, data, msg, ticket, orderId} = await setup();

    //call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    const ticketUpdated = await Ticket.findById(ticket.id);

    //write assertions to make sure a ticket was reserved!
    expect(ticketUpdated!.orderId).not.toBeDefined();
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

    expect(ticketUpdatedData.orderId).not.toBeDefined();


})
