import request from 'supertest';
import mongoose from 'mongoose';

import {app} from '../../app';
import {Ticket, TicketDoc} from '../../models/ticket';

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

it('has a route handler listening to /api/orders for get requests', async () => {
    const response = await request(app)
        .get('/api/orders')
        .send({});
    
    expect(response.status).not.toEqual(404);
 
});


it('can only be accessed if the user is signed in', async () => {
    const response = await request(app)    
        .get('/api/orders')
        .send({});
    
    expect(response.status).toEqual(401);
 
});

it('return a status other than 401 if the user is signed in', async () => {
    const cookie = global.signin();
    const response = await request(app)    
        .get('/api/orders')
        .set('Cookie',cookie)
        .send({});
    
    expect(response.status).not.toEqual(401);
});


it('fetches orders from a particular user', async () => {
    //Create three tickets
    const ticketOne = await buildTicket();
    const ticketTwo = await buildTicket();
    const ticketThree = await  buildTicket();

    //Create one order as User #1 
    const userOne= global.signin();
    await request(app)
    .post('/api/orders')
    .set('Cookie',userOne)
    .send({
        ticketId: ticketOne.id
    })
    .expect(201);

    //Create two orders as User #2
    const userTwo= global.signin();
    const { body: orderOne } = await request(app)
    .post('/api/orders')
    .set('Cookie',userTwo)
    .send({
        ticketId: ticketTwo.id
    })
    .expect(201);

    const { body: orderTwo }  = await request(app)
    .post('/api/orders')
    .set('Cookie',userTwo)
    .send({
        ticketId: ticketThree.id
    })
    .expect(201);

    //Make request to get orders for User #2
    const response = await request(app)
    .get('/api/orders')
    .set('Cookie',userTwo)
    .expect(200);

    //Make sure we only get the orders for User 2
    expect(response.body.length).toEqual(2);
    expect(response.body[0].id).toEqual(orderOne.id);
    expect(response.body[0].ticket.id).toEqual(ticketTwo.id);
    
    expect(response.body[1].id).toEqual(orderTwo.id);
    expect(response.body[1].ticket.id).toEqual(ticketThree.id);

});


