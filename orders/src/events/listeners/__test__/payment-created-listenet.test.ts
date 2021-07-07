import { PaymentCreatedEvent, OrderStatus } from "@ppreistickets/common";
import { PaymentCreatedListener } from "../payment-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import  mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../../models/ticket";
import { Order } from "../../../models/order";

const setup = async () => {
    //create an instance of the listener
    const listener = new PaymentCreatedListener(natsWrapper.client);

    const ticket = Ticket.build({
        id: mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20,
        version: 0
    });
    await ticket.save();

    const order = Order.build({
        status: OrderStatus.Created,
        ticket: ticket,
        expiresAt: new Date(),
        userId:  mongoose.Types.ObjectId().toHexString(),
    });
    await order.save();


    //create fake data event
    const data: PaymentCreatedEvent['data'] = {
        id: mongoose.Types.ObjectId().toHexString(),
        orderId: order.id,
        stripeId: mongoose.Types.ObjectId().toHexString()
    }

    //create a fake message object
    //@ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return {listener, data, msg, order};

};

it('updates the order status to complete', async () => {
    const {listener, data, msg, order} = await setup();

    await listener.onMessage(data,msg);

    const orderUpdated = await Order.findById(order.id);
    expect(orderUpdated!.status).toEqual(OrderStatus.Complete);


});


it('acks the message', async () => {
    const {listener, data, msg } = await setup();

    await listener.onMessage(data,msg);

    expect(msg.ack).toHaveBeenCalled();
});
