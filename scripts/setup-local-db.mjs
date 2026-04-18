import 'dotenv/config'

import pg from 'pg'

const { Pool } = pg

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is missing.')
}

const pool = new Pool({ connectionString })

const statements = [
  `DO $$ BEGIN
     CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'CUSTOMER');
   EXCEPTION
     WHEN duplicate_object THEN null;
   END $$;`,
  `DO $$ BEGIN
     CREATE TYPE "MachineType" AS ENUM ('PS5');
   EXCEPTION
     WHEN duplicate_object THEN null;
   END $$;`,
  `DO $$ BEGIN
     CREATE TYPE "MachineStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'IN_USE', 'MAINTENANCE');
   EXCEPTION
     WHEN duplicate_object THEN null;
   END $$;`,
  `DO $$ BEGIN
     CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
   EXCEPTION
     WHEN duplicate_object THEN null;
   END $$;`,
  `DO $$ BEGIN
     CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
   EXCEPTION
     WHEN duplicate_object THEN null;
   END $$;`,
  `DO $$ BEGIN
     CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
   EXCEPTION
     WHEN duplicate_object THEN null;
   END $$;`,
  `CREATE TABLE IF NOT EXISTS "User" (
     id TEXT PRIMARY KEY,
     email TEXT NOT NULL UNIQUE,
     role "UserRole" NOT NULL DEFAULT 'CUSTOMER',
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE TABLE IF NOT EXISTS "Customer" (
     id TEXT PRIMARY KEY,
     "userId" TEXT UNIQUE,
     name TEXT NOT NULL,
     email TEXT UNIQUE,
     "phoneNumber" TEXT,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE
   );`,
  `CREATE TABLE IF NOT EXISTS "Machine" (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL UNIQUE,
     type "MachineType" NOT NULL DEFAULT 'PS5',
     status "MachineStatus" NOT NULL DEFAULT 'AVAILABLE',
     "hourlyRate" DECIMAL(10,2) NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE TABLE IF NOT EXISTS "Booking" (
     id TEXT PRIMARY KEY,
     "machineId" TEXT NOT NULL,
     "customerId" TEXT NOT NULL,
     status "BookingStatus" NOT NULL DEFAULT 'PENDING',
     "startTime" TIMESTAMP(3) NOT NULL,
     "endTime" TIMESTAMP(3) NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "Booking_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
     CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"(id) ON DELETE RESTRICT ON UPDATE CASCADE
   );`,
  `CREATE TABLE IF NOT EXISTS "BookingPayment" (
     id TEXT PRIMARY KEY,
     "bookingId" TEXT NOT NULL UNIQUE,
     amount DECIMAL(10,2) NOT NULL,
     currency TEXT NOT NULL DEFAULT 'INR',
     status "PaymentStatus" NOT NULL DEFAULT 'PENDING',
     provider TEXT NOT NULL DEFAULT 'MOCK_RAZORPAY',
     "providerOrderId" TEXT NOT NULL UNIQUE,
     "providerPaymentId" TEXT,
     "providerSignature" TEXT,
     "rawPayload" JSONB,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "BookingPayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"(id) ON DELETE CASCADE ON UPDATE CASCADE
   );`,
  `CREATE TABLE IF NOT EXISTS "Session" (
     id TEXT PRIMARY KEY,
     "machineId" TEXT NOT NULL,
     "customerId" TEXT NOT NULL,
     status "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
     "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "endTime" TIMESTAMP(3),
     "durationMinutes" INTEGER,
     "hourlyRate" DECIMAL(10,2) NOT NULL,
     "totalAmount" DECIMAL(10,2),
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "Session_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
     CONSTRAINT "Session_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"(id) ON DELETE RESTRICT ON UPDATE CASCADE
   );`,
  `CREATE TABLE IF NOT EXISTS "Invoice" (
     id TEXT PRIMARY KEY,
     "sessionId" TEXT NOT NULL UNIQUE,
     "totalAmount" DECIMAL(10,2) NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "Invoice_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"(id) ON DELETE RESTRICT ON UPDATE CASCADE
   );`,
  `CREATE TABLE IF NOT EXISTS "Payment" (
     id TEXT PRIMARY KEY,
     "invoiceId" TEXT NOT NULL UNIQUE,
     amount DECIMAL(10,2) NOT NULL,
     status "PaymentStatus" NOT NULL DEFAULT 'PENDING',
     provider TEXT,
     "providerReference" TEXT,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"(id) ON DELETE RESTRICT ON UPDATE CASCADE
   );`,
  `CREATE TABLE IF NOT EXISTS "FoodItem" (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     price DECIMAL(10,2) NOT NULL,
     "imageUrl" TEXT,
     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `ALTER TABLE "FoodItem" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;`,
  `CREATE TABLE IF NOT EXISTS "FoodOrder" (
     id TEXT PRIMARY KEY,
     "sessionId" TEXT NOT NULL,
     "totalPrice" DECIMAL(10,2) NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "FoodOrder_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"(id) ON DELETE RESTRICT ON UPDATE CASCADE
   );`,
  `CREATE TABLE IF NOT EXISTS "FoodOrderItem" (
     id TEXT PRIMARY KEY,
     "foodOrderId" TEXT NOT NULL,
     "foodItemId" TEXT NOT NULL,
     quantity INTEGER NOT NULL,
     CONSTRAINT "FoodOrderItem_foodOrderId_fkey" FOREIGN KEY ("foodOrderId") REFERENCES "FoodOrder"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
     CONSTRAINT "FoodOrderItem_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"(id) ON DELETE RESTRICT ON UPDATE CASCADE
   );`,
  `CREATE TABLE IF NOT EXISTS "CustomerFoodOrder" (
     id TEXT PRIMARY KEY,
     "customerName" TEXT NOT NULL,
     "phoneNumber" TEXT NOT NULL,
     note TEXT,
     status TEXT NOT NULL DEFAULT 'PENDING',
     "totalPrice" DECIMAL(10,2) NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE TABLE IF NOT EXISTS "CustomerFoodOrderItem" (
     id TEXT PRIMARY KEY,
     "orderId" TEXT NOT NULL,
     "foodItemId" TEXT NOT NULL,
     quantity INTEGER NOT NULL,
     "unitPrice" DECIMAL(10,2) NOT NULL,
     CONSTRAINT "CustomerFoodOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CustomerFoodOrder"(id) ON DELETE CASCADE ON UPDATE CASCADE,
     CONSTRAINT "CustomerFoodOrderItem_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"(id) ON DELETE RESTRICT ON UPDATE CASCADE
   );`,
  `CREATE TABLE IF NOT EXISTS "CustomerCredential" (
     id TEXT PRIMARY KEY,
     "customerId" TEXT NOT NULL UNIQUE,
     "passwordHash" TEXT NOT NULL,
     salt TEXT NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "CustomerCredential_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"(id) ON DELETE CASCADE ON UPDATE CASCADE
   );`,
  `CREATE TABLE IF NOT EXISTS "AdminProfile" (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     "imageUrl" TEXT,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE TABLE IF NOT EXISTS "StaffActionLog" (
     id TEXT PRIMARY KEY,
     "staffId" TEXT NOT NULL,
     action TEXT NOT NULL,
     details TEXT,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "StaffActionLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE
   );`,
  `CREATE INDEX IF NOT EXISTS "Customer_phoneNumber_idx" ON "Customer"("phoneNumber");`,
  `CREATE INDEX IF NOT EXISTS "Booking_machineId_startTime_endTime_idx" ON "Booking"("machineId", "startTime", "endTime");`,
  `CREATE INDEX IF NOT EXISTS "Booking_customerId_createdAt_idx" ON "Booking"("customerId", "createdAt");`,
  `CREATE INDEX IF NOT EXISTS "BookingPayment_status_createdAt_idx" ON "BookingPayment"(status, "createdAt");`,
  `CREATE INDEX IF NOT EXISTS "Session_machineId_status_idx" ON "Session"("machineId", status);`,
  `CREATE INDEX IF NOT EXISTS "Session_customerId_status_idx" ON "Session"("customerId", status);`,
  `CREATE INDEX IF NOT EXISTS "CustomerFoodOrder_createdAt_idx" ON "CustomerFoodOrder"("createdAt");`,
  `CREATE INDEX IF NOT EXISTS "CustomerCredential_customerId_idx" ON "CustomerCredential"("customerId");`,
  `INSERT INTO "AdminProfile" (id, name, "imageUrl")
   VALUES ('default', 'Admin', null)
   ON CONFLICT (id) DO NOTHING;`,
  `INSERT INTO "Machine" (id, name, type, status, "hourlyRate")
   VALUES
     ('machine_ps5_1', 'PS5 Station 1', 'PS5', 'AVAILABLE', 150.00),
     ('machine_ps5_2', 'PS5 Station 2', 'PS5', 'AVAILABLE', 150.00)
   ON CONFLICT (name) DO UPDATE SET
     "hourlyRate" = EXCLUDED."hourlyRate",
     "updatedAt" = CURRENT_TIMESTAMP;`,
]

try {
  const client = await pool.connect()

  try {
    for (const statement of statements) {
      await client.query(statement)
    }
  } finally {
    client.release()
  }

  console.log('Local database schema is ready.')
} finally {
  await pool.end()
}
