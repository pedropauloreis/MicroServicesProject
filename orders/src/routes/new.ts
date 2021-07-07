import mongoose from "mongoose";
import  express, {Request, Response}  from "express";
import {body} from 'express-validator';
import { NotFoundError, requireAuth, validateRequest, OrderStatus, BadRequestError } from "@ppreistickets/common";
import {Ticket} from '../models/ticket';
import {Order} from '../models/order';
import { OrderCreatedPublisher } from "../events/publishers/order-created-publisher";
import { natsWrapper } from "../nats-wrapper";

//15 minutos
//const EXPIRATION_WINDOW_SECONDS = 15 * 60;

//1 minuto
const EXPIRATION_WINDOW_SECONDS = 1 * 60;

const router = express.Router();
router.post('/api/orders',
    requireAuth, 
    [
        body('ticketId')
            .not()
            .isEmpty()
            .custom((input:string) => mongoose.Types.ObjectId.isValid(input) )
            .withMessage('A valid TicketId is required')
    ],
    validateRequest,
    async (req:Request, res: Response) => {
        
        const {ticketId} = req.body;
        
        //! Find de Ticket the user is trying to order in the database
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            throw new NotFoundError();
        }

        //! Make sure that this ticket is not alreay reserved
        const isReserved = await ticket.isReserved();
        if (isReserved)
        {
            throw new BadRequestError('Ticket already reserved');
        }

        //! Calculate an expiration date for the order
        const expiration = new Date();
        expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

        //! Build the order and save it to the database
        const order = Order.build({
            userId: req.currentUser!.id,
            status: OrderStatus.Created,
            expiresAt: expiration,
            ticket
        });

        await order.save();

        await new OrderCreatedPublisher(natsWrapper.client).publish({
            id: order.id,
            status: order.status,
            userId: order.userId,
            expiresAt: order.expiresAt.toISOString(),
            ticket: {
                id: ticket.id,
                price: ticket.price
            },
            version: order.version,
        });

        res.status(201).send(order);
    
});

export { router as newOrderRouter }
