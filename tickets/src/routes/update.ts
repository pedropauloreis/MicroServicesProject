import mongoose from 'mongoose';
import  express, {Request, Response}  from "express";
import { Ticket } from '../models/ticket';
import {NotFoundError, NotAuthorizedError, requireAuth, validateRequest, BadRequestError} from '@ppreistickets/common'
import { param } from "express-validator";
import { body } from "express-validator";
import { TicketUpdatedPublisher } from '../events/publishers/ticket-updated-publisher';
import { natsWrapper } from "../nats-wrapper";

const router = express.Router();
router.put('/api/tickets/:ticketId', 
    requireAuth, 
    [
        param('ticketId')
            .not()
            .isEmpty()
            .custom((input:string) => mongoose.Types.ObjectId.isValid(input) )
            .withMessage('A valid ticketId param is required'),
        body('title')
            .not()
            .isEmpty()
            .withMessage('Title is required'),
        body('price')
            .isFloat({gt: 0})
            .withMessage('Price must be greater than zero')
    ],
    validateRequest,
    async (req:Request, res: Response) => {
        const ticket = await Ticket.findById(req.params.ticketId);
        const {title, price} = req.body;
        if (!ticket)
        {
            throw new NotFoundError();
        }

        if (ticket.userId !== req.currentUser!.id)
        {
            throw new NotAuthorizedError();
        }

        if(ticket.orderId)
        {
            throw new BadRequestError('Cannot edit a reserved ticket');
            
        }

        ticket.set({
            title,
            price
        });

        await ticket.save();

        await new TicketUpdatedPublisher(natsWrapper.client).publish({
            id: ticket.id,
            title: ticket.title,
            price: ticket.price,
            userId: ticket.userId,
            version: ticket.version,
        });

        res.status(200).send(ticket);

    
});

export { router as updateTicketRouter }
