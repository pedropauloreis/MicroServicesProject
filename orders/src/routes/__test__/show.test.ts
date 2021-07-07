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

it('has a route handler listening to /api/orders/:orderId for get requests', async () => {
    const orderId = mongoose.Types.ObjectId().toHexString();
    const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .send({});
    
    expect(response.status).not.toEqual(404);
 
});


it('can only be accessed if the user is signed in', async () => {
    const orderId = mongoose.Types.ObjectId().toHexString();
    const response = await request(app)    
        .get(`/api/orders/${orderId}`)
        .send({});
    
    expect(response.status).toEqual(401);
 
});

it('return a status other than 401 if the user is signed in', async () => {
    const orderId = mongoose.Types.ObjectId().toHexString();
    const cookie = global.signin();
    const response = await request(app)    
        .get(`/api/orders/${orderId}`)
        .set('Cookie',cookie)
        .send({});
    
    expect(response.status).not.toEqual(401);
});

it('return a status 404 if a signed user looks for an invalid Order', async () => {
    const orderId = 'abc';
    const cookie = global.signin();
    const response = await request(app)    
        .get(`/api/orders/${orderId}`)
        .set('Cookie',cookie)
        .send({});
    
    expect(response.status).toEqual(400);
});

it('return a status 404 if a signed user looks for a Order that does not exist', async () => {
    const orderId = mongoose.Types.ObjectId().toHexString();
    const cookie = global.signin();
    const response = await request(app)    
        .get(`/api/orders/${orderId}`)
        .set('Cookie',cookie)
        .send({});
    
    expect(response.status).toEqual(404);
});



it('doenst fetches the order created from diferent user', async () => {
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

    //Make request to get the created order but with User #2
    const userTwo= global.signin();
    await request(app)
    .get(`/api/orders/${orderOne.id}`)
    .set('Cookie',userTwo)
    .expect(401);
    
});


it('fetches the order created from same user', async () => {
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

    //Make request to get the order for same user
    const response = await request(app)
    .get(`/api/orders/${orderOne.id}`)
    .set('Cookie',userOne)
    .expect(200);

    //Make sure we only get the orders for User 2
    expect(response.body.id).toEqual(orderOne.id);
    expect(response.body.ticket.id).toEqual(ticketOne.id);
    
});


