import request from 'supertest';
import {app} from '../../app';
import cookieSession from 'cookie-session';

it('returns a 201 on a successful signup', async () => {
    return request(app)
        .post('/api/users/signup')
        .send({
            email: 'teste@teste.com',
            password: 'pass'
        })
        .expect(201);
});

it('returns a 400 with an invalid email', async () => {
    return request(app)
        .post('/api/users/signup')
        .send({
            email: 'invalid',
            password: 'password'
        })
        .expect(400);
});

it('returns a 400 with an invalid password', async () => {
    return request(app)
        .post('/api/users/signup')
        .send({
            email: 'invalid',
            password: '1111'
        })
        .expect(400);
});

it('returns a 400 with missing email and password', async () => {
    await request(app)
        .post('/api/users/signup')
        .send({email: 'email@email.com'})
        .expect(400);
    await request(app)
        .post('/api/users/signup')
        .send({password: 'password'})
        .expect(400);
});

it('disallows duplicate email', async () => {
    await request(app)
        .post('/api/users/signup')
        .send({
            email: 'email1@teste.com',
            password: 'password'
        })
        .expect(201);
    await request(app)
        .post('/api/users/signup')
        .send({
            email: 'email1@teste.com',
            password: 'password'
        })
        .expect(400);
});

it('sets a cookie after successful signup', async () => {
    
    const response = await request(app)
        .post('/api/users/signup')
        .send({
            email: 'email1@teste.com',
            password: 'password'
        })
        .expect(201);

    expect(response.get('Set-Cookie')).toBeDefined();
    
});