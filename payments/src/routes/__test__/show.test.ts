import request from 'supertest';
import mongoose from 'mongoose';
import {app} from '../../app';
import {Order, OrderDoc, OrderStatus} from '../../models/order';


it('has a route handler listening to /api/payments/:paymentId for get requests', async () => {
    const paymentId = mongoose.Types.ObjectId().toHexString();
    const response = await request(app)
        .get(`/api/payments/${paymentId}`)
        .send({});
    
    expect(response.status).not.toEqual(404);
 
});


it('can only be accessed if the user is signed in', async () => {
    const paymentId = mongoose.Types.ObjectId().toHexString();
    const response = await request(app)    
        .get(`/api/payments/${paymentId}`)
        .send({});
    
    expect(response.status).toEqual(401);
 
});

it('return a status other than 401 if the user is signed in', async () => {
    const paymentId = mongoose.Types.ObjectId().toHexString();
    const cookie = global.signin();
    const response = await request(app)    
        .get(`/api/payments/${paymentId}`)
        .set('Cookie',cookie)
        .send({});
    
    expect(response.status).not.toEqual(401);
});

it('return a status 404 if a signed user looks for an invalid Order', async () => {
    const paymentId = 'abc';
    const cookie = global.signin();
    const response = await request(app)    
        .get(`/api/payments/${paymentId}`)
        .set('Cookie',cookie)
        .send({});
    
    expect(response.status).toEqual(400);
});

it('return a status 404 if a signed user looks for a Payment that does not exist', async () => {
    const paymentId = mongoose.Types.ObjectId().toHexString();
    const cookie = global.signin();
    const response = await request(app)    
        .get(`/api/payments/${paymentId}`)
        .set('Cookie',cookie)
        .send({});
    
    expect(response.status).toEqual(404);
});



it('doenst fetches the payment created from diferent user', async () => {
    //Create order
    const userId = mongoose.Types.ObjectId().toHexString();

    const order = Order.build({
        id: mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        userId : userId,
        price : 10,
        version: 0
    });

    await order.save();
    
    const { body: payment } = await request(app)    
        .post('/api/payments')
        .set('Cookie',global.signin(userId))
        .send({
            token:'tok_visa',
            orderId: order.id
        })
        .expect(201);


    //Make request to get the created payment but with User #2
    const userTwo= global.signin();
    await request(app)
    .get(`/api/payments/${payment.id}`)
    .set('Cookie',userTwo)
    .expect(401);
    
});


it('fetches the order created from same user', async () => {
    const userId = mongoose.Types.ObjectId().toHexString();

    const order = Order.build({
        id: mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        userId : userId,
        price : 10,
        version: 0
    });

    await order.save();
    
    const { body: payment } = await request(app)    
        .post('/api/payments')
        .set('Cookie',global.signin(userId))
        .send({
            token:'tok_visa',
            orderId: order.id
        })
        .expect(201);


    //Make request to get the created payment but with User #1
    await request(app)
    .get(`/api/payments/${payment.id}`)
    .set('Cookie',global.signin(userId))
    .expect(200);
    
    
});


