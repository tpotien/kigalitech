-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT NOT NULL DEFAULT '',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "phoneNumber" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "notificationPrefs" TEXT NOT NULL DEFAULT '{"email":true,"sms":false,"whatsapp":false}'
);
INSERT INTO "new_User" ("email", "emailVerified", "id", "image", "name", "role") SELECT "email", "emailVerified", "id", "image", "name", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "comparePrice" INTEGER,
    "images" TEXT NOT NULL DEFAULT '[]',
    "colors" TEXT NOT NULL DEFAULT '[]',
    "storageOptions" TEXT NOT NULL DEFAULT '[]',
    "warrantyOptions" TEXT NOT NULL DEFAULT '[]',
    "specs" TEXT NOT NULL DEFAULT '{}',
    "stock" INTEGER NOT NULL,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "serialNumbers" TEXT NOT NULL DEFAULT '[]',
    "colorStock" TEXT NOT NULL DEFAULT '{}',
    "storageStock" TEXT NOT NULL DEFAULT '{}',
    "subcategory" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "brand" TEXT,
    "sku" TEXT,
    "weight" TEXT,
    "dimensions" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]'
);
INSERT INTO "new_Product" ("active", "brand", "category", "colors", "comparePrice", "description", "dimensions", "featured", "id", "images", "lowStockThreshold", "name", "price", "serialNumbers", "sku", "specs", "stock", "storageOptions", "tags", "warrantyOptions", "weight") SELECT "active", "brand", "category", "colors", "comparePrice", "description", "dimensions", "featured", "id", "images", "lowStockThreshold", "name", "price", "serialNumbers", "sku", "specs", "stock", "storageOptions", "tags", "warrantyOptions", "weight" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE TABLE "new_RepairTicket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "orderId" INTEGER,
    "productName" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "adminNotes" TEXT NOT NULL DEFAULT '',
    "contactMethod" TEXT NOT NULL DEFAULT 'whatsapp',
    "preferredTime" TEXT NOT NULL DEFAULT '',
    "techPhone" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RepairTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RepairTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RepairTicket" ("adminNotes", "createdAt", "description", "id", "issue", "orderId", "priority", "productName", "status", "updatedAt", "userId") SELECT "adminNotes", "createdAt", "description", "id", "issue", "orderId", "priority", "productName", "status", "updatedAt", "userId" FROM "RepairTicket";
DROP TABLE "RepairTicket";
ALTER TABLE "new_RepairTicket" RENAME TO "RepairTicket";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "SiteConfig_key_key" ON "SiteConfig"("key");
