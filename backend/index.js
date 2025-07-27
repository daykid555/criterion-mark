// Import necessary packages
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import archiver from 'archiver';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import axios from 'axios';

// Load environment variables from .env file
dotenv.config();
const prisma = new PrismaClient();

// Initialize the Express application
const app = express();

// Define the port the server will run on
// It will use the PORT from the .env file, or default to 5001 if it's not defined
const PORT = process.env.PORT || 5001;

// --- MIDDLEWARE ---

const allowedOrigins = [
  'http://localhost:5173',
  'https://criterion-mark.vercel.app'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};
// Enable CORS (Cross-Origin Resource Sharing) for all routes
app.use(cors(corsOptions));
// Enable the Express app to parse JSON formatted request bodies
app.use(express.json());
app.set('trust proxy', true); // <-- ADD THIS LINE

// --- ROUTES ---
// A simple test route to make sure the server is working
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Seal It API!' });
});

// --- BATCH ROUTES ---
// POST /api/batches - Create a new batch request
app.post('/api/batches', async (req, res) => {
  try {
    // 1. Get the drug name, quantity, and expiration date from the request body
    const { drugName, quantity, expirationDate, nafdacNumber } = req.body;

    // 2. Basic Validation: Check if the required fields are present
    if (!drugName || !quantity || !expirationDate || !nafdacNumber) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // 3. For now, we will HARDCODE the manufacturer's ID.
    //    In a real app, this would come from the logged-in user's token.
    //    Our seed script created the manufacturer with ID = 1.
    const manufacturerId = 1;

    // 4. Use Prisma to create the new batch in the database
    const newBatch = await prisma.batch.create({
      data: {
        drugName: drugName,
        quantity: parseInt(quantity, 10), // Ensure quantity is an integer
        expirationDate: new Date(expirationDate), // Add this line
        nafdacNumber: nafdacNumber, // Add this
        manufacturerId: manufacturerId,
        // The status defaults to PENDING_DVA_APPROVAL as defined in our schema
      },
    });

    // 5. Send a success response back to the frontend with the new batch data
    console.log('Successfully created batch:', newBatch);
    res.status(201).json(newBatch);

  } catch (error) {
    // 6. If anything goes wrong, log the error and send a server error response
    console.error('Error creating batch:', error);
    res.status(500).json({ error: 'Failed to create batch.' });
  }
});

// GET /api/manufacturer/batches - Get all batches for the logged-in manufacturer
app.get('/api/manufacturer/batches', async (req, res) => {
  try {
    // For now, we will again HARDCODE the manufacturer's ID = 1.
    // Later, this will come from the user's auth token.
    const manufacturerId = 1;

    // Use Prisma to find all batches created by this manufacturer
    const batches = await prisma.batch.findMany({
      where: {
        manufacturerId: manufacturerId,
      },
      // Order the results so the newest batches appear first
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Send the list of batches back to the frontend
    res.status(200).json(batches);

  } catch (error) {
    console.error('Error fetching manufacturer batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches.' });
  }
});

// --- DVA ROUTES ---

// GET /api/dva/pending-batches - Get all batches with status PENDING_DVA_APPROVAL
app.get('/api/dva/pending-batches', async (req, res) => {
  try {
    const pendingBatches = await prisma.batch.findMany({
      where: {
        status: 'PENDING_DVA_APPROVAL',
      },
      // Include the manufacturer's company name for context
      include: {
        manufacturer: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Show oldest requests first
      },
    });
    res.status(200).json(pendingBatches);
  } catch (error) {
    console.error('Error fetching DVA pending batches:', error);
    res.status(500).json({ error: 'Failed to fetch pending batches.' });
  }
});

// PUT /api/dva/batches/:id/approve - DVA approves a batch
app.put('/api/dva/batches/:id/approve', async (req, res) => {
  try {
    const { id } = req.params; // Get batch ID from URL

    const updatedBatch = await prisma.batch.update({
      where: {
        id: parseInt(id, 10),
      },
      data: {
        status: 'PENDING_ADMIN_APPROVAL', // Change status to the next step
        dva_approved_at: new Date(),   // Record the approval time
      },
    });

    res.status(200).json(updatedBatch);
  } catch (error) {
    console.error('Error approving batch:', error);
    res.status(500).json({ error: 'Failed to approve batch.' });
  }
});

// GET /api/dva/history - Get all batches already processed by the DVA
app.get('/api/dva/history', async (req, res) => {
  try {
    const processedBatches = await prisma.batch.findMany({
      where: {
        // A batch has been processed by the DVA if its status is no longer PENDING_DVA_APPROVAL
        NOT: {
          status: 'PENDING_DVA_APPROVAL'
        }
      },
      include: {
        manufacturer: {
          select: { companyName: true },
        },
      },
      orderBy: {
        dva_approved_at: 'desc', // Show most recently processed first
      },
    });
    res.status(200).json(processedBatches);
  } catch (error) {
    console.error('Error fetching DVA history:', error);
    res.status(500).json({ error: 'Failed to fetch DVA history.' });
  }
});

// --- ADMIN ROUTES ---

// GET /api/admin/pending-batches - Get all batches with status PENDING_ADMIN_APPROVAL
app.get('/api/admin/pending-batches', async (req, res) => {
  try {
    const pendingBatches = await prisma.batch.findMany({
      where: {
        status: 'PENDING_ADMIN_APPROVAL',
      },
      include: {
        manufacturer: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Show oldest requests first
      },
    });
    res.status(200).json(pendingBatches);
  } catch (error) {
    console.error('Error fetching admin pending batches:', error);
    res.status(500).json({ error: 'Failed to fetch pending batches.' });
  }
});

// PUT /api/admin/batches/:id/approve - Admin gives final approval for a batch
app.put('/api/admin/batches/:id/approve', async (req, res) => {
  // This is the replacement for the try...catch block in the Admin approve route
  try {
    const { id } = req.params;

    // First, get the batch details, especially the quantity
    const batchToProcess = await prisma.batch.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!batchToProcess) {
      return res.status(404).json({ error: 'Batch not found.' });
    }

    // --- Generate QR Codes ---
    const codesToCreate = [];
    for (let i = 0; i < batchToProcess.quantity; i++) {
      codesToCreate.push({
        code: nanoid(12), // Generate a unique 12-character ID
        batchId: batchToProcess.id,
      });
    }

    // --- Use a Database Transaction ---
    // This is important: it ensures that BOTH updating the batch
    // AND creating the codes happen successfully, or NEITHER does.
    const [updatedBatch, createdCodes] = await prisma.$transaction([
      // 1. Update the batch status
      prisma.batch.update({
        where: { id: parseInt(id, 10) },
        data: {
          status: 'PENDING_PRINTING',
          admin_approved_at: new Date(),
        },
      }),
      // 2. Create all the new QR codes in the database
      prisma.qRCode.createMany({
        data: codesToCreate,
      }),
    ]);

    console.log(`Successfully generated ${createdCodes.count} codes for Batch ID: ${updatedBatch.id}`);
    res.status(200).json(updatedBatch);

  } catch (error) {
    console.error('Error in admin approval and code generation:', error);
    res.status(500).json({ error: 'Failed to approve batch and generate codes.' });
  }
});

// GET /api/admin/batches/:id/codes/download - Download all QR codes for a batch as a CSV
app.get('/api/admin/batches/:id/codes/download', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch all QR codes associated with the given batch ID
    const qrCodes = await prisma.qRCode.findMany({
      where: {
        batchId: parseInt(id, 10),
      },
    });

    if (qrCodes.length === 0) {
      return res.status(404).json({ error: 'No QR codes found for this batch.' });
    }

    // 2. Create the CSV header and rows
    const csvHeader = 'code\n'; // The column header
    const csvRows = qrCodes.map(qr => qr.code).join('\n'); // Each code on a new line
    const csvContent = csvHeader + csvRows;

    // 3. Set the response headers to trigger a file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="batch_${id}_codes.csv"`);
    
    // 4. Send the CSV content as the response
    res.status(200).send(csvContent);

  } catch (error) {
    console.error('Error downloading CSV:', error);
    res.status(500).json({ error: 'Failed to download codes.' });
  }
});

// GET /api/admin/batches/all - Get all batches for admin dashboard
app.get('/api/admin/batches/all', async (req, res) => {
  try {
    const allBatches = await prisma.batch.findMany({
      include: {
        manufacturer: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Show newest batches first
      },
    });
    res.status(200).json(allBatches);
  } catch (error) {
    console.error('Error fetching all batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches.' });
  }
});

// GET /api/admin/batches/:id - Get details for a single batch, including its QR codes
app.get('/api/admin/batches/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const batchDetails = await prisma.batch.findUnique({
      where: {
        id: parseInt(id, 10),
      },
      include: {
        manufacturer: {
          select: { companyName: true },
        },
        qrCodes: { // <-- This is the important part
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!batchDetails) {
      return res.status(404).json({ error: 'Batch not found.' });
    }

    res.status(200).json(batchDetails);

  } catch (error) {
    console.error(`Error fetching details for batch ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch batch details.' });
  }
});

// POST /api/admin/batches/:id/codes/zip - Generate and download a ZIP of all QR codes
app.post('/api/admin/batches/:id/codes/zip', async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await prisma.batch.findUnique({
      where: { id: parseInt(id, 10) },
      include: { qrCodes: true },
    });

    if (!batch || batch.qrCodes.length === 0) {
      return res.status(404).json({ error: 'No codes found for this batch.' });
    }

    // Set the headers for a zip file download
    const zipFileName = `batch_${id}_${batch.drugName.replace(/\s+/g, '_')}_qrcodes.zip`;
    res.attachment(zipFileName);

    const archive = archiver('zip', {
      zlib: { level: 9 }, // Sets the compression level.
    });

    // Pipe the archive data to the response
    archive.pipe(res);

    // Loop through each QR code and generate its image
    for (const qr of batch.qrCodes) {
      const qrCodeBuffer = await qrcode.toBuffer(qr.code, {
        errorCorrectionLevel: 'H', type: 'png', width: 500, margin: 2,
        color: { dark: '#000000', light: '#0000' }, // Transparent background
      });
      
      const logoBuffer = fs.readFileSync(path.join(process.cwd(), 'assets/shield-logo.svg'));

      const finalImageBuffer = await sharp(qrCodeBuffer)
        .composite([{ input: logoBuffer, gravity: 'center' }])
        .toBuffer();

      // Add the generated image buffer to the zip archive
      archive.append(finalImageBuffer, { name: `qr_code_${qr.code}.png` });
    }

    // Finalize the archive (this sends the zip file)
    await archive.finalize();

  } catch (error) {
    console.error('Error creating zip file:', error);
    res.status(500).json({ error: 'Failed to create zip file.' });
  }
});

// GET /api/admin/history - Get all batches already processed by an admin
app.get('/api/admin/history', async (req, res) => {
  try {
    const processedBatches = await prisma.batch.findMany({
      where: {
        // We fetch any batch that is NOT pending admin or DVA approval anymore
        NOT: {
          status: {
            in: ['PENDING_DVA_APPROVAL', 'PENDING_ADMIN_APPROVAL']
          }
        }
      },
      include: {
        manufacturer: {
          select: { companyName: true },
        },
      },
      orderBy: {
        admin_approved_at: 'desc', // Show most recently approved first
      },
    });
    res.status(200).json(processedBatches);
  } catch (error) {
    console.error('Error fetching admin history:', error);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

// --- ADD THIS NEW ADMIN ROUTE ---

// GET /api/admin/scans - Get all scan records for the map view
app.get('/api/admin/scans', async (req, res) => {
  try {
    const allScans = await prisma.scanRecord.findMany({
      // We only want scans that have some location data
      where: {
        // This ensures we don't try to map scans from before we added location tracking
        ipAddress: {
          not: null, 
        },
      },
      include: {
        // We need to know which product was scanned
        qrCode: {
          include: {
            batch: {
              select: {
                drugName: true,
                manufacturer: {
                  select: {
                    companyName: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        scannedAt: 'desc', // Show most recent scans first
      },
    });
    res.status(200).json(allScans);
  } catch (error) {
    console.error('Error fetching all scan records:', error);
    res.status(500).json({ error: 'Failed to fetch scan records.' });
  }
});

// --- ADD THESE NEW ADMIN MANAGEMENT ROUTES ---

// GET /api/admin/admins - Get a list of all admin users
app.get('/api/admin/admins', async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, companyName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admins.' });
  }
});

// POST /api/admin/admins - Create a new admin user
app.post('/api/admin/admins', async (req, res) => {
  // In app.post('/api/admin/admins', ...)
  try {
      const { email, password, adminCode } = req.body;
      if (!email || !password || !adminCode) return res.status(400).json({ error: 'All fields are required.' });
  
      const codeSetting = await prisma.systemSetting.findUnique({ where: { key: 'admin_creation_code' } });
      
      // THIS IS THE FIX: Ensure codeSetting exists before comparing
      if (!codeSetting) {
          return res.status(500).json({ error: 'Admin code setting not found in database. Please re-seed.' });
      }
      
      const isCodeValid = await bcrypt.compare(adminCode, codeSetting.value);
      if (!isCodeValid) {
          return res.status(401).json({ error: 'Invalid Admin Code.' });
      }
  
      const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existingUser) return res.status(409).json({ error: 'Email already exists.' });
      
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
          data: {
              email: email.toLowerCase(),
              password: hashedPassword,
              companyName: 'Administrator',
              role: 'ADMIN',
              isActive: true,
          },
      });
      res.status(201).json({ message: 'Admin created successfully.' });
  } catch (error) {
      console.error("ADD ADMIN ERROR:", error);
      res.status(500).json({ error: 'Failed to create admin.' });
  }
});

// POST /api/admin/reset-code - Reset the admin creation code
app.post('/api/admin/reset-code', async (req, res) => {
    // In app.post('/api/admin/reset-code', ...)
    try {
        const { email, newCode } = req.body;
        if (email.toLowerCase() !== 'daykid555@gmail.com') return res.status(403).json({ error: 'Unauthorized action.' });
        if (!newCode || !/^\d{4}$/.test(newCode)) return res.status(400).json({ error: 'New code must be 4 digits.' });
        
        const hashedCode = await bcrypt.hash(newCode, 10);
        
        // THIS IS THE FIX: Using upsert is safer. It will create the setting if it's missing.
        await prisma.systemSetting.upsert({
            where: { key: 'admin_creation_code' },
            update: { value: hashedCode },
            create: { key: 'admin_creation_code', value: hashedCode },
        });
    
        res.status(200).json({ message: 'Admin code has been reset successfully.' });
    } catch (error) {
        console.error("RESET CODE ERROR:", error);
        res.status(500).json({ error: 'Failed to reset admin code.' });
    }
});
// --- ADMIN USER MANAGEMENT ROUTES ---

// GET /api/admin/pending-users - Get all users awaiting activation
app.get('/api/admin/pending-users', async (req, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: {
        role: 'MANUFACTURER',
        isActive: false, // Only fetch inactive manufacturers
      },
      orderBy: {
        createdAt: 'asc', // Show oldest signups first
      },
    });
    res.status(200).json(pendingUsers);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ error: 'Failed to fetch pending users.' });
  }
});

// PUT /api/admin/users/:id/activate - Activate a user account
app.put('/api/admin/users/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    // We need to know WHICH admin approved this user.
    // For now, we'll hardcode the admin's ID. When we add JWT auth to the backend,
    // we will get this from the token. Let's assume our main admin is user ID 3.
    const adminApproverId = 3; 

    const activatedUser = await prisma.user.update({
      where: {
        id: parseInt(id, 10),
      },
      data: {
        isActive: true,
        approvedBy: adminApproverId,
        approvedAt: new Date(),
      },
    });

    // We don't want to send the password back
    const { password, ...userWithoutPassword } = activatedUser;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ error: 'Failed to activate user.' });
  }
});

// --- PUBLIC VERIFICATION ROUTE (Version 4 with Coordinates) ---
app.get('/api/verify/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const qrCode = await prisma.qRCode.findUnique({
      where: { code: code },
      include: {
        batch: {
          include: {
            manufacturer: { select: { companyName: true } },
          },
        },
        scanRecords: { // We still get the old records to show the history
          orderBy: { scannedAt: 'asc' },
          include: { scanner: { select: { companyName: true, role: true } } }
        }
      },
    });

    // CASE 1: Code does not exist = FAKE
    if (!qrCode) {
      return res.status(404).json({
        status: 'error',
        message: 'This code is invalid. The product is likely counterfeit.',
      });
    }

    // --- Geolocation Logic with Coordinates ---
    const ip = req.ip; // Get the user's IP address from the request
    let locationData = {
      ipAddress: ip,
      city: null,
      region: null,
      country: null,
      latitude: null,  // NEW
      longitude: null, // NEW
    };

    try {
      // MODIFIED: We are now asking the API for lat and lon
      const geoResponse = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,countryCode,region,city,lat,lon`);
      if (geoResponse.data.status === 'success') {
        locationData.city = geoResponse.data.city;
        locationData.region = geoResponse.data.region;
        locationData.country = geoResponse.data.countryCode;
        locationData.latitude = geoResponse.data.lat;   // NEW: Save latitude
        locationData.longitude = geoResponse.data.lon;  // NEW: Save longitude
      }
    } catch (geoError) {
      // If the IP lookup fails, we just log it and continue.
      // The scan is more important than the location data.
      console.error('Geolocation lookup failed:', geoError.message);
    }
    // --- End of Geolocation Logic ---

    
    // CASE 2: The code is VALID. Now we log this new scan.
    // We will now include the location data we just fetched.
    await prisma.scanRecord.create({
      data: {
        qrCodeId: qrCode.id,
        scannedByRole: 'CUSTOMER',
        // Add all the location data to the record
        ipAddress: locationData.ipAddress,
        city: locationData.city,
        region: locationData.region,
        country: locationData.country,
        latitude: locationData.latitude,   // NEW: Save to database
        longitude: locationData.longitude, // NEW: Save to database
      },
    });
    
    // Refetch the data to include the scan we just added
    const updatedQrCodeDetails = await prisma.qRCode.findUnique({
      where: { id: qrCode.id },
      include: {
        batch: { include: { manufacturer: { select: { companyName: true } } } },
        scanRecords: { // The history now includes our new scan with location
          orderBy: { scannedAt: 'asc' },
        }
      },
    });

    // CASE 3: Return a success response with all the product details AND the full scan history
    res.status(200).json({
      status: 'success',
      message: 'Product Verified Successfully!',
      data: updatedQrCodeDetails,
    });

  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ status: 'error', message: 'An internal server error occurred.' });
  }
});

// --- AUTHENTICATION ROUTES ---

// POST /api/auth/login - Handle user login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // 2. Find the user by their email address
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }, // Store and check emails in lowercase
    });

    // 3. If no user is found, or if the password doesn't match, send a generic error
    // We use bcrypt.compare to securely check the password without ever seeing the plain text version
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // 4. If credentials are correct, create a JWT payload
    const payload = {
      userId: user.id,
      role: user.role,
    };

    // 5. Sign the token with a secret key. It will expire in 1 day.
    //    We need to add JWT_SECRET to our .env file.
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    
    // 6. Send the token and user info (without the password) back to the client
    res.status(200).json({
      message: 'Login successful!',
      token: token,
      user: {
        id: user.id,
        role: user.role,
        companyName: user.companyName,
        email: user.email,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// POST /api/auth/register - Handle new user registration for ALL roles
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role, companyName, companyRegNumber, fullName } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const dataToCreate = {
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 10),
      role: role,
    };
    
    let successMessage = '';

    switch (role) {
      case 'MANUFACTURER':
        if (!companyName || !companyRegNumber) {
          return res.status(400).json({ error: 'Company Name and Registration Number are required for manufacturers.' });
        }
        const existingCompany = await prisma.user.findFirst({ where: { companyRegNumber } });
        if (existingCompany) {
          return res.status(409).json({ error: 'A company with this registration number already exists.' });
        }
        dataToCreate.companyName = companyName;
        dataToCreate.companyRegNumber = companyRegNumber;
        dataToCreate.isActive = false;
        successMessage = 'Registration successful! Your account is pending approval from an administrator.';
        break;
        
      case 'CUSTOMER':
        if (!fullName) {
          return res.status(400).json({ error: 'Full Name is required for customers.' });
        }
        dataToCreate.companyName = fullName;
        dataToCreate.isActive = true;
        successMessage = 'Registration successful! You can now log in.';
        break;

      // MODIFIED: Added PRINTING to this case. Both require a name and admin approval.
      case 'DVA':
      case 'PRINTING':
      case 'LOGISTICS':
        if (!fullName) {
          return res.status(400).json({ error: 'Full Name / Company Name is required.' });
        }
        dataToCreate.companyName = fullName;
        dataToCreate.isActive = false;
        successMessage = 'Registration successful! Your account is pending approval from an administrator.';
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid user role specified.' });
    }

    await prisma.user.create({
      data: dataToCreate,
    });

    res.status(201).json({ message: successMessage });

  } catch (error) {
    console.error('CRITICAL REGISTRATION ERROR:', error.message);
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// --- START THE SERVER ---
// Make the server listen on the defined port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
