import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const connectionArgs = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

async function connect() {
  if (process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const mongoURI = mongod.getUri();
    mongoose.connect(mongoURI, connectionArgs);
  } else {
    mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
    mongoose.connection.once('open', () => {
      console.log('Mongo Connected!');
    });
    mongoose.connect(process.env.MONGO_URL, connectionArgs);

    await Promise.all(mongoose.modelNames().map(
      async (modelName) => mongoose.model(modelName).syncIndexes(),
    ));
  }
}

async function dropDatabase() {
  await mongoose.connection.dropDatabase();
}

async function close() {
  await mongoose.connection.close();
}

const mongo = { connect, close, dropDatabase };
export default mongo;
