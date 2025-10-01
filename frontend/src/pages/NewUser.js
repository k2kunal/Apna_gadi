// src/pages/NewUser.js
import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Typography, Container } from "@mui/material";
import { FaUserPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./NewUser.css";

const NewUser = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage("Please enter a valid email address");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/signup", formData);
      setMessage(res.data.message);
      setFormData({ name: "", email: "", password: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="new-user-container">
      <Container maxWidth="xs">
        <div className="new-user-form">
          <div className="form-header">
            <FaUserPlus className="form-icon" />
            <Typography variant="h4" className="form-title">
              Create New Account
            </Typography>
          </div>
          <form onSubmit={handleSubmit} className="form-content">
            <TextField
              label="Name"
              name="name"
              type="text"
              variant="outlined"
              fullWidth
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              variant="outlined"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              variant="outlined"
              fullWidth
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input password"
            />

            <Button type="submit" variant="contained" fullWidth className="submit-button">
              Sign Up
            </Button>
          </form>
          {message && (
            <Typography variant="body2" className="message">
              {message}
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 2, textAlign: "center", color: "white" }}>
            Already have an account?{" "}
            <Link to="/signin" className="signin-link" style={{ fontWeight: "bold", color: "#fbbd04" }}>
              Sign In
            </Link>
          </Typography>
        </div>
      </Container>
    </div>
  );
};

export default NewUser;
