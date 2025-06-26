/**
 * AWS Lambda handler for Next.js application
 * This is an example of how to integrate Next.js with Lambda
 * 
 * Install required dependencies:
 * npm install @vendia/serverless-express
 */

const { createServer, proxy } = require('@vendia/serverless-express');
const next = require('next');

// Initialize Next.js app
const app = next({
  dev: false,
  conf: {
    // Next.js configuration for Lambda
    experimental: {
      outputStandalone: true,
    },
    // Disable image optimization for Lambda
    images: {
      unoptimized: true,
    },
    // Configure for serverless
    trailingSlash: false,
    output: 'standalone',
  },
});

const nextHandler = app.getRequestHandler();

let server;

exports.handler = async (event, context) => {
  // Initialize server on cold start
  if (!server) {
    await app.prepare();
    
    server = createServer(async (req, res) => {
      // Handle static assets
      if (req.url?.startsWith('/_next/static/') || req.url?.startsWith('/static/')) {
        // Redirect to S3 bucket
        const bucketUrl = `https://${process.env.STATIC_BUCKET}.s3.amazonaws.com${req.url}`;
        res.writeHead(302, { 
          Location: bucketUrl,
          'Cache-Control': 'public, max-age=31536000, immutable'
        });
        return res.end();
      }
      
      // Handle favicon and other static files
      if (req.url?.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/)) {
        const bucketUrl = `https://${process.env.STATIC_BUCKET}.s3.amazonaws.com${req.url}`;
        res.writeHead(302, { 
          Location: bucketUrl,
          'Cache-Control': 'public, max-age=86400'
        });
        return res.end();
      }
      
      // Handle Next.js routing
      return nextHandler(req, res);
    });
  }

  // Proxy the request through serverless-express
  return proxy(server, event, context, 'PROMISE').promise;
};

// Example of how to optimize for Lambda
exports.optimizedHandler = async (event, context) => {
  // Set context to not wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    const result = await exports.handler(event, context);
    return result;
  } catch (error) {
    console.error('Lambda handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      }),
    };
  }
};
