import { CustomError } from './cumtom-error';

export class NotFoundError extends CustomError {
    statusCode = 404;
    constructor() {
        super('Route not Found');

        // Only because we are extending a built in class
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }

    serializeErrors(){
        return [{message: 'Not Found'}];
    }
}

