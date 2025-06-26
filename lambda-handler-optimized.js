/**
 * Optimized AWS Lambda handler for Next.js with cold start mitigation
 * 
 * Install dependencies:
 * npm install @vendia/serverless-express
 */

const { createServer, proxy } = require('@vendia/serverless-express');
const next = require('next');

// Global variables for reuse across Lambda invocations
let app;
let server;
let isAppReady = false;

// Optimize Next.js configuration for Lambda
const nextConfig = {
  dev: false,
  conf: {
    // Disable file system caching
    experimental: {
      outputStandalone: true,
      // Reduce bundle size
      optimizeCss: true,
      // Disable unnecessary features
      swcMinify: true,
    },
    // Optimize for serverless
    images: {
      unoptimized: true, // Disable image optimization
    },
    // Reduce bundle size
    webpack: (config, { isServer }) => {
      if (isServer) {
        // Exclude client-side only packages from server bundle
        config.externals.push('@swc/helpers');
      }
      return config;
    },
    // Disable telemetry
    telemetry: false,
  },
};

// Connection pooling for MongoDB
let mongoClient;
const connectToDatabase = async () => {
  if (mongoClient) {
    return mongoClient;
  }
  
  const { MongoClient } = require('mongodb');
  mongoClient = new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferMaxEntries: 0, // Disable mongoose buffering
    bufferCommands: false, // Disable mongoose buffering
  });
  
  await mongoClient.connect();
  return mongoClient;
};

// Pre-initialize during cold start
const initializeApp = async () => {
  if (!app) {
    console.log('Initializing Next.js app...');
    app = next(nextConfig);
    await app.prepare();
    
    // Pre-connect to database during cold start
    if (process.env.MONGODB_URI) {
      try {
        await connectToDatabase();
        console.log('Database connection established during cold start');
      } catch (error) {
        console.warn('Database connection failed during cold start:', error.message);
      }
    }
    
    isAppReady = true;
    console.log('Next.js app initialized');
  }
  return app;
};

// Create server with optimizations
const createOptimizedServer = async () => {
  if (!server) {
    const nextHandler = app.getRequestHandler();
    
    server = createServer(async (req, res) => {
      const startTime = Date.now();
      
      // Handle static assets redirect (no processing needed)
      if (req.url?.startsWith('/_next/static/') || req.url?.startsWith('/static/')) {
        const bucketUrl = `https://${process.env.STATIC_BUCKET}.s3.amazonaws.com${req.url}`;
        res.writeHead(302, { 
          Location: bucketUrl,
          'Cache-Control': 'public, max-age=31536000, immutable'
        });
        return res.end();
      }
      
      // Handle other static files
      if (req.url?.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/)) {
        const bucketUrl = `https://${process.env.STATIC_BUCKET}.s3.amazonaws.com${req.url}`;
        res.writeHead(302, { 
          Location: bucketUrl,
          'Cache-Control': 'public, max-age=86400'
        });
        return res.end();
      }
      
      // Add performance headers
      res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
      res.setHeader('X-Lambda-Type', process.env.LAMBDA_TYPE || 'single');
      
      // Handle Next.js routing
      return nextHandler(req, res);
    });
  }
  return server;
};

// Main Lambda handler with cold start optimization
exports.handler = async (event, context) => {
  // Optimize Lambda context
  context.callbackWaitsForEmptyEventLoop = false;
  
  const startTime = Date.now();
  const isColdStart = !isAppReady;
  
  console.log(`Lambda invocation - Cold start: ${isColdStart}`);
  
  try {
    // Initialize app if not already done
    if (!isAppReady) {
      await initializeApp();
    }
    
    // Create server if not already done
    if (!server) {
      await createOptimizedServer();
    }
    
    // Add cold start metrics to response
    const headers = {
      'X-Cold-Start': isColdStart.toString(),
      'X-Init-Time': `${Date.now() - startTime}ms`,
    };
    
    // Handle warm-up requests (from CloudWatch Events)
    if (event.source === 'aws.events' && event['detail-type'] === 'Lambda Warmer') {
      console.log('Warm-up request received');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Lambda warmed up successfully',
          coldStart: isColdStart,
          timestamp: new Date().toISOString()
        }),
      };
    }
    
    // Proxy the request
    const result = await proxy(server, event, context, 'PROMISE').promise;
    
    // Add performance headers to result
    if (result.headers) {
      Object.assign(result.headers, headers);
    } else {
      result.headers = headers;
    }
    
    return result;
    
  } catch (error) {
    console.error('Lambda handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Cold-Start': isColdStart.toString(),
        'X-Error': 'true',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        coldStart: isColdStart,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

// Warm-up function for CloudWatch Events
exports.warmer = async (event, context) => {
  console.log('Warmer function called');
  
  if (!isAppReady) {
    await initializeApp();
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Lambda warmed up',
      timestamp: new Date().toISOString(),
    }),
  };
};

// Health check function
exports.health = async (event, context) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    appReady: isAppReady,
    environment: process.env.NODE_ENV,
    memoryUsage: process.memoryUsage(),
  };
  
  // Test database connection
  if (process.env.MONGODB_URI) {
    try {
      const client = await connectToDatabase();
      await client.db().admin().ping();
      healthData.database = 'connected';
    } catch (error) {
      healthData.database = 'disconnected';
      healthData.databaseError = error.message;
    }
  }
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(healthData),
  };
};
