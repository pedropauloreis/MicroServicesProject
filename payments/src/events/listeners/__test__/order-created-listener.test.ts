import { OrderCreatedEvent, OrderStatus } from "@ppreistickets/common";
import { OrderCreatedListener } from "../order-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import  mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { Order } from "../../../models/order";

const setup = async () => {
    //create an instance of the listener
    const listener = new OrderCreatedListener(natsWrapper.client);

    //create fake data event
    const data: OrderCreatedEvent['data'] = {
        id: mongoose.Types.ObjectId().toHexString(), 
        status: OrderStatus.Created,
        userId: mongoose.Types.ObjectId().toHexString(), 
        expiresAt: new Date().toUTCString(),
        ticket: {
            id: mongoose.Types.ObjectId().toHexString(), 
            price: 20
        },
        version: 0
    };

    //create a fake message object
    //@ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return {listener, data, msg};

};

it('replicates the order info', async () => {
    const {listener, data, msg} = await setup();

    await listener.onMessage(data, msg);


    //write assertions to make sure a ticket was created!
    const order = await Order.findById(data.id);

    expect(order).toBeDefined();
    expect(order!.status).toEqual(data.status);
    expect(order!.userId).toEqual(data.userId);
    expect(order!.price).toEqual(data.ticket.price);
    expect(order!.version).toEqual(0);

});

it('acks the message', async () => {
    const {listener, data, msg} = await setup();

    //call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    //write assertions to make sure ack function is called!
    expect(msg.ack).toHaveBeenCalled();

});
