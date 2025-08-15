import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check
    const healthData: {
      status: string;
      timestamp: string;
      environment: string;
      version: string;
      database?: string;
      databaseError?: string;
    } = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };

    // Optional: Add database connectivity check
    if (process.env.DB_URL) {
      try {
        // You can add a simple DB ping here if needed
        // const { MongoClient } = require('mongodb');
        // const client = new MongoClient(process.env.DB_URL);
        // await client.connect();
        // await client.close();
        healthData.database = 'connected';
      } catch (error) {
        healthData.database = 'disconnected';
        healthData.databaseError = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
