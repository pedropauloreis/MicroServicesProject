import mongoose from "mongoose";
import  express, {Request, Response}  from "express";
import {param} from 'express-validator';
import { NotAuthorizedError, NotFoundError, requireAuth, validateRequest, OrderStatus, BadRequestError } from "@ppreistickets/common";
import {Order} from '../models/order';
import { OrderCancelledPublisher } from "../events/publishers/order-cancelled-publisher";
import { natsWrapper } from "../nats-wrapper";

const router = express.Router();
router.delete('/api/orders/:orderId', 
    requireAuth,
    [
        param('orderId')
            .not()
            .isEmpty()
            .custom((input:string) => mongoose.Types.ObjectId.isValid(input) )
            .withMessage('A valid orderID param is required')
    ],
    validateRequest,
    async (req:Request, res: Response) => {
        const {orderId} = req.params;
        const order = await Order.findById(orderId).populate('ticket');
        
        if(!order)
        {
            throw new NotFoundError();
        }

        if(order.userId !== req.currentUser!.id)
        {
            throw new NotAuthorizedError();
        }

        order.status = OrderStatus.Cancelled;
        await order.save();

        await new OrderCancelledPublisher(natsWrapper.client).publish({
            id: order.id,
            ticket: {
                id: order.ticket.id,
            },
            version: order.version
        });

        res.status(204).send(order);
});

export { router as deleteOrderRouter }
