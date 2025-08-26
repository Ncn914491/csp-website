const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function uploadCareerGuidanceViaAPI() {
  try {
    console.log('🔐 Logging in as admin...');
    
    // First, login as admin to get token
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@csp.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      // Try alternative login
      const altLoginResponse = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });
      
      if (!altLoginResponse.ok) {
        throw new Error('Failed to login as admin. Please ensure admin user exists.');
      }
      
      const altLoginData = await altLoginResponse.json();
      var token = altLoginData.token;
    } else {
      const loginData = await loginResponse.json();
      var token = loginData.token;
    }

    console.log('✅ Admin login successful');

    // Check if career guidance (week 0) already exists
    console.log('🔍 Checking for existing career guidance...');
    const existingResponse = await fetch('http://localhost:5000/api/gridfs-weeks');
    const existingWeeks = await existingResponse.json();
    const careerGuidance = existingWeeks.find(w => w.weekNumber === 0);
    
    if (careerGuidance) {
      console.log('⚠️ Career guidance already exists, deleting...');
      const deleteResponse = await fetch(`http://localhost:5000/api/gridfs-weeks/${careerGuidance._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Old career guidance deleted');
      } else {
        console.log('⚠️ Could not delete old career guidance, continuing...');
      }
    }

    // Prepare form data for file upload
    console.log('📤 Uploading csp.pptx...');
    const form = new FormData();
    
    // Add the PowerPoint file
    const filePath = path.join(__dirname, 'public/csp/csp.pptx');
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    form.append('reportPdf', fs.createReadStream(filePath));
    form.append('weekNumber', '0');
    form.append('summary', 'Career Guidance Resources - Comprehensive PowerPoint presentation with career paths, opportunities, and guidance for students.');
    
    // Create a dummy 1x1 pixel image for photos requirement
    const dummyImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8E, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    form.append('photos', dummyImageBuffer, {
      filename: 'placeholder.png',
      contentType: 'image/png'
    });

    // Upload the career guidance
    const uploadResponse = await fetch('http://localhost:5000/api/gridfs-weeks/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Career guidance uploaded successfully!');
    console.log('📋 Result:', uploadResult);

  } catch (error) {
    console.error('❌ Error uploading career guidance:', error.message);
  }
}

uploadCareerGuidanceViaAPI();