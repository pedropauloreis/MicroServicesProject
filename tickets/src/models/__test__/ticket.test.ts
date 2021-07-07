import {Ticket} from '../../models/ticket';
import mongoose from 'mongoose';

it('implements optimistic concurrency control', async ()=> {

    //Create an instance of a ticket
    const ticket = Ticket.build({
        title: 'concert',
        price: 20,
        userId: mongoose.Types.ObjectId().toHexString()
    });

    //Save the ticket to the database
    await ticket.save();

    //fetch the ticket twice
    const ticket1 = await Ticket.findById(ticket.id);
    const ticket2 = await Ticket.findById(ticket.id);
            
    //make two separate changes to the tickets we fetched
    ticket1!.set({price: 10});
    ticket2!.set({price: 15});

    //save the first fetched ticket successfully
    await ticket1!.save();

    //try to save the second fetched ticket without success
    //Metodo1
    //expect(async () => await ticket2!.save()).toThrow();

    //Metodo2
    try {
        await ticket2!.save()
        throw new Error('Should not reach this point')
    } catch (err) {
        expect(err).toBeInstanceOf(mongoose.Error.VersionError)
    }

});

it('it increments the version number on multiple saves', async ()=> {
    const ticket = Ticket.build({
        title: 'concert',
        price: 20,
        userId: mongoose.Types.ObjectId().toHexString()
    });

    
    await ticket.save();
    expect(ticket.version).toEqual(0);

    await ticket.save();
    expect(ticket.version).toEqual(1);

    await ticket.save();
    expect(ticket.version).toEqual(2);

    await ticket.save();
    expect(ticket.version).toEqual(3);
    
});
