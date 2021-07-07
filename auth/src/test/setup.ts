import {MongoMemoryServer} from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

import {app} from '../app';

declare global {
    namespace NodeJS {
        interface Global {
            signup(): Promise<string[]>
        }
    }
}

let mongo: any;
beforeAll(async ()=> {
    
    process.env.JWT_KEY = '123mudar';

    mongo = new MongoMemoryServer();
    const mongoUri = await mongo.getUri();

    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

beforeEach(async() => {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
        await collection.deleteMany({});
    }
});

afterAll(async () =>{
    await mongo.stop();
    await mongoose.connection.close();
});

global.signup = async () => {
    const email = "email@teste.com";
    const password = "password";

    const signupResponse = await request(app)
        .post('/api/users/signup')
        .send({
            email,password
        })
        .expect(201);

    const cookie = signupResponse.get('Set-Cookie');

    return cookie;
}