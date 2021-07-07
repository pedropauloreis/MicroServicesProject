import request from 'supertest';
import {app} from '../../app';
import mongoose from 'mongoose';

it('Return a 404 if the ticket is not found', async () => {
    

    const id = mongoose.Types.ObjectId().toHexString();
    
    const response = await request(app)
        .get(`/api/tickets/${id}`)
        .send()
        .expect(404);

});


it('Return the ticket if the ticket is found', async () => {

    const title = 'TicketTeste';
    const price = 20;

    const response = await request(app)    
        .post('/api/tickets')
        .set('Cookie',global.signin())
        .send({
            title,
            price
        })
        .expect(201);

    const ticketResponse =  await request(app)
        .get(`/api/tickets/${response.body.id}`)
        .send()
        .expect(200);

        expect(ticketResponse.body.price).toEqual(price);
        expect(ticketResponse.body.title).toEqual(title);
 
});