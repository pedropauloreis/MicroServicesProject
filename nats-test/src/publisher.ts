import { randomBytes } from 'crypto';
import nats from 'node-nats-streaming';
import { TicketCreatedPublisher } from './events/ticket-created-publisher';

console.clear();
//const stan = nats.connect(); -- Segundo documentação do NATS, eles chamam o cliente de stan

const stan = nats.connect('ticketing',`pub_${randomBytes(4).toString('hex')}`, {
    url: 'http://localhost:4222'
});

stan.on('connect', async () => {
    console.log('Publisher connected to NATS');

    // const data = JSON.stringify({
    //     id: '123',
    //     title: 'concert',
    //     price: 20

    // });
    
    // stan.publish('ticket:created', data, () => {
    //     console.log('Event published');
    // });


    const publisher = new TicketCreatedPublisher(stan);
    try { 
        await publisher.publish({
            id: '123',
            title: 'concert',
            price: 20,
            userId: 'abc'
        });    
    }
    catch(err) {
        console.error(err);
    }
    

});


