import request from 'supertest';
import {app} from '../../app';
import mongoose from 'mongoose';
import {natsWrapper} from '../../nats-wrapper';
import { Ticket } from '../../models/ticket';

jest.mock('../../nats-wrapper');

const createTicket = () => {
    const title = 'TicketTeste';
    const price = 20;

    return request(app)    
    .post('/api/tickets')
    .set('Cookie',global.signin())
    .send({
        title,
        price
    })
    .expect(201);
}

it('return a 404 if the provided id does not exist', async () => {
    const id = mongoose.Types.ObjectId().toHexString();
    const title = "Titulo";
    const price = 20;

    await request(app)
        .put(`/api/tickets/${id}`)
        .set('Cookie',global.signin())
        .send({title,price})
        .expect(404);
});

it('return a 401 if the user is not authenticated', async () => {
    const id = mongoose.Types.ObjectId().toHexString();
    const title = "Titulo";
    const price = 20;

    await request(app)
        .put(`/api/tickets/${id}`)
        .send({title,price})
        .expect(401);
});


it('return a 401 if the user does not own the ticket', async () => {
    let title = "Title";
    let price = 20;

    let responseTicket = await request(app)
        .post(`/api/tickets/`)
        .set('Cookie',global.signin())
        .send({title,price})
        .expect(201);

    title = "Title 2";
    price = 40;

    await request(app)
        .put(`/api/tickets/${responseTicket.body.id}`)
        .set('Cookie',global.signin())
        .send({title,price})
        .expect(401);

    responseTicket = await request(app)
        .get(`/api/tickets/${responseTicket.body.id}`)
        .send()
        .expect(200);

    expect(responseTicket.body.title).not.toEqual(title);
    expect(responseTicket.body.price).not.toEqual(price);
 
});


it('return a 400 if the user provides as invalid title ', async () => {
    
    
    let title = "Title";
    let price = 20;

    const Cookie = global.signin();

    let responseTicket = await request(app)
        .post(`/api/tickets/`)
        .set('Cookie',Cookie)
        .send({title,price})
        .expect(201);

    title = "";
    price = 40;
    
    await request(app)
        .put(`/api/tickets/${responseTicket.body.id}`)
        .set('Cookie',Cookie)
        .send({title,price})
        .expect(400);

        await request(app)
        .put(`/api/tickets/${responseTicket.body.id}`)
        .set('Cookie',Cookie)
        .send({price})
        .expect(400);
 
});


it('return a 400 if the user provides as invalid price', async () => {
    let title = "Title";
    let price = 20;

    const Cookie = global.signin();

    let responseTicket = await request(app)
        .post(`/api/tickets/`)
        .set('Cookie',Cookie)
        .send({title,price})
        .expect(201);

    title = "Title 2";
    price = -10;
    
    await request(app)
        .put(`/api/tickets/${responseTicket.body.id}`)
        .set('Cookie',Cookie)
        .send({title,price})
        .expect(400);

    await request(app)
        .put(`/api/tickets/${responseTicket.body.id}`)
        .set('Cookie',Cookie)
        .send({title})
        .expect(400);        
 
});

it('updates the ticket if provides a valid ticket', async () => {
    let title = "Title";
    let price = 20;

    const Cookie = global.signin();

    let responseTicket = await request(app)
        .post(`/api/tickets/`)
        .set('Cookie',Cookie)
        .send({title,price})
        .expect(201);

    title = "Title 2";
    price = 40;

    await request(app)
        .put(`/api/tickets/${responseTicket.body.id}`)
        .set('Cookie',Cookie)
        .send({title,price})
        .expect(200);

    responseTicket = await request(app)
        .get(`/api/tickets/${responseTicket.body.id}`)
        .send()
        .expect(200);
    
    expect(responseTicket.body.title).toEqual(title);
    expect(responseTicket.body.price).toEqual(price);
   
 
});

it('publishes an event', async () => {
    let title = "Title";
    let price = 20;

    const Cookie = global.signin();

    let responseTicket = await request(app)
        .post(`/api/tickets/`)
        .set('Cookie',Cookie)
        .send({title,price})
        .expect(201);

    title = "Title 2";
    price = 40;

    await request(app)
        .put(`/api/tickets/${responseTicket.body.id}`)
        .set('Cookie',Cookie)
        .send({title,price})
        .expect(200);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
   
 
});

it('rejects updates if the ticket is reserved', async () => {

    let title = "Title";
    let price = 20;

    const Cookie = global.signin();

    let responseTicket = await request(app)
        .post(`/api/tickets/`)
        .set('Cookie',Cookie)
        .send({title,price})
        .expect(201);

    const ticket = await Ticket.findById(responseTicket.body.id);
    ticket!.set({orderId: mongoose.Types.ObjectId().toHexString()});
    await ticket!.save();

    title = "Title 2";
    price = 40;

    await request(app)
        .put(`/api/tickets/${responseTicket.body.id}`)
        .set('Cookie',Cookie)
        .send({title,price})
        .expect(400);

})