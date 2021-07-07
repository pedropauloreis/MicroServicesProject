import request from 'supertest';
import {app} from '../../app';


it('fails when a email that does not exist is supplied', async () => {
    return request(app)
        .post('/api/users/signin')
        .send({
            email: 'email@email.com',
            password: 'password'
        })
        .expect(400);
});


it('fails when a incorrect password is supplied', async () => {
    
    await request(app)
        .post('/api/users/signup')
        .send({
            email: 'email@teste.com',
            password: 'passwordcorreto'
        })
        .expect(201);

    await request(app)
        .post('/api/users/signin')
        .send({
            email: 'email@teste.com',
            password: 'passwordincorreto'
        })
        .expect(400);
});

it('response with a cookie when given a valid credential', async () => {
    
    await request(app)
        .post('/api/users/signup')
        .send({
            email: 'email@teste.com',
            password: 'passwordcorreto'
        })
        .expect(201);

    const response = await request(app)
        .post('/api/users/signin')
        .send({
            email: 'email@teste.com',
            password: 'passwordcorreto'
        })
        .expect(200);

    expect(response.get('Set-Cookie')).toBeDefined();
});