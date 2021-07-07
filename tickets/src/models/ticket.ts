import mongoose from "mongoose";
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

//!An interface that describes the properties
//!that are required to create a new User
interface TicketAttrs {
    title: string;
    price: number;
    userId: string;
}

//!An interface that describes the properties
//!that a User Document has
interface TicketDoc extends mongoose.Document {
    title: string;
    price: number;
    userId: string;
    orderId?: string;
    version: number;
}

//!An interface that describes the propoerties
//!that a User Model has
interface TicketModel extends mongoose.Model<TicketDoc> {
    build(attrs: TicketAttrs): TicketDoc;
    findByEvent(event: {id: string, version: number}): Promise<TicketDoc | null>;
}


const ticketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    orderId: {
        type: String,
    }
    
},{
    toJSON: {
        transform(doc,ret) {
            ret.id = ret._id;
            //delete ret.__v;
            delete ret._id;
        },
        
    }
});

ticketSchema.set('versionKey','version');
ticketSchema.plugin(updateIfCurrentPlugin);

ticketSchema.statics.build = (attrs:TicketAttrs) => {
    return new Ticket(attrs);
};

ticketSchema.statics.findByEvent = (event: {id: string, version: number}) => {
    return Ticket.findOne({
        _id : event.id,
        version : event.version - 1
    });
}


const Ticket = mongoose.model<TicketDoc, TicketModel>('Ticket',ticketSchema);

export { Ticket };