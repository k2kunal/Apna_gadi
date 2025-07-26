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
  console.log(`Server is running on http://localhost:${PORT}`);
});
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
    pickup_date,
    drop_date,
    pickup_time,
    drop_time,
    pickup_location,
    drop_location,
    total_cost,
  } = req.body;

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
      "SELECT * FROM bookings WHERE DATE(booking_datetime) = ?",
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
  console.log(`Server is running on http://localhost: ${PORT}`);
  console.log(`Server started on port ${PORT} Lets go frontend side Kunal.`);
});


