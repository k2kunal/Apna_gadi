const express = require("express");
const cors = require("cors");
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const bcrypt = require("bcrypt");
const db = require("./db");
const adminStatsRoute = require("./routes/adminStats");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const router = express.Router(); // Define the router
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "k2kunalkhude@gmail.com", // ✅ Your Gmail address
    pass: "vpzkcpywstqskgmr",       // ✅ Your App Password from Gmail (not your main password)
  },
});

const sendWelcomeEmail = (email, name) => {
  const mailOptions = {
    from: `"Apna Gadi" <k2kunalkhude@gmail.com>`,
    to: email,
    subject: "Welcome to Apna Gadi 🚗",
    html: `<h3>Hello ${name},</h3>
           <p>Welcome to <strong>Apna Gadi</strong>! We're thrilled to have you on board.</p>
           <p>Explore electric rides with ease and comfort.</p>
           <br/>
           <p>Regards,<br/>Team Apna Gadi</p>`
  };

  return transporter.sendMail(mailOptions);
};

// Helper to generate PDF as a buffer
function generateReceiptPDF(receiptData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // Title
    doc.fontSize(24).fillColor('#0d47a1').text('Apna Gadi Booking Receipt', { align: 'center', underline: true });
    doc.moveDown();

    // Booking details
    doc.fontSize(13).fillColor('black');
    doc.text(`Name: ${receiptData.name}`);
    doc.text(`Mobile: ${receiptData.mobile}`);
    doc.text(`Vehicle: ${receiptData.vehicle}`);
    doc.text(`Pickup Date: ${receiptData.pickup_date}`);
    doc.text(`Drop Date: ${receiptData.drop_date}`);
    doc.text(`Pickup Time: ${receiptData.pickup_time}`);
    doc.text(`Drop Time: ${receiptData.drop_time}`);
    doc.text(`Total Cost: Rs. ${receiptData.total_cost}`);
    doc.moveDown();

    // Main message - colorful and attractive
    doc.fontSize(16).fillColor('#388e3c').text('Booking Successful!', { align: 'center', underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor('#1565c0').text(
      "Thank you for choosing Apna Gadi – where every ride is a new adventure!",
      { align: 'center' }
    );
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor('#6d4c41').text(
      "We hope you have a smooth and joyful journey. If you loved our service, tell your friends (and even your rivals – everyone deserves a great ride!).",
      { align: 'center' }
    );
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor('#ad1457').text(
      "Need another ride? We're always here for you. Book again anytime and let the good times roll!",
      { align: 'center' }
    );
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor('#00838f').text(
      "If you have any questions, our support team is ready 24/7. Just reply to this email or call us anytime.",
      { align: 'center' }
    );
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor('#2e7d32').text(
      "Drive safe, stay awesome, and remember: Life is too short for boring rides!",
      { align: 'center' }
    );
    doc.moveDown(1);

    doc.fontSize(13).fillColor('#0d47a1').text(
      "With gratitude,\nTeam Apna Gadi",
      { align: 'center', oblique: true }
    );

    doc.end();
  });
}

async function sendBookingEmail(to, receiptData) {
  const pdfBuffer = await generateReceiptPDF(receiptData);

  const mailOptions = {
    from: '"Apna Gadi" <k2kunalkhude@gmail.com>',
    to,
    subject: 'Booking Confirmation - Apna Gadi',
    text: `Dear ${receiptData.name},\n\nYour booking was successful! Please find your receipt attached.\n\nThank you for choosing Apna Gadi.`,
    attachments: [
      {
        filename: 'booking_receipt.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  return transporter.sendMail(mailOptions);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); // Only "uploads"
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });


app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  next();
}, express.static(path.join(__dirname, "uploads"))); // Routes

// Mount routes
app.use("/api/admin", adminStatsRoute); // /api/admin/stats will now work correctly

// Routes
// Signup Route
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the user already exists
    const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [
      name,
      email,
      hashedPassword,
    ]);

    // ✅ Send welcome email
    await sendWelcomeEmail(email, name)
      .then(() => {
        console.log("✅ Welcome email sent to:", email);
      })
      .catch((error) => {
        console.error("❌ Failed to send welcome email:", error);
      });

    res.status(201).json({ message: "User registered successfully , Please Sign In !" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// SignIn route
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    // If no user found
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not registered. Please register first.' });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Send response with user details
    res.json({
      id: user[0].id, // Assuming the user ID column in your SQL table is 'id'
      name: user[0].name,
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 👇 ADD THIS LINE after defining all routes (signup & signin)
app.use("/", router);

// Start the server
app.listen(PORT, () => {
  kunalBanner(PORT);
});

function kunalBanner(port) {
  console.log("Server is running on http://localhost:" + port);
  console.log("Server started on port " + port + " Lets go frontend side Kunal.");
  console.log("Database connected successfully Kunal!");
}

// Add vehicle endpoint
app.post("/addvehicle", upload.array("images", 10), async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const { type, name, company, model, batteryCapacity, number, rentAmount } = req.body;

    if (
      !type ||
      !name ||
      !company ||
      !model ||
      !batteryCapacity ||
      !number ||
      !rentAmount
    ) {
      return res.status(400).send({ error: "All fields are required" });
    }

    const images = req.files.map((file) => file.filename);
    const sql = `INSERT INTO vehicles (vehicle_type, name, company, model, battery_capacity, number, rent_amount, images)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await db.execute(sql, [
      type,
      name,
      company,
      model,
      batteryCapacity,
      number,
      rentAmount,
      images.join(","),
    ]);
    res.send({ message: "Vehicle added successfully!" });
  } catch (err) {
    console.error("Error adding vehicle:", err); // <--- log full error
    res.status(500).send({ error: "Failed to add vehicle" });
  }
});

// Update vehicle endpoint
app.put("/updatevehicle/:id", upload.array("images", 10), async (req, res) => {
  const { id } = req.params;
  const { type, name, company, model, batteryCapacity, number, rentAmount } =
    req.body;
  const images = req.files.map((file) => file.filename);

  const sql = `UPDATE vehicles 
               SET vehicle_type = ?, name = ?, company = ?, model = ?, battery_capacity = ?, number = ?, rent_amount = ?, images = ? 
               WHERE vehicle_id = ?`;

  try {
    const [result] = await db.execute(sql, [
      type,
      name,
      company,
      model,
      batteryCapacity,
      number,
      rentAmount,
      images.join(","),
      id,
    ]);

    res.send({ message: "Vehicle updated successfully!" });
  } catch (err) {
    console.error("Error updating vehicle:", err.message);
    res.status(500).send({ error: "Failed to update vehicle" });
  }
});

// Book vehicle endpoint
app.post("/bookvehicle", upload.single("document"), async (req, res) => {
  console.log("Request Body:", req.body);
  console.log("Uploaded File:", req.file);

  const {
    vehicle_id,
    vehicle_type,
    vehicle_name,
    vehicle_company,
    vehicle_model,
    vehicle_number,
    name,
    mobile,
    email,
    pickup_date,
    drop_date,
    pickup_time,
    drop_time,
    pickup_location,
    drop_location,
    total_cost,
  } = req.body;

  // Check for booking conflicts
  const conflictQuery = `
    SELECT * FROM booking
    WHERE vehicle_id = ?
      AND (
        (? < CONCAT(drop_date, 'T', drop_time))
        AND
        (? > CONCAT(pickup_date, 'T', pickup_time))
      )
  `;
  const pickupDateTime = `${pickup_date}T${pickup_time}`;
  const dropDateTime = `${drop_date}T${drop_time}`;
  const [conflicts] = await db.query(conflictQuery, [
    vehicle_id,
    dropDateTime,
    pickupDateTime,
  ]);
  console.log("Conflict check result:", conflicts);
  if (conflicts.length > 0) {
    // Find the latest drop time among conflicts
    const latest = conflicts.reduce((max, b) => {
      const end = new Date(`${b.drop_date}T${b.drop_time}`);
      return end > max ? end : max;
    }, new Date(`${conflicts[0].drop_date}T${conflicts[0].drop_time}`));
    return res.status(409).json({
      message: `This vehicle is already booked for the selected time range. Book after ${latest.toLocaleString()}.`
    });
  }

  const document = req.file ? req.file.filename : "";

  const sql = `INSERT INTO booking 
    (vehicle_id, vehicle_type, vehicle_name, vehicle_company, vehicle_model, vehicle_number, name, mobile, 
    pickup_date, drop_date, pickup_time, drop_time, pickup_location, drop_location, total_cost, document) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  try {
    const [result] = await db.execute(sql, [
      vehicle_id,
      vehicle_type,
      vehicle_name,
      vehicle_company,
      vehicle_model,
      vehicle_number,
      name,
      mobile,
      pickup_date,
      drop_date,
      pickup_time,
      drop_time,
      pickup_location,
      drop_location,
      total_cost,
      document,
    ]);

    // Prepare receipt data
    const receiptData = {
      name,
      mobile,
      vehicle: vehicle_name,
      pickup_date,
      drop_date,
      pickup_time,
      drop_time,
      total_cost
    };

    // Send booking email with PDF (only if email is provided)
    if (email) {
      await sendBookingEmail(email, receiptData)
        .then(() => {
          console.log("✅ Booking email sent to:", email);
        })
        .catch((error) => {
          console.error("❌ Failed to send booking email:", error);
        });
    }

    res.send({ message: "Booking successful!" });
  } catch (err) {
    console.error("Error saving booking:", err.message);
    res.status(500).send({ message: "Server error" });
  }
});

// Fetch vehicles endpoint
app.get("/vehicles", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT vehicle_id, vehicle_type, name, company, model, battery_capacity, number, rent_amount, images 
      FROM vehicles
    `);
    res.send(results);
  } catch (err) {
    console.error("Error fetching vehicles:", err.message);
    res.status(500).send({ error: "Failed to fetch vehicles" });
  }
});

// Fetch single vehicle endpoint
app.get("/vehicle/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query(
      "SELECT * FROM vehicles WHERE vehicle_id = ?",
      [id]
    );

    if (results.length === 0) {
      return res.status(404).send({ error: "Vehicle not found" });
    }

    res.send(results[0]);
  } catch (err) {
    console.error("Error fetching vehicle:", err.message);
    res.status(500).send({ error: "Failed to fetch vehicle" });
  }
});

// Delete vehicle endpoint
app.delete("/deletevehicle/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM vehicles WHERE vehicle_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send({ error: "Vehicle not found" });
    }

    res.send({ message: "Vehicle deleted successfully!" });
  } catch (err) {
    console.error("Error deleting vehicle:", err.message);
    res.status(500).send({ error: "Failed to delete vehicle" });
  }
});

// Fetch today's bookings endpoint
app.get("/api/todays-bookings", async (req, res) => {
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

  try {
    const [results] = await db.query(
      "SELECT * FROM booking WHERE DATE(booking_datetime) = ?",
      [today]
    );
    res.send(results);
  } catch (err) {
    console.error("Error fetching bookings:", err.message);
    res.status(500).send({ error: "Failed to fetch bookings" });
  }
});

// Fetch all bookings endpoint
app.get("/api/bookings", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM booking ORDER BY booking_datetime DESC"
    );
    res.send(results);
  } catch (err) {
    console.error("Error fetching bookings:", err.message);
    res.status(500).send({ error: "Failed to fetch bookings" });
  }
});

// Start the server

app.listen(PORT, () => {
  kunalBanner(PORT);
});

function kunalBanner(port) {
  console.log("Server is running on http://localhost:" + port);
  console.log("Server started on port " + port + " Lets go frontend side Kunal.");
  console.log("Database connected successfully Kunal!");
}

app.get("/vehicle-bookings/:vehicle_id", async (req, res) => {
  const { vehicle_id } = req.params;
  const now = new Date().toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm'
  try {
    const [results] = await db.query(
      `SELECT pickup_date, pickup_time, drop_date, drop_time
       FROM booking
       WHERE vehicle_id = ?
         AND (CONCAT(drop_date, 'T', drop_time) > ?)
       ORDER BY pickup_date, pickup_time`,
      [vehicle_id, now]
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching bookings:", err.message);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

const originalLog = console.log;
console.log = function (...args) {
  originalLog("k2:", ...args);
};



