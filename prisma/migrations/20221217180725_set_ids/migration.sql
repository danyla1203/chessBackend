/*
  Warnings:

  - The primary key for the `UserInGame` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `UserInGame` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserInGame" DROP CONSTRAINT "UserInGame_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "UserInGame_pkey" PRIMARY KEY ("userId", "gameId");
