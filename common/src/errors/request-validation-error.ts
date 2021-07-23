import {ValidationError} from 'express-validator';
import { CustomError } from './cumtom-error';

export class RequestValidationError extends CustomError {
    statusCode = 400;
    constructor(public errors: ValidationError[]) {
        super('Error connecting to DB');

        // Only because we are extending a built in class
        Object.setPrototypeOf(this, RequestValidationError.prototype);
    }

    serializeErrors(){
        return this.errors.map(err => {
            return {message: err.msg, field: err.param}
        })
    }
}
