-- CreateTable
CREATE TABLE "Confirmations" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL,

    CONSTRAINT "Confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Confirmations_email_key" ON "Confirmations"("email");
