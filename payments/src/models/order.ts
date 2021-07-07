import mongoose from "mongoose";
import {OrderStatus} from "@ppreistickets/common"
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

//!An interface that describes the properties
//!that are required to create a new User
interface OrderAttrs {
    id: string;
    userId: string;
    status: OrderStatus;
    price: number;
    version: number;
}


//!An interface that describes the properties
//!that a User Document has
interface OrderDoc extends mongoose.Document {
    userId: string;
    status: OrderStatus;
    price: number;
    version: number;
}

//!An interface that describes the propoerties
//!that a User Model has
interface OrderModel extends mongoose.Model<OrderDoc> {
    build(attrs: OrderAttrs): OrderDoc;
    findByEvent(event: {id: string, version: number}): Promise<OrderDoc | null>;
}


const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: Object.values(OrderStatus),
        default: OrderStatus.Created
    },
    price: {
        type: Number,
        required: true
    },
    
},{
    toJSON: {
        transform(doc,ret) {
            ret.id = ret._id;
            delete ret._id;
        },
        
    }
});

orderSchema.set('versionKey','version');
orderSchema.plugin(updateIfCurrentPlugin);

orderSchema.statics.findByEvent = (event: {id: string, version: number}) => {
    return Order.findOne({
        _id : event.id,
        version : event.version - 1
    });
}

orderSchema.statics.build = (attrs:OrderAttrs) => {
    return new Order({
        _id: attrs.id,
        userId: attrs.userId,
        status: attrs.status,
        price: attrs.price,
        version: attrs.version,
    });
};

const Order = mongoose.model<OrderDoc, OrderModel>('Order',orderSchema);

export { Order, OrderDoc, OrderStatus };

