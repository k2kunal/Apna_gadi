import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserDashboard.css";
import customerImage from "../assets/customer.png";
import advantageImage from "../assets/Advantage.png";
import { Link } from "react-router-dom";
const UserDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>⚡ Apna Gadi - Go Electric, Go Smart!</h1>
          <p>Rent electric vehicles at unbeatable prices with zero emissions.</p>
          <button
            className="hero-btn"
            onClick={() => navigate("/book")}
            style={{
              backgroundColor: "black",
              color: "white",
              border: "none",
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
              transition: "background-color 0.3s, color 0.3s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "yellow";
              e.target.style.color = "black";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "black";
              e.target.style.color = "white";
            }}
          >
            🚀 Book Your Ride
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>🌟 Why Choose Us?</h2>
        <div className="feature-grid">
          <div className="feature-box">
            <span className="icon">🔋</span>
            <h3>Electric Power</h3>
            <p>Eco-friendly, cost-efficient and futuristic travel.</p>
          </div>
          <div className="feature-box">
            <span className="icon">📲</span>
            <h3>Instant Booking</h3>
            <p>Book a ride in seconds using our seamless platform.</p>
          </div>
          <div className="feature-box">
            <span className="icon">💰</span>
            <h3>Affordable Rates</h3>
            <p>Pay less, ride more with our budget-friendly plans.</p>
          </div>
          <div className="feature-box">
            <span className="icon">🛠️</span>
            <h3>Reliable Support</h3>
            <p>Round-the-clock support for smooth experiences.</p>
          </div>
        </div>
      </section>
            {/* EV Advantage Section */}
      <img
        src={advantageImage}
        alt="EV Advantage"
        className="impact-img"
        style={{
          maxWidth: "100%",
          width: "100%",
          height: "auto",
          margin: "0 auto",
          display: "block",
        }}
      />

      {/* Our Impact Section */}
      <img
        src={customerImage}
        alt="Our Impact in Numbers"
        className="impact-img"
        style={{
          maxWidth: "100%",
          width: "100%",
          height: "auto",
          margin: "0 auto",
          display: "block",
        }}
      />
   


      {/* Footer Section */}
      <footer className="footer">
        <div className="footer-container">
          {/* Royal Brother */}
          <div className="footer-section royal-brother">
            <h3>Apna Gadi</h3>
            <p>Our trusted rental partner</p>
            <ul>
              <li>k2 kunal</li>
              <li>Sangmesh Biral</li>
              <li>Prajwal Mathapati</li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-section company">
            <h3>Company</h3>
            <ul>
              <li>
  <Link to="/about">About Us</Link>
</li>
              <li>
                <Link to="/careers">Careers</Link>
              </li>
             <li>
    <Link to="/privacy-policy">Privacy Policy</Link> {/* Update this with the correct route if you have a Privacy Policy page */}
  </li>
  <li>
    <Link to="/termsconditions">Terms & Conditions</Link> {/* Link to the Terms & Conditions page */}
  </li>
            </ul>
          </div>

          {/* Policies */}
          <div className="footer-section policies">
            <h3>Policies</h3>
            <ul>
<li>
  <Link to="/return-policy">Return Policy</Link>
</li>
<li>
  <Link to="/shipping-policy">Shipping Policy</Link>
</li>
<li>
  <Link to="/payment-policy">Payment Policy</Link>
</li>

            </ul>
          </div>

          {/* Quick Links */}
          <div className="footer-section quick-links">
            <h3>Contact Us</h3>
            <ul>
              <li>
                <a href="mailto:k2kunalkhude@gmail.com">k2kunalkhude@gmail.com</a>
              </li>
              <li>
                <a href="mailto:sangameshbiral123@gmail.com">sangameshbiral123@gmail.com</a>
              </li>
              <li>
                <a href="mailto:mathatipraju1008@gmail.com">mathatipraju1008@gmail.com</a>
              </li>
              <li>
                <a href="tel:+916361120251">Phone: +916361120251</a>
              </li>
            </ul>
          </div>

          <div className="footer-section follow-us">
            <h3>Follow Us</h3>
            <div className="social-icons">
              <a href="https://m.facebook.com/kunal.khude.54390/">Facebook</a>
              <a href="https://www.instagram.com/k2_kunal__/">Instagram</a>
              <a href="https://x.com/k2_kunal__?t=IfiJAasGyiepgbZpJCdE2A&s=09">Twitter</a>
              <a href="https://www.linkedin.com/in/k2kunal?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app">
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 Apna Gadi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default UserDashboard;
