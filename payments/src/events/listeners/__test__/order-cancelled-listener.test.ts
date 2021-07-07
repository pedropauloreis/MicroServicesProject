import { OrderCancelledEvent, OrderStatus } from "@ppreistickets/common";
import { OrderCancelledListener } from "../order-cancelled-listener";
import { natsWrapper } from "../../../nats-wrapper";
import  mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { Order } from "../../../models/order";

const setup = async () => {
    
    //create an instance of the listener
    const listener = new OrderCancelledListener(natsWrapper.client);

    //create and save a ticket
    const order = Order.build({
        id: mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        userId: mongoose.Types.ObjectId().toHexString(),
        price: 20,
        version: 0
    });

    await order.save();
    
    //create fake data event
    const data: OrderCancelledEvent['data'] = {
        id: order.id, 
        ticket: {
            id: mongoose.Types.ObjectId().toHexString()
        },
        version: 1
    };

    //create a fake message object
    //@ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return {listener, data, msg};

};

it('updated the status of the order',async () => {
    const {listener, data, msg} = await setup();

    //call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    const oderUpdated = await Order.findById(data.id);

    expect(oderUpdated!.status).toEqual(OrderStatus.Cancelled);

});


it('acks the message', async () => {
    const {listener, data, msg} = await setup();

    //call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    //write assertions to make sure ack function is called!
    expect(msg.ack).toHaveBeenCalled();
});

