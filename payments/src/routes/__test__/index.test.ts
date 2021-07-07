import request from 'supertest';
import mongoose from 'mongoose';

import {app} from '../../app';
import {Order, OrderDoc, OrderStatus} from '../../models/order';

const buildOrder = async (userId: string) : Promise<OrderDoc> => {
    const order = Order.build({
        id: mongoose.Types.ObjectId().toHexString(),
        userId,
        status: OrderStatus.Created,
        price: 20,
        version: 0
    });

    await order.save();
    return order;

}

it('has a route handler listening to /api/payments for get requests', async () => {
    const response = await request(app)
        .get('/api/payments')
        .send({});
    
    expect(response.status).not.toEqual(404);
 
});


it('can only be accessed if the user is signed in', async () => {
    const response = await request(app)    
        .get('/api/payments')
        .send({});
    
    expect(response.status).toEqual(401);
 
});

it('return a status other than 401 if the user is signed in', async () => {
    const cookie = global.signin();
    const response = await request(app)    
        .get('/api/payments')
        .set('Cookie',cookie)
        .send({});
    
    expect(response.status).not.toEqual(401);
});


it('fetches orders from a particular user', async () => {
    //Create three tickets
    const userIdOne = mongoose.Types.ObjectId().toHexString();
    const userOne= global.signin(userIdOne);
    const orderOne = await buildOrder(userIdOne);

    const paymentOne = await request(app)
    .post('/api/payments')
    .set('Cookie',userOne)
    .send({
        token:'tok_visa',
        orderId: orderOne.id
    })
    .expect(201);


    const userIdTwo = mongoose.Types.ObjectId().toHexString();
    const userTwo= global.signin(userIdTwo);
    
    const orderTwo = await buildOrder(userIdTwo);
    const { body: paymentTwo } = await request(app)
    .post('/api/payments')
    .set('Cookie',userTwo)
    .send({
        token:'tok_visa',
        orderId: orderTwo.id
    })
    .expect(201);


    const orderThree = await  buildOrder(userIdTwo);
    const { body: paymentThree } = await request(app)
    .post('/api/payments')
    .set('Cookie',userTwo)
    .send({
        token:'tok_visa',
        orderId: orderThree.id
    })
    .expect(201);
  

    //Make request to get orders for User #2
    const response = await request(app)
    .get('/api/payments')
    .set('Cookie',userTwo)
    .expect(200);

    //Make sure we only get the orders for User 2
    expect(response.body.length).toEqual(2);
    expect(response.body[0].id).toEqual(paymentTwo.id);
    expect(response.body[0].orderId).toEqual(orderTwo.id);
    
    expect(response.body[1].id).toEqual(paymentThree.id);
    expect(response.body[1].orderId).toEqual(orderThree.id);

});


