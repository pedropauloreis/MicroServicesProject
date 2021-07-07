import mongoose from "mongoose";
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

//!An interface that describes the properties
//!that are required to create a new User
interface PaymentAttrs {
    orderId: string;
    stripeId: string;
    userId: string;
    createdAt: Date;
}


//!An interface that describes the properties
//!that a User Document has
interface PaymentDoc extends mongoose.Document {
    orderId: string;
    stripeId: string;
    userId: string;
    createdAt: Date;
    version: number;
}

//!An interface that describes the propoerties
//!that a User Model has
interface PaymentModel extends mongoose.Model<PaymentDoc> {
    build(attrs: PaymentAttrs): PaymentDoc;
    findByEvent(event: {id: string, version: number}): Promise<PaymentDoc | null>;
}


const paymentSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true
    },
    stripeId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    createdAt: {
        type: mongoose.Schema.Types.Date,
        required: true
    }    
    
},{
    toJSON: {
        transform(doc,ret) {
            ret.id = ret._id;
            delete ret._id;
        },
        
    }
});

paymentSchema.set('versionKey','version');
paymentSchema.plugin(updateIfCurrentPlugin);

paymentSchema.statics.findByEvent = (event: {id: string, version: number}) => {
    return Payment.findOne({
        _id : event.id,
        version : event.version - 1
    });
}

paymentSchema.statics.build = (attrs:PaymentAttrs) => {
    return new Payment(attrs);
};

const Payment = mongoose.model<PaymentDoc, PaymentModel>('Payment',paymentSchema);

export { Payment, PaymentDoc };

