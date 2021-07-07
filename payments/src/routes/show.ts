import mongoose from "mongoose";
import  express, {Request, Response}  from "express";
import {param} from 'express-validator';
import { NotAuthorizedError, NotFoundError, requireAuth, validateRequest } from "@ppreistickets/common";
import {Payment} from '../models/payment';

const router = express.Router();
router.get('/api/payments/:paymentId',
    requireAuth,
    [
        param('paymentId')
            .not()
            .isEmpty()
            .custom((input:string) => mongoose.Types.ObjectId.isValid(input) )
            .withMessage('A valid paymentID param is required')
    ],
    validateRequest,
    async (req:Request, res: Response) => {
        const payment = await Payment.findById(req.params.paymentId);
        
        if(!payment)
        {
            throw new NotFoundError();
        }

        if(payment.userId !== req.currentUser!.id)
        {
            throw new NotAuthorizedError();
        }

        res.send(payment);
    
});

export { router as showPaymentRouter }
