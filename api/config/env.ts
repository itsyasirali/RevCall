import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const MONGO_URI = process.env.MONGO_URI || process.env.MongoDB || 'mongodb://localhost:27017/calling-agent';

export const TURN_SERVER_URL = process.env.TURN_SERVER_URL || process.env.EXPO_PUBLIC_TURN_SERVER_URL;
export const TURN_SERVER_URL_TCP = process.env.TURN_SERVER_URL_TCP || process.env.EXPO_PUBLIC_TURN_SERVER_URL_TCP;
export const TURN_USERNAME = process.env.TURN_USERNAME || process.env.EXPO_PUBLIC_TURN_USERNAME;
export const TURN_CREDENTIAL = process.env.TURN_CREDENTIAL || process.env.EXPO_PUBLIC_TURN_CREDENTIAL;
