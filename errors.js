/**
 * Created by JasonXu on 2017/3/18.
 */
"use strict";

let NOT_FOUND = "Url not found",
    BAD_REQUEST = "Please check your request",
    UNAUTHORIZED_ERROR = "Sorry, you are not authorized to access this page",
    FORBIDDEN = "Sorry, you can't access this page.";

class NotFoundError extends Error {
    constructor (msg=NOT_FOUND){
        super(msg);
        this.code = 404;
    }
}

class BadRequest extends Error {
    constructor (msg=BAD_REQUEST){
        super(msg);
        this.code = 400;
    }
}

class UnauthorizedError extends Error {
    constructor (msg=UNAUTHORIZED_ERROR){
        super(msg);
        this.code = 401;
    }
}

class ForbiddenError extends Error {
    constructor (msg=FORBIDDEN){
        super(msg);
        this.code = 403;
    }
}

module.exports = {
    NotFoundError: NotFoundError,
    BadRequest: BadRequest,
    UnauthorizedError: UnauthorizedError,
    ForbiddenError: ForbiddenError
};