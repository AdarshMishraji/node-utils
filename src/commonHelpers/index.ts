import { randomBytes, createCipheriv, createDecipheriv, createHmac } from 'crypto';
import { get, IncomingHttpHeaders, IncomingMessage } from 'http';

import DeviceDetector from 'device-detector-js';
import { Request } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { TGeoData } from './types';

/**
 * @typeParam T - Array type
 * @param arr - Input array
 * @returns Empty array if input is undefined or null
 * @description CAUTION: Avoid using array methods like `.push` or `.concat` on this as it returns a new array which is not the same as the input array
 * @example
 * const arr = [1, 2, 3];
 * ArrayMaybe(arr); // [1, 2, 3]
 * ArrayMaybe(undefined); // []
 * ArrayMaybe(null); // []
 */
export const ArrayMaybe = <T>(arr?: Array<T>): Array<T> => arr ?? [];

/**
 * @typeParam T - Object type
 * @param obj - Input Object
 * @returns Empty object if input is undefined or null
 * @example
 * ```typescript
 * const obj = { a: 1, b: 2 };
 * ObjectMaybe(obj); // { a: 1, b: 2 }
 * ObjectMaybe(undefined); // {}
 * ObjectMaybe(null); // {}
 * ```
 */
export const ObjectMaybe = <T extends object>(obj?: T): T => obj ?? ({} as T);

/**
 * @param str - Input string
 * @returns Empty string if input is undefined or null
 * @example
 * ```typescript
 * const str = 'abc';
 * StringMaybe(str); // 'abc'
 * StringMaybe(undefined); // ''
 * StringMaybe(null); // ''
 * ```
 */
export const StringMaybe = (str: any) => str || '';

/**
 * Returns `true` if the given value is its type's empty value; `false` otherwise.
 * @param value - Input value
 *
 * @example
 * ```typescript
 * isEmptyArray([1, 2, 3]);           //=> false
 * isEmptyArray([]);                  //=> true
 * isEmptyArray(null);                //=> true
 * isEmptyArray(Uint8Array.from([])); //=> true
 * isEmptyObject(null);                //=> true
 * isEmptyObject({});                  //=> true
 * isEmptyObject({length: 0});         //=> false
 * ```
 */
export const isEmptyArray = (x?: Array<any> | null) => typeof x !== 'boolean' && (!x || x.length === 0);

/**
 * Returns `true` if the given value is its type's empty value; `false` otherwise.
 * @param value - Input value
 *
 * @example
 * ```typescript
 * isEmptyObject(null);                //=> true
 * isEmptyObject({});                  //=> true
 * isEmptyObject({length: 0});         //=> false
 */
export const isEmptyObject = (obj?: object | null) => {
	if (obj) {
		for (const _ in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, _)) {
				return false;
			}
		}
		return !Object.keys(obj).length;
	}
	return true;
};

/**
 * Returns `true` if the given obj is its type's empty obj; `false` otherwise.
 * @param obj - Input obj
 *
 * @example
 * ```typescript
 * isEmptyEntity([1, 2, 3]);           //=> false
 * isEmptyEntity([]);                  //=> true
 * isEmptyEntity('');                  //=> true
 * isEmptyEntity(null);                //=> true
 * isEmptyEntity({});                  //=> true
 * isEmptyEntity({length: 0});         //=> false
 * isEmptyEntity(Uint8Array.from([])); //=> true
 * ```
 */
export const isEmptyEntity = (obj?: object | null): boolean =>
	Array.isArray(obj) ? isEmptyArray(obj) : isEmptyObject(obj);

export const getTimestampLabel = (dateObj?: Date) => {
	if (dateObj) {
		const todaysObj = new Date();
		const diff = todaysObj.getDate() - dateObj.getDate();

		switch (diff) {
			case 0:
				return 'Today';
			case 1:
				return 'Yesterday';
			default:
				return dateObj.toLocaleDateString();
		}
	}
	return '';
};
export const cleanEmpty = (obj: Array<any> | object) => {
	if (Array.isArray(obj)) {
		return obj.map((v) => (v && typeof v === 'object' ? cleanEmpty(v) : v)).filter((v) => !(v === null));
	} else {
		return Object.entries(obj)
			.map(([k, v]) => [k, v && typeof v === 'object' ? cleanEmpty(v) : v])
			.reduce((a, [k, v]) => (v === null ? a : ((a[k] = v), a)), {});
	}
};

export const nowMongoDate = () => new Date().toISOString();

/**
 * @param start - Start number
 * @param end - End number
 * @returns Array of numbers between start (inclusive) and end (inclusive)
 * @example
 * ```typescript
 * numberRange(1, 5); // [1, 2, 3, 4, 5]
 * ```
 */
export const numberRange = (start: number, end: number) =>
	Array(end - start + 1)
		.fill(0)
		.map((_, idx) => start + idx);

export const dateToMongoDate = (input: { toISOString: () => any }) =>
	input instanceof Date ? input.toISOString() : input;

export const groupByKey = (objectArray: Array<any>, property: string) => {
	return objectArray.reduce((acc, obj) => {
		const key = obj[property];
		if (!acc[key]) {
			acc[key] = [];
		}
		acc[key].push(obj);
		return acc;
	}, {});
};

/**
 *
 * @param {number} length - Length of the random string
 * @param {string} param1.pool Pool string from which the random string is generated
 * @param {boolean} param1.includeNumeric - Whether the random string should include numbers or not defaults to true
 * @param {boolean} param1.includeAlphabet - Whether the random string should include alphabets or not defaults to true
 * @param {boolean} param1.includeUppercase - Whether the random string should include uppercase characters or not defaults to true
 * @param {boolean} param1.includeLowercase - Whether the random string should include lowercase characters or not defaults to true
 * @returns Random string
 * @description Returns a random string of length `length`
 * @example
 * getRandomString(10, {includeNumeric : false}); // 'fjdskfjdsA'
 * getRandomString(10, {includeUppercase: false}); // 'ru0nt886lh'
 * getRandomString(10, {pool: 'ABCdef1234', includeUppercase: false}); // '42df1d33de'
 * getRandomString(10); // 'fjd1skfjd3'
 */
export const genRandomString = (
	length: number,
	{
		pool,
		includeNumeric = true,
		includeAlphabet = true,
		includeUppercase = true,
		includeLowercase = true,
	}: {
		pool?: string;
		includeNumeric?: boolean;
		includeAlphabet?: boolean;
		includeUppercase?: boolean;
		includeLowercase?: boolean;
	} = {},
) => {
	let characters = pool ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	if (!includeAlphabet) {
		characters = characters.replace(/[A-Za-z]+/g, '');
	}
	if (!includeUppercase) {
		characters = characters.replace(/[A-Z]+/g, '');
	}
	if (!includeLowercase) {
		characters = characters.replace(/[a-z]+/g, '');
	}
	if (!includeNumeric) {
		characters = characters.replace(/[^\D]+/g, '');
	}

	const charactersLength = characters.length;

	let result = '';
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
};

/**
 * Returns a random int the given range (inclusive)
 * @param {number} min min
 * @param {number} max number of ms to wait
 */
export const getRandomInt = (min: number, max: number): number => {
	const min_ = Math.ceil(min);
	const max_ = Math.floor(max);
	return Math.floor(Math.random() * (max_ - min_ + 1)) + min;
};

export const getDaysInSeconds = (days: number) => days * 24 * 60 * 60;

/**
 * @param userAgent string
 */

export const getDeviceData = (userAgent: string) => {
	return new DeviceDetector().parse(userAgent);
};

/**
 * @param {string} token string
 * @param {string} secret string
 * @param {Boolean} ignoreExpiration boolean
 */
export const verifyAndDecodeJWT = <T>(
	token: string,
	secret: string,
	ignoreExpiration?: boolean,
): { result?: T; tokenExpiredError?: TokenExpiredError } | null => {
	try {
		if (token && secret)
			return {
				result: jwt.verify(token, secret, {
					ignoreExpiration: ignoreExpiration ?? false,
				}),
			};
		return null;
	} catch (e) {
		if (e instanceof TokenExpiredError) return { tokenExpiredError: e };
		else return null;
	}
};

/**
 * @param {any} obj
 * @returns {Boolean} if the obj is promise or not
 */
export const isPromise = (obj: any) => {
	return !!obj?.then;
};

/**
 * @param {Record<string, Promise<any> | any>} object
 * @param {(args: any) => Promise<any>} functionToCall - optional function to call on each value
 * @returns {Promise<any>}
 *
 * @note if functionToCall is not provided, it will return a promise that resolves to an object with the same keys as the input object and values as the resolved values of the promises
 * @note if functionToCall is provided, it will return a promise that resolves to an object with the same keys as the input object and values
 * as the resolved values of the promises returned by the functionToCall,
 * and the values of the object will be passed as arguments to the functionToCall
 * @note functionToCall accepts only one argument, as the value of the object can only be one
 */
export const promiseAllRecord = (
	object: Record<string, Promise<any> | any>,
	functionToCall?: (arg: any) => Promise<any>,
) => {
	return new Promise<any>((resolve, reject) => {
		const results = {};
		let completed = 0;
		const entries = Object.entries(object);

		entries.forEach(([key, promiseOrValue]) => {
			if (!isPromise(promiseOrValue) && !functionToCall) throw new Error('Invalid input');
			Promise.resolve(isPromise(promiseOrValue) ? promiseOrValue : functionToCall?.(promiseOrValue))
				.then((result) => {
					results[key] = result;
					completed += 1;

					if (completed === entries.length) {
						resolve(results);
					}
				})
				.catch((err) => reject(err));
		});
	});
};

/**
 * @param fn
 * @returns {Function} Function that returns a promise of the function passed
 */
export const promisify =
	<T>(fn: (...args: any) => T) =>
	(...args: any) =>
		new Promise<T>((resolve) => {
			const response = fn(...args);
			resolve(response);
		});

/**
 * @param {string} string string
 * @param {string } key string
 */
export const aesEncryptData = (string: string, key: string) => {
	if (!string || !key) return null;
	const aesIV = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key, aesIV);
	return Buffer.concat([aesIV, Buffer.concat([cipher.update(string), cipher.final()]), cipher.getAuthTag()]).toString(
		'base64url',
	);
};

/**
 * @param {string} string string
 * @param {string } key string
 * @returns {Promise<string|null>} string
 */
export const promisifiedAesEncryptData = promisify(aesEncryptData);

/**
 * @param {T} object object
 * @param {string } key string
 * @returns {Promise<T>} string
 */
export const bulkAesEncrypt = <T extends object>(object: T, key: string): Promise<T> => {
	const functionToCall = (value) => promisifiedAesEncryptData(value, key);
	return promiseAllRecord(object, functionToCall);
};

/**
 * @param {string} string string
 * @param {string } key string
 */
export const aesDecryptData = (encryptedString: string, key: string) => {
	if (!encryptedString || !key) return null;
	const buffer = Buffer.from(encryptedString, 'base64url');
	const cipher = createDecipheriv('aes-256-gcm', key, buffer.subarray(0, 12));
	cipher.setAuthTag(buffer.subarray(-16));
	return cipher.update(buffer.subarray(12, -16)).toString() + cipher.final().toString();
};

export const promisifiedAesDecryptData = promisify(aesDecryptData);

/**
 * @param {object} object object
 * @param {string } key string
 */
export const bulkAesDecrypt = <T extends object>(object: T, key: string): Promise<T> => {
	const functionToCall = (value) => promisifiedAesDecryptData(value, key);
	return promiseAllRecord(object, functionToCall);
};

export const hashData = (string: string, key: string) => {
	if (string && key) {
		return createHmac('md5', key).update(string).digest('base64url');
	} else {
		throw new Error('Invalid input');
	}
};

/**
 * @typeParam T - Type of the returning object
 * @param {string} jsonString string to parse
 * @param {{logging: boolean, customLogger: TLoggerError}} options - options object
 * @description return parsed object if a valid json is provided else return null
 * @returns {T | null} parsed object or null
 * @example
 * ```typescript
 * safelyParseJSON('{"a":1}'); // {a:1}
 * safelyParseJSON('"a":1'); // null
 * ```
 */
export const safelyParseJSON = <T extends object>(jsonString: string | null | undefined): T => {
	try {
		return JSON.parse(jsonString ?? '') as T;
	} catch (error) {
		return {} as T;
	}
};

export function splitArrayToChunks<T>(array: ReadonlyArray<T>, parts: number): Array<Array<T>> {
	const arrayCopy = [...array];

	const result: Array<Array<T>> = [];
	for (let i = parts; i > 0; i--) {
		result.push(arrayCopy.splice(0, Math.ceil(arrayCopy.length / i)));
	}
	return result;
}

/**
 * @param {string} ip
 * @returns {Promise<Partial<TGeoData>>} as a promise of geodata
 * @example
 * ```{
 * status: 'success',
 * continent: 'North America',
 * continentCode: 'NA',
 * country: 'United States',
 * countryCode: 'US',
 * region: 'VA',
 * regionName: 'Virginia',
 * city: 'Ashburn',
 * zip: '20149',
 * lat: 39.03,
 * lon: -77.5,
 * timezone: 'America/New_York',
 * offset: -18000,
 * currency: 'USD',
 * isp: 'Google LLC',
 * org: 'Google Public DNS',
 * as: 'AS15169 Google LLC',
 * asname: 'GOOGLE',
 * reverse: 'dns.google',
 * mobile: false,
 * proxy: false,
 * hosting: true,
 * query: '8.8.8.8'
 * ```}
 */
export const fetchGeoData = (ip: string): Promise<Partial<TGeoData>> => {
	return new Promise((resolve, reject) => {
		get(
			{
				host: 'ip-api.com',
				path: `/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`,
			},
			(res: IncomingMessage) => {
				res.on('data', (data: any) => {
					if (data) {
						const geoData = JSON.parse(data.toString());
						if (geoData.status === 'success') return resolve(geoData);
						reject('Failed to fetch geo data');
					}
					return reject('No data');
				});
			},
		);
	});
};

export const monthsList = [
	{ value: 0, label: 'January' },
	{ value: 1, label: 'February' },
	{ value: 2, label: 'March' },
	{ value: 3, label: 'April' },
	{ value: 4, label: 'May' },
	{ value: 5, label: 'June' },
	{ value: 6, label: 'July' },
	{ value: 7, label: 'August' },
	{ value: 8, label: 'September' },
	{ value: 9, label: 'October' },
	{ value: 10, label: 'November' },
	{ value: 11, label: 'December' },
];

export const parseDisjointDateToMongoFormat = (year: number, month: number, date: number | undefined) =>
	new Date(year, month, date).toISOString();

export const compareTimestamps = (t1: number, t2: number, diffInSec: number) => t1 - t2 > diffInSec;

/**
 * @param {Request} {req} Express request object
 */
export const getParsedUserAgent = ({ req }: { req: Request }) => {
	const headers = ObjectMaybe<IncomingHttpHeaders>(req.headers);
	const userAgent = safelyParseJSON(headers.useragent?.toString() ?? '{}');
	return {
		userAgent,
		ip: (headers['cf-connecting-ip'] as string) || (headers['x-forwarded-for'] as string),
	};
};

export { jwt, DeviceDetector };
