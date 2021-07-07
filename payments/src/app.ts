import express from 'express';
import 'express-async-errors';
import cookieSession from 'cookie-session';
import { errorHandler, NotFoundError, currentUser} from '@ppreistickets/common';

import { createPaymentRouter } from './routes/new';
import { showPaymentRouter } from './routes/show';
import { indexPaymentRouter } from './routes/index';

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use(cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test'
}));


app.use(currentUser);
app.use(createPaymentRouter);
app.use(showPaymentRouter);
app.use(indexPaymentRouter);

app.all('*', async (req,res) => {
    throw new NotFoundError();
});

app.use(errorHandler);

export {app};
