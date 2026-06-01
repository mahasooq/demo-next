-- CreateTable
CREATE TABLE "Geofence" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Geofence_pkey" PRIMARY KEY ("id")
);

-- Enable PostGIS for ST_Contains geofence queries
CREATE EXTENSION IF NOT EXISTS postgis;
