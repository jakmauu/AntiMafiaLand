-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'FROZEN', 'EXECUTED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT,
    "email" TEXT,
    "displayName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Land" (
    "id" TEXT NOT NULL,
    "onChainLandId" BIGINT NOT NULL,
    "currentOwner" TEXT NOT NULL,
    "metadataURI" TEXT NOT NULL,
    "listedPrice" DECIMAL(18,2),
    "mintedTxHash" TEXT,
    "lastTransferAt" TIMESTAMP(3),
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Land_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferRequest" (
    "id" TEXT NOT NULL,
    "landId" TEXT NOT NULL,
    "requesterUserId" TEXT,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "riskScore" INTEGER,
    "riskLevel" "RiskLevel",
    "aiSuggestedState" "TransferStatus",
    "requestTxHash" TEXT,
    "validateTxHash" TEXT,
    "approveTxHash" TEXT,
    "executeTxHash" TEXT,
    "freezeTxHash" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "transferRequestId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'internal',
    "model" TEXT,
    "score" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "suggestedAction" "TransferStatus" NOT NULL,
    "features" JSONB,
    "rawOutput" JSONB,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "transferRequestId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "summary" TEXT,
    "txHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Land_onChainLandId_key" ON "Land"("onChainLandId");

-- CreateIndex
CREATE INDEX "Land_currentOwner_idx" ON "Land"("currentOwner");

-- CreateIndex
CREATE INDEX "Land_createdAt_idx" ON "Land"("createdAt");

-- CreateIndex
CREATE INDEX "TransferRequest_landId_createdAt_idx" ON "TransferRequest"("landId", "createdAt");

-- CreateIndex
CREATE INDEX "TransferRequest_status_createdAt_idx" ON "TransferRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "RiskAssessment_transferRequestId_createdAt_idx" ON "RiskAssessment"("transferRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Land" ADD CONSTRAINT "Land_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_transferRequestId_fkey" FOREIGN KEY ("transferRequestId") REFERENCES "TransferRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_transferRequestId_fkey" FOREIGN KEY ("transferRequestId") REFERENCES "TransferRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
