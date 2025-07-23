#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏗️  Building Lambda deployment package...');

// Clean up previous builds
if (fs.existsSync('lambda-package')) {
  fs.rmSync('lambda-package', { recursive: true });
}
if (fs.existsSync('lambda-deployment.zip')) {
  fs.unlinkSync('lambda-deployment.zip');
}

// Create lambda-package directory
fs.mkdirSync('lambda-package', { recursive: true });

// Copy standalone build
if (fs.existsSync('.next/standalone')) {
  console.log('📦 Copying standalone build...');
  execSync('cp -r .next/standalone/* lambda-package/', { stdio: 'inherit' });
}

// Copy static assets
if (fs.existsSync('.next/static')) {
  console.log('📦 Copying static assets...');
  fs.mkdirSync('lambda-package/.next', { recursive: true });
  execSync('cp -r .next/static lambda-package/.next/static', { stdio: 'inherit' });
}

// Copy public assets
if (fs.existsSync('public')) {
  console.log('📦 Copying public assets...');
  execSync('cp -r public lambda-package/public', { stdio: 'inherit' });
}

// Copy Lambda handler
const handlerFile = fs.existsSync('deploy/lambda-handler-optimized.js') 
  ? 'deploy/lambda-handler-optimized.js' 
  : 'deploy/lambda-handler.js';

if (fs.existsSync(handlerFile)) {
  console.log(`📦 Copying ${handlerFile}...`);
  fs.copyFileSync(handlerFile, 'lambda-package/lambda-handler.js');
} else {
  console.log('⚠️  No Lambda handler found, creating basic one...');
  
  const basicHandler = `const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const app = next({ dev: false });
const handle = app.getRequestHandler();

let serverPromise;

const getServer = () => {
  if (!serverPromise) {
    serverPromise = app.prepare().then(() => {
      return createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      });
    });
  }
  return serverPromise;
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  const server = await getServer();
  const { path, httpMethod, headers, queryStringParameters, body } = event;
  
  const url = path + (queryStringParameters ? 
    '?' + new URLSearchParams(queryStringParameters).toString() : '');
  
  return new Promise((resolve) => {
    const req = { url, method: httpMethod, headers: headers || {} };
    const res = {
      statusCode: 200,
      headers: {},
      body: '',
      writeHead: function(statusCode, headers) {
        this.statusCode = statusCode;
        if (headers) Object.assign(this.headers, headers);
      },
      setHeader: function(name, value) {
        this.headers[name] = value;
      },
      write: function(chunk) {
        this.body += chunk;
      },
      end: function(chunk) {
        if (chunk) this.body += chunk;
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: this.body,
        });
      }
    };
    
    handle(req, res);
  });
};`;
  
  fs.writeFileSync('lambda-package/lambda-handler.js', basicHandler);
}

// Copy package.json and install production dependencies
if (fs.existsSync('package.json')) {
  console.log('📦 Installing production dependencies...');
  fs.copyFileSync('package.json', 'lambda-package/package.json');
  
  if (fs.existsSync('package-lock.json')) {
    fs.copyFileSync('package-lock.json', 'lambda-package/package-lock.json');
  }
  
  // Install only production dependencies
  execSync('cd lambda-package && npm ci --production --silent', { stdio: 'inherit' });
}

// Create deployment zip
console.log('📦 Creating deployment package...');
execSync('cd lambda-package && zip -r ../lambda-deployment.zip . -q', { stdio: 'inherit' });

// Get package size
const stats = fs.statSync('lambda-deployment.zip');
const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log(`✅ Lambda package created: lambda-deployment.zip (${fileSizeInMB} MB)`);

// Warn if package is too large
if (stats.size > 50 * 1024 * 1024) { // 50MB
  console.log('⚠️  Package is larger than 50MB, consider optimizing dependencies');
}

console.log('🎉 Build complete!');
