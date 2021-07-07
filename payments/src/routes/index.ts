import  express, {Request, Response}  from "express";
import { requireAuth } from "@ppreistickets/common";
import {Payment} from '../models/payment';


const router = express.Router();
router.get('/api/payments',
    requireAuth,
    async (req:Request, res: Response) => {
        const payments = await Payment.find({
            userId: req.currentUser!.id
        }).populate('ticket');
        
        res.send(payments);
    
});

export { router as indexPaymentRouter }
