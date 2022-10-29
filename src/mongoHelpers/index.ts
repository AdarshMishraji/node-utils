import mongoose, { ClientSession, startSession } from 'mongoose';

const connectToMongoDB = ({ dbUri }: { dbUri: string }) => mongoose.connect(dbUri);

export const createOrReturnDBConnection = ({ dbUri }: { dbUri: string }): Promise<mongoose.Connection> => {
	let db = mongoose.connection;

	return new Promise((resolve, reject) => {
		if (db.readyState) return resolve(db);

		connectToMongoDB({ dbUri }).catch(() => {
			throw new Error('Failed to connect to MongoDB');
		});

		mongoose.Promise = global.Promise;
		// Get the default connection
		db = mongoose.connection;

		db.once('open', () => {
			console.log('Connected to mongoose ');
			resolve(db);
		});

		db.on('connected', () => {
			console.log('Mongoose connected');
			resolve(db);
		});

		db.on('reconnected', () => {
			console.log('Mongoose reconnected');
			resolve(db);
		});

		db.on('disconnected', (err) => {
			console.log('Mongoose default connection is disconnected');
			connectToMongoDB({ dbUri }).catch(() => {
				throw new Error('Failed to connect to MongoDB');
			});
			reject(err);
		});

		// Bind connection to error event (to get notification of connection errors)
		db.on('error', async (error) => {
			console.log({ error });
			await mongoose.disconnect();
		});

		process.on('SIGINT', () => {
			db.close(() => {
				console.log('Mongoose default connection is disconnected due to application termination');
				process.exit(0);
			});
		});
	});
};

/** @param transaction (params: { session: ClientSession }) => Promise<T>
 * @note db and models used in the transactions must be created before the transaction starts.
 */
export const createSessionTransaction = async <T>(transaction: (session: ClientSession) => Promise<T>) => {
	const session = await startSession();
	try {
		let dataReturned;
		await session.withTransaction(async (_) => {
			dataReturned = await transaction(_);
		});
		await session.endSession();
		return dataReturned as T;
	} catch (error) {
		await session.abortTransaction();
		await session.endSession();
		throw error;
	}
};

export const MongoObjectId = (id: string | mongoose.Types.ObjectId | undefined, ifNotValidIdGenerateNew = false) => {
	if (id && mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
	if (ifNotValidIdGenerateNew) return new mongoose.Types.ObjectId();
	return undefined;
};

export { mongoose };
