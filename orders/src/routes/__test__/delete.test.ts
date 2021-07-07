import request from 'supertest';
import mongoose from 'mongoose';
import {app} from '../../app';
import {Ticket, TicketDoc} from '../../models/ticket';
import { OrderStatus } from '@ppreistickets/common';
import { Order } from '../../models/order';
import {natsWrapper} from '../../nats-wrapper';

const buildTicket = async () : Promise<TicketDoc> => {
    const ticket = Ticket.build({
        id: mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20,
        version: 0
    });

    await ticket.save();
    return ticket;

}

it('has a route handler listening to /api/orders/:orderId for delete requests', async () => {
    const orderId = mongoose.Types.ObjectId().toHexString();
    const response = await request(app)
        .delete(`/api/orders/${orderId}`)
        .send({});
    
    expect(response.status).not.toEqual(404);
 
});


it('can only be accessed if the user is signed in', async () => {
    const orderId = mongoose.Types.ObjectId().toHexString();
    const response = await request(app)    
        .delete(`/api/orders/${orderId}`)
        .send({});
    
    expect(response.status).toEqual(401);
 
});

it('return a status other than 401 if the user is signed in', async () => {
    const orderId = mongoose.Types.ObjectId().toHexString();
    const cookie = global.signin();
    const response = await request(app)    
        .delete(`/api/orders/${orderId}`)
        .set('Cookie',cookie)
        .send({});
    
    expect(response.status).not.toEqual(401);
});

it('return a status 404 if a signed user delete a invalid Order', async () => {
    const orderId = 'abc';
    const cookie = global.signin();
    const response = await request(app)    
        .delete(`/api/orders/${orderId}`)
        .set('Cookie',cookie)
        .send({});
    
    expect(response.status).toEqual(400);
});

it('return a status 404 if a signed user delete a Order that does not exist', async () => {
    const orderId = mongoose.Types.ObjectId().toHexString();
    const cookie = global.signin();
    const response = await request(app)    
        .delete(`/api/orders/${orderId}`)
        .set('Cookie',cookie)
        .send({});
    
    expect(response.status).toEqual(404);
});


it('doenst delete the order created from diferent user', async () => {
    //Create ticket
    const ticketOne = await buildTicket();

    //Create one order as User #1 
    const userOne= global.signin();
    const {body: orderOne} = await request(app)
    .post('/api/orders')
    .set('Cookie',userOne)
    .send({
        ticketId: ticketOne.id
    })
    .expect(201);

    //Make request to delete the created order but with User #2
    const userTwo= global.signin();
    await request(app)
    .delete(`/api/orders/${orderOne.id}`)
    .set('Cookie',userTwo)
    .expect(401);
    
});


it('delete the order created from same user', async () => {
    //Create ticket
    const ticketOne = await buildTicket();

    //Create one order as User #1 
    const userOne= global.signin();
    const {body: orderOne} = await request(app)
    .post('/api/orders')
    .set('Cookie',userOne)
    .send({
        ticketId: ticketOne.id
    })
    .expect(201);

    //Make request to delete the order for same user
    await request(app)
    .delete(`/api/orders/${orderOne.id}`)
    .set('Cookie',userOne)
    .expect(204);

    const updatedOrder = await Order.findById(orderOne.id);
    
    //Make sure the order was cancelled
    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
    
});

it('publishes an event', async () => {

    //Create ticket
    const ticketOne = await buildTicket();

    //Create one order as User #1 
    const userOne= global.signin();
    const {body: orderOne} = await request(app)
    .post('/api/orders')
    .set('Cookie',userOne)
    .send({
        ticketId: ticketOne.id
    })
    .expect(201);

    //Make request to delete the order for same user
    await request(app)
    .delete(`/api/orders/${orderOne.id}`)
    .set('Cookie',userOne)
    .expect(204);

    const updatedOrder = await Order.findById(orderOne.id);
    
    //Make sure the order was cancelled
    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
   
});



