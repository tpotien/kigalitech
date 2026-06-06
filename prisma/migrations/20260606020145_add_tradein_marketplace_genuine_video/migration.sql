-- CreateTable
CREATE TABLE "TradeIn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT '',
    "condition" TEXT NOT NULL DEFAULT 'good',
    "description" TEXT NOT NULL DEFAULT '',
    "images" TEXT NOT NULL DEFAULT '[]',
    "askingPrice" INTEGER NOT NULL DEFAULT 0,
    "offeredPrice" INTEGER NOT NULL DEFAULT 0,
    "finalPrice" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT NOT NULL DEFAULT '',
    "orderId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TradeIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketplaceListing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sellerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'good',
    "images" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT NOT NULL DEFAULT '',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "phone" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketplaceListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "couponCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "receiptUrl" TEXT,
    "adminConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "billPrintable" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT,
    "shippingName" TEXT,
    "shippingEmail" TEXT,
    "shippingPhone" TEXT,
    "shippingAddress" TEXT,
    "notes" TEXT,
    "userId" INTEGER,
    "installmentPlan" TEXT NOT NULL DEFAULT '',
    "installmentMonths" INTEGER NOT NULL DEFAULT 0,
    "tvInstallation" BOOLEAN NOT NULL DEFAULT false,
    "tvInstallAddress" TEXT NOT NULL DEFAULT '',
    "mpostAddress" TEXT NOT NULL DEFAULT '',
    "deliveryStatus" TEXT NOT NULL DEFAULT '',
    "deliveryTracking" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "tradeInId" INTEGER,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("adminConfirmed", "billPrintable", "couponCode", "createdAt", "discountAmount", "id", "notes", "paymentConfirmed", "paymentMethod", "receiptUrl", "shippingAddress", "shippingEmail", "shippingName", "shippingPhone", "status", "total", "userId") SELECT "adminConfirmed", "billPrintable", "couponCode", "createdAt", "discountAmount", "id", "notes", "paymentConfirmed", "paymentMethod", "receiptUrl", "shippingAddress", "shippingEmail", "shippingName", "shippingPhone", "status", "total", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
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
    "tags" TEXT NOT NULL DEFAULT '[]',
    "genuine" BOOLEAN NOT NULL DEFAULT true,
    "videoUrl" TEXT NOT NULL DEFAULT '',
    "hasTvInstall" BOOLEAN NOT NULL DEFAULT false,
    "condition" TEXT NOT NULL DEFAULT 'new'
);
INSERT INTO "new_Product" ("active", "brand", "category", "colorStock", "colors", "comparePrice", "description", "dimensions", "featured", "id", "images", "lowStockThreshold", "name", "price", "serialNumbers", "sku", "specs", "stock", "storageOptions", "storageStock", "subcategory", "tags", "warrantyOptions", "weight") SELECT "active", "brand", "category", "colorStock", "colors", "comparePrice", "description", "dimensions", "featured", "id", "images", "lowStockThreshold", "name", "price", "serialNumbers", "sku", "specs", "stock", "storageOptions", "storageStock", "subcategory", "tags", "warrantyOptions", "weight" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
