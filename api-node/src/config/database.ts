import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

// Mongoose Configuration
const mongooseOptions: mongoose.ConnectOptions = {
  autoIndex: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
};

// Connect to MongoDB
export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.MONGODB_URI, mongooseOptions);
    logger.info("Successfully connected to MongoDB");
  } catch (error) {
    logger.error({ error }, "Error connecting to MongoDB");
    throw error;
  }
}

// Log connection events
mongoose.connection.on("connected", () => {
  logger.info("Mongoose connected to DB");
});

mongoose.connection.on("error", (err: any) => {
  logger.error({ err }, "Mongoose connection error");
});

mongoose.connection.on("disconnected", () => {
  logger.info("Mongoose disconnected");
});

// Health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // 1 = connected, 2 = connecting, 3 = disconnecting, 0 = disconnected
    return mongoose.connection.readyState === 1;
  } catch (error) {
    logger.error({ error }, "Database health check failed");
    return false;
  }
}

// Graceful shutdown
export async function closeDatabasePool(): Promise<void> {
  await mongoose.connection.close();
  logger.info("Database connection closed");
}

// Export the connection for use elsewhere if needed
export const connection = mongoose.connection;
