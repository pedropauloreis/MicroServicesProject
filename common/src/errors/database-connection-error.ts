import { CustomError } from "./cumtom-error";

export class DatabaseConnectionError extends CustomError {
    statusCode = 500;
    reason: string = 'Error connecting to database';

    constructor() {
        super('Invalid request params');
        Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
    }

    serializeErrors() {
        return [{message: this.reason}]
    }
}