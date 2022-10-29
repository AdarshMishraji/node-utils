import Redis, { RedisKey, RedisOptions } from 'ioredis';

import { isEmptyObject, safelyParseJSON } from '../commonHelpers';

export const redisConnection = ({
	redisHost,
	redisPort,
	redisDB,
	options = {},
}: {
	redisHost: string;
	redisPort: number;
	redisDB: number;
	options: Partial<RedisOptions>;
}): Redis => {
	const client = new Redis(redisPort, redisHost, { db: redisDB, ...options });

	client.on('connect', () => console.log('Redis client connected'));

	client.on('error', (error) => console.log({ prefixMsg: 'Something went wrong with redis', error }));

	return client;
};

export const setExAsync = ({
	client,
	key,
	seconds,
	value,
}: {
	client: Redis;
	key: RedisKey;
	seconds: number;
	value: unknown;
}) => client.setex(key, seconds, JSON.stringify(value));

export const setRData = async ({ client, key, value }: { client: Redis; key: RedisKey; value: unknown }) => {
	const stringifiedValue = JSON.stringify(value);
	return client.set(key, stringifiedValue);
};

export const getRData = async ({ client, key }: { client: Redis; key: RedisKey }) => {
	const data = await client.get(key);
	return safelyParseJSON(data);
};

export const getAsync = async ({ client, key }: { client: Redis; key: RedisKey }) => {
	const res = await client.get(key);
	return safelyParseJSON(res);
};

export const incrAsync = ({ client, key }: { client: Redis; key: RedisKey }) => client.incr(key);

export const delAsync = ({ client, key }: { client: Redis; key: RedisKey }) => client.del(key);

export const hvalsAsync = async ({ client, hash }: { client: Redis; hash: string }) => {
	const data = await client.hvals(hash);
	return data.map((dd) => safelyParseJSON(dd));
};

export const hsetAsync = async ({
	client,
	hash,
	key,
	val,
}: {
	client: Redis;
	hash: string;
	key: RedisKey;
	val: unknown;
}) => client.hset(hash, key, JSON.stringify(val));

export const mgetAsync = async ({ client, keys }: { client: Redis; keys: Array<string> }) => {
	const data = await client.mget(keys);
	return data.map((dd) => safelyParseJSON(dd));
};

export const hgetallAsync = async ({ client, hash }: { client: Redis; hash: string }) => {
	const data = await client.hgetall(hash);
	return isEmptyObject(data) ? null : data;
};

export const hmsetAsync = async ({ client, hash, keysobj }: { client: Redis; hash: string; keysobj: object }) =>
	client.hmset(hash, keysobj);

export const zAddAsync = async ({
	client,
	key,
	score,
	member,
}: {
	client: Redis;
	key: RedisKey;
	score: number;
	member: string;
}) => client.zadd(key, score, member);

export const zIncrByAsync = async ({
	client,
	key,
	score,
	member,
}: {
	client: Redis;
	key: RedisKey;
	score: number;
	member: string;
}) => {
	const incremented = await client.zincrby(key, score, member);
	return parseInt(incremented);
};

export const zRangeAsync = ({
	client,
	key,
	start,
	stop,
}: {
	client: Redis;
	key: RedisKey;
	start: number;
	stop: number;
}) => client.zrange(key, start, stop);

export const zRangeWithScoresAsync = async ({
	client,
	key,
	start,
	stop,
}: {
	client: Redis;
	key: RedisKey;
	start: number;
	stop: number;
}) => {
	const res = await client.zrange(key, start, stop, 'WITHSCORES');
	const len = res.length;
	const formattedRes: Array<{ member: string; score: string; rank: number }> = [];
	for (let i = 0; i < len; i += 2) {
		formattedRes.push({ member: res[i], score: res[i + 1], rank: start + Math.floor(i / 2) });
	}

	return formattedRes;
};

export const zRevRangeAsync = ({
	client,
	key,
	start,
	stop,
}: {
	client: Redis;
	key: RedisKey;
	start: number;
	stop: number;
}) => client.zrevrange(key, start, stop);

export const zRevRangeWithScoresAsync = async ({
	client,
	key,
	start,
	stop,
}: {
	client: Redis;
	key: RedisKey;
	start: number;
	stop: number;
}) => {
	const res = await client.zrevrange(key, start, stop, 'WITHSCORES');
	const len = res.length;
	const formattedRes: Array<{ member: string; score: string; rank: number }> = [];
	for (let i = 0; i < len; i += 2) {
		formattedRes.push({ member: res[i], score: res[i + 1], rank: start + Math.floor(i / 2) });
	}

	return formattedRes;
};

export const zRankAsync = ({ client, key, member }: { client: Redis; key: RedisKey; member: string }) =>
	client.zrank(key, member);

export const zRevRankAsync = ({ client, key, member }: { client: Redis; key: RedisKey; member: string }) =>
	client.zrevrank(key, member);

export const zScoreAsync = ({ client, key, member }: { client: Redis; key: RedisKey; member: string }) =>
	client.zscore(key, member);

export const zRemAsync = ({ client, key, member }: { client: Redis; key: RedisKey; member: string }) =>
	client.zrem(key, member);

export const zCardAsync = ({ client, key }: { client: Redis; key: RedisKey }) => client.zcard(key);

export { Redis };
