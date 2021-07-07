import { ExpirationCompleteEvent, OrderStatus } from "@ppreistickets/common";
import { ExpirationCompleteListener } from "../expiration-complete-listener";
import { natsWrapper } from "../../../nats-wrapper";
import  mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../../models/ticket";
import { Order } from "../../../models/order";

const setup = async () => {
    //create an instance of the listener
    const listener = new ExpirationCompleteListener(natsWrapper.client);

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
    const data: ExpirationCompleteEvent['data'] = {
        orderId: order.id,
    }

    //create a fake message object
    //@ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return {listener, data, msg, order, ticket};

};

it('updates the order status to cancelled', async () => {
    const {listener, data, msg, order} = await setup();

    await listener.onMessage(data,msg);

    const orderUpdated = await Order.findById(order.id);
    expect(orderUpdated!.status).toEqual(OrderStatus.Cancelled);


});

it('emit an OrderCancelled event', async () => {
    const {listener, data, msg, order} = await setup();

    await listener.onMessage(data,msg);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
    
    const orderUpdatedData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);
    
    expect(orderUpdatedData.id).toEqual(order.id);

});

it('releases the Ticket of the Order', async () => {
    const {listener, data, msg, ticket} = await setup();

    await listener.onMessage(data,msg);

    const isReserved = await ticket.isReserved();
    console.log('reserva do ticket: ',isReserved);
    expect(isReserved).toEqual(false);

});

it('acks the message', async () => {
    const {listener, data, msg } = await setup();

    await listener.onMessage(data,msg);

    expect(msg.ack).toHaveBeenCalled();
});
