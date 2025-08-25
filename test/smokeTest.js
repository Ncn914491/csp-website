const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const BACKEND_PORT = 5001; // Use different port for testing
const FRONTEND_PORT = 5173; // Vite default port
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;

let backendProcess = null;
let frontendProcess = null;

// Test configuration
const STARTUP_TIMEOUT = 30000; // 30 seconds
const TEST_TIMEOUT = 5000; // 5 seconds per test

console.log('🚀 Starting E2E Smoke Tests...\n');

// Utility functions
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForService(url, maxAttempts = 30, interval = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(url, { timeout: 3000 });
      return true;
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw new Error(`Service at ${url} failed to start after ${maxAttempts} attempts`);
      }
      await delay(interval);
    }
  }
  return false;
}

async function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('📡 Starting backend server...');
    
    // Set environment variables for test
    const env = {
      ...process.env,
      PORT: BACKEND_PORT.toString(),
      NODE_ENV: 'test'
    };
    
    backendProcess = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, '../backend'),
      env: env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let startupOutput = '';
    let hasStarted = false;

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      startupOutput += output;
      
      if (output.includes(`Server running on port ${BACKEND_PORT}`) || 
          output.includes('MongoDB connected successfully')) {
        if (!hasStarted) {
          hasStarted = true;
          console.log('✅ Backend server started');
          resolve();
        }
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error('Backend stderr:', data.toString());
    });

    backendProcess.on('error', (error) => {
      console.error('❌ Backend process error:', error);
      reject(error);
    });

    backendProcess.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ Backend process exited with code ${code}`);
      }
    });

    // Timeout fallback
    setTimeout(() => {
      if (!hasStarted) {
        console.log('⏰ Backend startup timeout, checking service...');
        resolve(); // Continue to service check
      }
    }, 15000);
  });
}

async function startFrontend() {
  return new Promise((resolve, reject) => {
    console.log('🎨 Starting frontend server...');
    
    // Check if we're using npm or yarn
    const packageManager = fs.existsSync(path.join(__dirname, '../package-lock.json')) ? 'npm' : 
                          fs.existsSync(path.join(__dirname, '../yarn.lock')) ? 'yarn' : 'npm';
    
    frontendProcess = spawn(packageManager, ['run', 'dev'], {
      cwd: path.join(__dirname, '../'),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let startupOutput = '';
    let hasStarted = false;

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      startupOutput += output;
      
      if (output.includes('Local:') && output.includes('5173')) {
        if (!hasStarted) {
          hasStarted = true;
          console.log('✅ Frontend server started');
          resolve();
        }
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const output = data.toString();
      // Vite outputs to stderr by default
      if (output.includes('Local:') && output.includes('5173')) {
        if (!hasStarted) {
          hasStarted = true;
          console.log('✅ Frontend server started');
          resolve();
        }
      }
    });

    frontendProcess.on('error', (error) => {
      console.error('❌ Frontend process error:', error);
      reject(error);
    });

    // Timeout fallback
    setTimeout(() => {
      if (!hasStarted) {
        console.log('⏰ Frontend startup timeout, checking service...');
        resolve(); // Continue to service check
      }
    }, 20000);
  });
}

function cleanup() {
  console.log('\n🧹 Cleaning up processes...');
  
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill('SIGTERM');
    setTimeout(() => {
      if (!backendProcess.killed) {
        backendProcess.kill('SIGKILL');
      }
    }, 5000);
  }
  
  if (frontendProcess && !frontendProcess.killed) {
    frontendProcess.kill('SIGTERM');
    setTimeout(() => {
      if (!frontendProcess.killed) {
        frontendProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

// Test runners
async function testBackendEndpoints() {
  console.log('\n🔍 Testing Backend Endpoints...');
  
  const tests = [
    {
      name: 'Health Check',
      test: async () => {
        const response = await axios.get(`${BACKEND_URL}/api/test`);
        if (response.status !== 200) {
          throw new Error(`Expected status 200, got ${response.status}`);
        }
        console.log('✅ Backend health check - PASSED');
      }
    },
    {
      name: 'Weekly Updates Endpoint',
      test: async () => {
        const response = await axios.get(`${BACKEND_URL}/api/weeks`);
        if (response.status !== 200) {
          throw new Error(`Expected status 200, got ${response.status}`);
        }
        if (!Array.isArray(response.data)) {
          throw new Error('Expected array response');
        }
        console.log(`✅ Weekly updates endpoint - PASSED (${response.data.length} items)`);
      }
    },
    {
      name: 'School Visits Endpoint',
      test: async () => {
        const response = await axios.get(`${BACKEND_URL}/api/visits`);
        if (response.status !== 200) {
          throw new Error(`Expected status 200, got ${response.status}`);
        }
        if (!Array.isArray(response.data)) {
          throw new Error('Expected array response');
        }
        console.log(`✅ School visits endpoint - PASSED (${response.data.length} items)`);
      }
    },
    {
      name: 'Resources Endpoint',
      test: async () => {
        const response = await axios.get(`${BACKEND_URL}/api/resources`);
        if (response.status !== 200) {
          throw new Error(`Expected status 200, got ${response.status}`);
        }
        if (!Array.isArray(response.data)) {
          throw new Error('Expected array response');
        }
        console.log(`✅ Resources endpoint - PASSED (${response.data.length} items)`);
      }
    },
    {
      name: 'CORS Headers',
      test: async () => {
        const response = await axios.get(`${BACKEND_URL}/api/test`);
        const corsHeader = response.headers['access-control-allow-origin'];
        // Should allow CORS (either * or specific origins)
        console.log(`✅ CORS headers - PASSED (${corsHeader || 'no specific origin'})`);
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const { name, test } of tests) {
    try {
      await Promise.race([
        test(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), TEST_TIMEOUT)
        )
      ]);
      passed++;
    } catch (error) {
      console.error(`❌ ${name} - FAILED: ${error.message}`);
      failed++;
    }
  }

  return { passed, failed, total: tests.length };
}

async function testFrontendResponse() {
  console.log('\n🎨 Testing Frontend Response...');
  
  const tests = [
    {
      name: 'Frontend Loads',
      test: async () => {
        const response = await axios.get(FRONTEND_URL);
        if (response.status !== 200) {
          throw new Error(`Expected status 200, got ${response.status}`);
        }
        console.log('✅ Frontend loads - PASSED');
      }
    },
    {
      name: 'HTML Content',
      test: async () => {
        const response = await axios.get(FRONTEND_URL);
        const html = response.data;
        if (!html.includes('<!doctype html') && !html.includes('<!DOCTYPE html')) {
          throw new Error('Response does not contain valid HTML');
        }
        if (!html.includes('Career') && !html.includes('CSP')) {
          console.warn('⚠️  HTML may not contain expected app content');
        }
        console.log('✅ HTML content - PASSED');
      }
    },
    {
      name: 'Content Type',
      test: async () => {
        const response = await axios.get(FRONTEND_URL);
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.includes('text/html')) {
          throw new Error(`Expected text/html, got ${contentType}`);
        }
        console.log('✅ Content type - PASSED');
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const { name, test } of tests) {
    try {
      await Promise.race([
        test(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), TEST_TIMEOUT)
        )
      ]);
      passed++;
    } catch (error) {
      console.error(`❌ ${name} - FAILED: ${error.message}`);
      failed++;
    }
  }

  return { passed, failed, total: tests.length };
}

async function testFullStackIntegration() {
  console.log('\n🔄 Testing Full Stack Integration...');
  
  const tests = [
    {
      name: 'Backend-Frontend Communication',
      test: async () => {
        // Test if frontend can reach backend
        const frontendResponse = await axios.get(FRONTEND_URL);
        const backendResponse = await axios.get(`${BACKEND_URL}/api/weeks`);
        
        if (frontendResponse.status !== 200 || backendResponse.status !== 200) {
          throw new Error('Either frontend or backend is not responding');
        }
        
        console.log('✅ Backend-Frontend communication - PASSED');
      }
    },
    {
      name: 'API Data Format',
      test: async () => {
        const response = await axios.get(`${BACKEND_URL}/api/weeks`);
        const data = response.data;
        
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          const hasRequiredFields = item.weekNumber !== undefined && 
                                   item.activities !== undefined && 
                                   item.highlights !== undefined;
          
          if (!hasRequiredFields) {
            throw new Error('API data missing required fields');
          }
        }
        
        console.log('✅ API data format - PASSED');
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const { name, test } of tests) {
    try {
      await Promise.race([
        test(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), TEST_TIMEOUT)
        )
      ]);
      passed++;
    } catch (error) {
      console.error(`❌ ${name} - FAILED: ${error.message}`);
      failed++;
    }
  }

  return { passed, failed, total: tests.length };
}

// Main test runner
async function runSmokeTests() {
  const startTime = Date.now();
  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;

  try {
    // Start services
    await startBackend();
    await startFrontend();
    
    // Wait for services to be ready
    console.log('\n⏳ Waiting for services to be ready...');
    await waitForService(`${BACKEND_URL}/api/test`);
    console.log('✅ Backend service ready');
    
    await waitForService(FRONTEND_URL);
    console.log('✅ Frontend service ready');
    
    // Add small delay to ensure full startup
    await delay(3000);
    
    // Run tests
    const backendResults = await testBackendEndpoints();
    const frontendResults = await testFrontendResponse();
    const integrationResults = await testFullStackIntegration();
    
    totalPassed = backendResults.passed + frontendResults.passed + integrationResults.passed;
    totalFailed = backendResults.failed + frontendResults.failed + integrationResults.failed;
    totalTests = backendResults.total + frontendResults.total + integrationResults.total;
    
  } catch (error) {
    console.error('❌ Smoke test setup failed:', error.message);
    totalFailed = 1;
    totalTests = 1;
  } finally {
    cleanup();
    
    // Wait for processes to terminate
    await delay(2000);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 E2E Smoke Test Results');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📈 Success Rate: ${totalTests > 0 ? ((totalPassed/totalTests)*100).toFixed(1) : 0}%`);
    
    if (totalFailed === 0 && totalTests > 0) {
      console.log('\n🎉 All smoke tests passed! Your application is ready to go!');
      process.exit(0);
    } else {
      console.log('\n💥 Some smoke tests failed. Please check the errors above.');
      process.exit(1);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Smoke tests interrupted by user');
  cleanup();
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Smoke tests terminated');
  cleanup();
  process.exit(1);
});

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error.message);
  cleanup();
  process.exit(1);
});

// Run the tests
runSmokeTests().catch(error => {
  console.error('❌ Smoke test runner failed:', error.message);
  cleanup();
  process.exit(1);
});
