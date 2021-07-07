import mongoose from 'mongoose';
import  express, {Request, Response}  from "express";
import { param } from "express-validator";
import { Ticket } from '../models/ticket';
import {NotFoundError, validateRequest} from '@ppreistickets/common'

const router = express.Router();
router.get('/api/tickets/:ticketId', 
    [
        param('ticketId')
            .not()
            .isEmpty()
            .custom((input:string) => mongoose.Types.ObjectId.isValid(input) )
            .withMessage('A valid ticketId param is required'),
    ],
    validateRequest,
    async (req:Request, res: Response) => {
        const ticket = await Ticket.findById(req.params.ticketId);
        
        if (!ticket)
        {
            throw new NotFoundError();
        }

        res.send(ticket);
    
});

export { router as showTicketRouter }
