import { Response } from 'express';
import { Redis } from 'ioredis';

export interface IUpgradedResponse<T = undefined, V = undefined> {
	message?: string;
	statusCode?: number;
	data?: T;
	res?: Response<T>;
	error?: V;

	captureOriginalResponse: (res: Response) => this;

	send: () => this;
	success: () => this;
	partialData: () => this;
	noData: (error?: V) => this;
	badRequest: (error?: V) => this;
	unauthorized: (error?: V) => this;
	forbidden: (error?: V) => this;
	notFound: (error?: V) => this;
	notAccepted: (error?: V) => this;
	alreadyExists: (error?: V) => this;
	internalServerError: (error?: V) => this;
}

declare global {
	namespace Express {
		export interface Request {
			redisClient?: Redis;
		}

		export interface Response {
			create?: <T = undefined, V = undefined>(data?: T) => IUpgradedResponse<T, V>;
		}
	}
}
