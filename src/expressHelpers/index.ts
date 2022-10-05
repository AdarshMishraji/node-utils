import express, { Application, Response as ExpressResponse } from 'express';

import {
	AlreadyExistsError,
	BadRequestError,
	ForbiddenError,
	InternalServerError,
	NoDataError,
	NotAcceptedError,
	NotFoundError,
	PartialData,
	ResponseError,
	Success,
	UnauthorizedError,
} from '../httpResponses';
import { IUpgradedResponse } from '../types';

class UpgradedResponse<T = undefined, V = undefined> implements IUpgradedResponse<T, V> {
	message?: string;
	statusCode?: number;
	data?: T;
	res?: ExpressResponse;
	error?: V;

	constructor(data?: T, message?: string, statusCode?: number, error?: V) {
		this.message = message;
		this.statusCode = statusCode;
		this.error = error;
		this.data = data;
		this.res = undefined;
	}

	private mutate(fn: (self: this) => void) {
		fn(this);
		return this;
	}

	private mutateErrorCallback(self: this, error: ResponseError<V>) {
		self.statusCode = error.statusCode;
		self.message = error.message;
		self.error = error.error;
		delete self.data;
	}

	private mutateSuccessCallback(self: this, { statusCode, message }: { statusCode: number; message: string }) {
		self.statusCode = statusCode;
		self.message = message;
		delete self.error;
	}

	captureOriginalResponse(res: ExpressResponse) {
		return this.mutate((self) => {
			self.res = res;
		});
	}

	send() {
		return this.mutate((self) => {
			if (!self.res?.json) {
				throw new Error('Cannot Call send Response before create');
			}
			return self.res.status(self.statusCode ?? 200).json({
				statusCode: self.statusCode,
				message: self.message,
				data: self.data,
				error: self.error,
			});
		});
	}

	success() {
		return this.mutate((self) => this.mutateSuccessCallback(self, Success));
	}

	partialData() {
		return this.mutate((self) => this.mutateSuccessCallback(self, PartialData));
	}

	noData(error?: V) {
		return this.mutate((self: this) => this.mutateErrorCallback(self, new NoDataError<V>({ error })));
	}

	badRequest(error?: V) {
		return this.mutate((self: this) => this.mutateErrorCallback(self, new BadRequestError<V>({ error })));
	}

	unauthorized(error?: V) {
		return this.mutate((self: this) => this.mutateErrorCallback(self, new UnauthorizedError<V>({ error })));
	}

	forbidden(error?: V) {
		return this.mutate((self: this) => this.mutateErrorCallback(self, new ForbiddenError<V>({ error })));
	}

	notFound(error?: V) {
		return this.mutate((self: this) => this.mutateErrorCallback(self, new NotFoundError<V>({ error })));
	}

	notAccepted(error?: V) {
		return this.mutate((self: this) => this.mutateErrorCallback(self, new NotAcceptedError<V>({ error })));
	}

	alreadyExists(error?: V) {
		return this.mutate((self: this) => this.mutateErrorCallback(self, new AlreadyExistsError<V>({ error })));
	}

	internalServerError(error?: V) {
		return this.mutate((self: this) => this.mutateErrorCallback(self, new InternalServerError<V>({ error })));
	}
}

/**
 * @param {Application} app express app
 * @returns {Application} updated express app with custom express-helpers like `res.create`
 */
export const upgradeResponse = (app: Application): Application =>
	app.use((_req, res, next) => {
		res.create = <T = undefined, V = undefined>(data?: T) =>
			new UpgradedResponse<T, V>(data).captureOriginalResponse(res);
		next();
	});

/**
 *
 * @param {Object} data = {data, statusCode, errors}
 * @param {Object} res Express response object
 * @returns {Express.UpgradedResponse<T, unknown>} Formatted response
 */
export const getResponseFromData = <T = undefined, V = undefined>(
	{ data, statusCode, errors }: { data: T; statusCode: number; errors?: V },
	res: ExpressResponse,
): IUpgradedResponse<T, unknown> | null | undefined => {
	switch (statusCode) {
		case 200:
			return res.create<T>?.(data).success().send();
		case 400:
			return res.create<T, V>?.(data).badRequest(errors).send();
		default:
			return res.create<T, V>?.(data).internalServerError(errors).send();
	}
};

export { express };
