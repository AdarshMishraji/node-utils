export const Success = {
	statusCode: 200,
	message: 'Success',
};
export const PartialData = {
	statusCode: 206,
	message: 'Partial Data',
};

/**
 * @typeParam T - Error type
 */
export class ResponseError<T> extends Error {
	statusCode: number;
	error?: T;
	message: string;

	constructor({ message, error, statusCode }: { message: string; error?: T; statusCode: number }) {
		super(message);
		this.message = message;
		this.statusCode = statusCode;
		this.error = error;
	}
}

/**
 * @typeParam T - Error type
 * @param {Object} error
 */
export class NoDataError<T> extends ResponseError<T> {
	constructor({ error }: { error?: T } = {}) {
		super({ message: 'No Data', statusCode: 204, error });
	}
}

/**
 * @typeParam T - Error type
 * @param {Object} error  Data  example { email: "Please provide an email" }
 */
export class BadRequestError<T> extends ResponseError<T> {
	constructor({ error }: { error?: T } = {}) {
		super({ message: 'Bad Request', error, statusCode: 400 });
	}
}

/**
 * @typeParam T - Error type
 * @param {Object} error  Data  example { email: "Please provide an email" }
 */
export class UnauthorizedError<T> extends ResponseError<T> {
	constructor({ error }: { error?: T } = {}) {
		super({ message: 'Unauthorized Error', statusCode: 401, error });
	}
}

/**
 * @typeParam T - Error type
 * @param {Object} error  Data  example { email: "Please provide an email" }
 */
export class ForbiddenError<T> extends ResponseError<T> {
	constructor({ error }: { error?: T } = {}) {
		super({ message: 'Forbidden', statusCode: 403, error });
	}
}

/**
 * @typeParam T - Error type
 * @param {Object} error  Data  example { email: "Please provide an email" }
 */
export class NotFoundError<T> extends ResponseError<T> {
	constructor({ error }: { error?: T } = {}) {
		super({ message: 'Not Found', statusCode: 404, error });
	}
}

/**
 * @typeParam T - Error type
 * @param {Object} error  Data  example { email: "Please provide an email" }
 */
export class NotAcceptedError<T> extends ResponseError<T> {
	constructor({ error }: { error?: T } = {}) {
		super({ message: 'Not Accepted', statusCode: 406, error });
	}
}

/**
 * @typeParam T - Error type
 * @param {Object} error  Data  example { email: "Please provide an email" }
 */
export class AlreadyExistsError<T> extends ResponseError<T> {
	constructor({ error }: { error?: T } = {}) {
		super({ message: 'Already Existed (Conflict)', statusCode: 409, error });
	}
}

/**
 * @typeParam T - Error type
 * @param {Object} error  Data  example { email: "Please provide an email" }
 */
export class InternalServerError<T> extends ResponseError<T> {
	constructor({ error }: { error?: T } = {}) {
		super({ message: 'Internal Server Error', statusCode: 500, error });
	}
}

export const isMiscellaneousError = (err: object & { statusCode?: number; message?: string } = {}) =>
	!err.statusCode || !err.message;
