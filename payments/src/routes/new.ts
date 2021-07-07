import  express, {Request, Response}  from "express";
import mongoose from 'mongoose';
import {body} from 'express-validator';
import { requireAuth, validateRequest, BadRequestError, NotFoundError, currentUser, NotAuthorizedError, OrderStatus } from "@ppreistickets/common";
import { Order } from '../models/order';
import { natsWrapper } from "../nats-wrapper";
import {stripe} from '../stripe';
import { Payment } from "../models/payment";
import { PaymentCreatedPublisher } from "../events/publishers/payment-created-publisher";

const router = express.Router();
router.post ('/api/payments', 
    requireAuth, 
    [
        body('token')
            .not()
            .isEmpty()
            .withMessage('token is required'),
        body('orderId')
            .not()
            .isEmpty()
            .custom((input:string) => mongoose.Types.ObjectId.isValid(input) )
            .withMessage('orderId is required'),
    ],
    validateRequest,
    async (req:Request, res: Response) => {
        const {token,orderId} =  req.body;
        const order = await Order.findById(orderId);

        if(!order)
        {
            throw new NotFoundError();
        }

        if(req.currentUser!.id !== order.userId)
        {
            throw new NotAuthorizedError();
        }

        if(order.status === OrderStatus.Cancelled)
        {
            throw new BadRequestError('Cannot pay for an cancelled order');
            
        }

        const charge = await stripe.charges.create({
            currency: 'brl',
            amount: order.price * 100,
            source: token,
            description: `orderId: ${order.id}`
        });

        const payment = Payment.build({
            orderId: orderId,
            stripeId: charge.id,
            userId: req.currentUser!.id,
            createdAt: new Date()
        });

        await payment.save();


        await new PaymentCreatedPublisher(natsWrapper.client).publish({
            id: payment.id,
            orderId: orderId,
            stripeId: charge.id,
        });

        res.status(201).send(payment);
    
});

export { router as createPaymentRouter }
