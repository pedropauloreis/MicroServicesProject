import request from 'supertest';
import {app} from '../../app';
import {Order, OrderStatus} from '../../models/order';
import {natsWrapper} from '../../nats-wrapper';
import mongoose from 'mongoose';
import { stripe } from '../../stripe';
import { Payment } from '../../models/payment';

it('has a route handler listening to /api/payments for post requests', async () => {
    const response = await request(app)
        .post('/api/payments')
        .send({});
    
    expect(response.status).not.toEqual(404);
 
});

it('can only be accessed if the user is signed in', async () => {
    const response = await request(app)    
        .post('/api/payments')
        .send({});
    
    expect(response.status).toEqual(401);
 
});

it('return a status other than 401 if the user is signed in', async () => {
    const cookie = global.signin();
    const response = await request(app)    
        .post('/api/payments')
        .set('Cookie',cookie)
        .send({});
    
    expect(response.status).not.toEqual(401);
 
});

it('returns an 400 error if an invalid token is provided', async () => {
    
    await request(app)    
        .post('/api/payments')
        .set('Cookie',global.signin())
        .send({
            token:'',
            orderId: mongoose.Types.ObjectId().toHexString()
        })
        .expect(400);
    
    await request(app)    
        .post('/api/payments')
        .set('Cookie',global.signin())
        .send({
            orderId: mongoose.Types.ObjectId().toHexString()
        })
        .expect(400);
});


it('returns an 400 error if an invalid orderId is provided', async () => {
    await request(app)    
        .post('/api/payments')
        .set('Cookie',global.signin())
        .send({
            token:'123',
            orderId: '123'
        })
        .expect(400);
    
    await request(app)    
        .post('/api/payments')
        .set('Cookie',global.signin())
        .send({
            token:'123',
        })
        .expect(400);
});


it('returns an 404 error if the order  does not exist', async () => {
    
    await request(app)    
        .post('/api/payments')
        .set('Cookie',global.signin())
        .send({
            token:'123',
            orderId: mongoose.Types.ObjectId().toHexString()
        })
        .expect(404);
        
});

it('returns an 401 error if the requested user doesnt own the order', async () => {
    

    const userId = mongoose.Types.ObjectId().toHexString();

    const order = await Order.build({
        id: mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        userId : userId,
        price : 10,
        version: 0
    });

    await order.save();
    
    await request(app)    
        .post('/api/payments')
        .set('Cookie',global.signin())
        .send({
            token:'123',
            orderId: order.id
        })
        .expect(401);
        
});

it('returns an 400 error if the order is already cancelled', async () => {
    

    const userId = mongoose.Types.ObjectId().toHexString();

    const order = await Order.build({
        id: mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Cancelled,
        userId : userId,
        price : 10,
        version: 1
    });

    await order.save();
    
    await request(app)    
        .post('/api/payments')
        .set('Cookie',global.signin(userId))
        .send({
            token:'123',
            orderId: order.id
        })
        .expect(400);
        
});



it('call charge from Stripe and return a 201 with valid inputs', async () => {
    const userId = mongoose.Types.ObjectId().toHexString();

    const order = Order.build({
        id: mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        userId : userId,
        price : 10,
        version: 0
    });

    await order.save();
    
    const response = await request(app)    
        .post('/api/payments')
        .set('Cookie',global.signin(userId))
        .send({
            token:'tok_visa',
            orderId: order.id
        })
        .expect(201);
  
    const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];
    expect(stripe.charges.create).toHaveBeenCalled();
    expect(chargeOptions.source).toEqual('tok_visa');
    expect(chargeOptions.currency).toEqual('brl');
    expect(chargeOptions.amount).toEqual(order.price * 100);
    
});


it('creates an payment with valid inputs', async () => {
    const userId = mongoose.Types.ObjectId().toHexString();

    const order = Order.build({
        id: mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        userId : userId,
        price : 10,
        version: 0
    });

    await order.save();
    
    await request(app)    
        .post('/api/payments')
        .set('Cookie',global.signin(userId))
        .send({
            token:'tok_visa',
            orderId: order.id
        })
        .expect(201);

        const chargedOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];
        const chargeResult = await (stripe.charges.create as jest.Mock).mock.results[0].value;
       
        expect(chargedOptions.source).toEqual('tok_visa');
        expect(chargedOptions.amount).toEqual(order.price * 100);
        expect(chargedOptions.currency).toEqual('brl');
       
        const payment = await Payment.findOne({
          orderId: order.id,
          stripeId: chargeResult.id,
        });
       
        expect(payment).toBeDefined();
        expect(payment!.orderId).toEqual(order.id);
        expect(payment!.userId).toEqual(userId);
        expect(payment!.stripeId).toEqual(chargeResult.id);

    
});


it('publishes an event', async () => {
    const userId = mongoose.Types.ObjectId().toHexString();

    const order = Order.build({
        id: mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        userId : userId,
        price : 10,
        version: 0
    });

    await order.save();
    
    await request(app)    
        .post('/api/payments')
        .set('Cookie',global.signin(userId))
        .send({
            token:'tok_visa',
            orderId: order.id
        })
        .expect(201);


    expect(natsWrapper.client.publish).toHaveBeenCalled();
});


