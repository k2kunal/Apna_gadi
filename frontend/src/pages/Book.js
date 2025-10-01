import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Book.css';
import jsPDF from 'jspdf';

const Book = () => {
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '', // <-- add this
    mobile: '',
    pickup_date: '',
    drop_date: '',
    pickup_time: '',
    drop_time: '',
    pickup_location: '',
    drop_location: '',
    total_cost: 0,
    document: null,
  });

  const [receiptData, setReceiptData] = useState(null);
  const [vehicleBookings, setVehicleBookings] = useState({});

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await axios.get('http://localhost:5000/vehicles');
        setVehicles(res.data);
      } catch (err) {
        console.error('Error fetching vehicles:', err);
      }
    };
    fetchVehicles();
  }, []);

  const fetchVehicleBookings = async (vehicleId) => {
    try {
      const res = await axios.get(`http://localhost:5000/vehicle-bookings/${vehicleId}`);
      setVehicleBookings(prev => ({ ...prev, [vehicleId]: res.data }));
    } catch (err) {
      console.error('Error fetching vehicle bookings:', err);
    }
  };

  useEffect(() => {
    vehicles.forEach(vehicle => {
      fetchVehicleBookings(vehicle.vehicle_id);
    });
  }, [vehicles]);

  const handleShow = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedVehicle(null);
    setFormData({
      name: '',
      email: '', // <-- add this
      mobile: '',
      pickup_date: '',
      drop_date: '',
      pickup_time: '',
      drop_time: '',
      pickup_location: '',
      drop_location: '',
      total_cost: 0,
      document: null,
    });
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => {
      const updatedFormData = {
        ...prev,
        [name]: files ? files[0] : value,
      };
      if (
        name === 'pickup_date' ||
        name === 'drop_date' ||
        name === 'pickup_time' ||
        name === 'drop_time'
      ) {
        updatedFormData.total_cost = calculateTotalCost(
          updatedFormData.pickup_date,
          updatedFormData.drop_date,
          updatedFormData.pickup_time,
          updatedFormData.drop_time,
          selectedVehicle?.rent_amount
        );
      }
      return updatedFormData;
    });
  };

  const calculateTotalCost = (pickupDate, dropDate, pickupTime, dropTime, rentAmount) => {
    if (!pickupDate || !dropDate || !pickupTime || !dropTime || !rentAmount) {
      return 0;
    }
    const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
    const dropDateTime = new Date(`${dropDate}T${dropTime}`);
    if (pickupDateTime >= dropDateTime) {
      alert('Drop date and time must be after pickup date and time.');
      return 0;
    }
    const durationInHours = Math.abs(dropDateTime - pickupDateTime) / (1000 * 60 * 60);
    return Math.ceil(durationInHours) * rentAmount;
  };

  const handleBooking = async () => {
    const { pickup_date, drop_date, pickup_time, drop_time, document } = formData;
    const pickupDateTime = new Date(`${pickup_date}T${pickup_time}`);
    const dropDateTime = new Date(`${drop_date}T${drop_time}`);

    if (!pickup_date || !drop_date || !pickup_time || !drop_time) {
      alert('Please fill in all date and time fields.');
      return;
    }
    if (pickupDateTime >= dropDateTime) {
      alert('Drop date and time must be after pickup date and time.');
      return;
    }
    if (!document) {
      alert("Please upload a valid ID document (Aadhaar card or Government Verified ID).");
      return;
    }

    // Check for booking conflicts
    const bookings = vehicleBookings[selectedVehicle.vehicle_id] || [];
    const conflict = bookings.some(b => {
      const existingStart = new Date(`${b.pickup_date}T${b.pickup_time}`);
      const existingEnd = new Date(`${b.drop_date}T${b.drop_time}`);
      return (
        (pickupDateTime < existingEnd && dropDateTime > existingStart)
      );
    });
    if (conflict) {
      alert('This vehicle is already booked for the selected time range.');
      return;
    }

    try {
      const data = new FormData();
      data.append('vehicle_id', selectedVehicle.vehicle_id);
      data.append('vehicle_type', selectedVehicle.vehicle_type);
      data.append('vehicle_name', selectedVehicle.name);
      data.append('vehicle_company', selectedVehicle.company);
      data.append('vehicle_model', selectedVehicle.model);
      data.append('vehicle_number', selectedVehicle.vehicle_number);

      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      const res = await axios.post('http://localhost:5000/bookvehicle', data);
      alert(res.data.message);

      setReceiptData({
        name: formData.name,
        mobile: formData.mobile,
        vehicle: selectedVehicle.name,
        pickup_date: formData.pickup_date,
        drop_date: formData.drop_date,
        pickup_time: formData.pickup_time,
        drop_time: formData.drop_time,
        total_cost: formData.total_cost,
      });
      setShowReceipt(true);

      handleClose();
      // Refresh bookings for this vehicle
      fetchVehicleBookings(selectedVehicle.vehicle_id);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        alert(err.response.data.message); // Show backend conflict message
      } else {
        alert('Failed to book vehicle');
      }
    }
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setReceiptData(null);
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleDownloadReceipt = () => {
    if (!receiptData) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Booking Receipt', 10, 15);
    doc.setFontSize(12);
    doc.text(`Name: ${receiptData.name}`, 10, 30);
    doc.text(`Mobile: ${receiptData.mobile}`, 10, 40);
    doc.text(`Vehicle: ${receiptData.vehicle}`, 10, 50);
    doc.text(`Pickup Date: ${receiptData.pickup_date}`, 10, 60);
    doc.text(`Drop Date: ${receiptData.drop_date}`, 10, 70);
    doc.text(`Pickup Time: ${formatTime(receiptData.pickup_time)}`, 10, 80);
    doc.text(`Drop Time: ${formatTime(receiptData.drop_time)}`, 10, 90);
    doc.text(`Total Cost: Rs. ${receiptData.total_cost}`, 10, 100);
    doc.save('booking_receipt.pdf');
  };

  // Helper functions for booking status
  const isVehicleBookedNow = (bookings) => {
    const now = new Date();
    return bookings.some(b => {
      const start = new Date(`${b.pickup_date}T${b.pickup_time}`);
      const end = new Date(`${b.drop_date}T${b.drop_time}`);
      return now >= start && now < end;
    });
  };

  const getCurrentBookingEnd = (bookings) => {
    const now = new Date();
    const current = bookings.find(b => {
      const start = new Date(`${b.pickup_date}T${b.pickup_time}`);
      const end = new Date(`${b.drop_date}T${b.drop_time}`);
      return now >= start && now < end;
    });
    if (current) {
      return `${current.drop_date} ${formatTime(current.drop_time)}`;
    }
    return null;
  };

  // Find the next available time after the latest booking
  const getNextAvailableTime = (bookings) => {
    if (!bookings.length) return null;
    const latest = bookings.reduce((max, b) => {
      const end = new Date(`${b.drop_date}T${b.drop_time}`);
      return end > max ? end : max;
    }, new Date(`${bookings[0].drop_date}T${bookings[0].drop_time}`));
    return latest;
  };

  // Check if the selected time range overlaps with any existing booking
  const isSelectedTimeConflict = (bookings) => {
    const { pickup_date, drop_date, pickup_time, drop_time } = formData;
    if (!pickup_date || !drop_date || !pickup_time || !drop_time) return false;
    const pickupDateTime = new Date(`${pickup_date}T${pickup_time}`);
    const dropDateTime = new Date(`${drop_date}T${drop_time}`);
    return bookings.some(b => {
      const existingStart = new Date(`${b.pickup_date}T${b.pickup_time}`);
      const existingEnd = new Date(`${b.drop_date}T${b.drop_time}`);
      return (pickupDateTime < existingEnd && dropDateTime > existingStart);
    });
  };

  return (
    <Container className="mt-4">
      <h2 className="text-center mb-4">Book Your Ride</h2>
      <Row>
        {vehicles.map((vehicle) => {
          const bookings = vehicleBookings[vehicle.vehicle_id] || [];
          const bookedNow = isVehicleBookedNow(bookings);
          const bookedUntil = getCurrentBookingEnd(bookings);

          return (
            <Col key={vehicle.vehicle_id} xs={12} sm={6} md={4} className="mb-4">
              <Card
                className="h-100 shadow card-3d"
                style={{
                  border: '2px solid black',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  background: '#fff'
                }}
              >
                <Card.Img
                  variant="top"
                  src={`http://localhost:5000/uploads/${vehicle.images.split(',')[0]}`}
                  alt={vehicle.name}
                  style={{
                    height: '200px',
                    width: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    // Remove border radius from image
                  }}
                />
                <Card.Body>
                  <Card.Title>
                    {vehicle.name} ({vehicle.model})
                  </Card.Title>
                  <Card.Text>
                    <strong>Type:</strong> {vehicle.vehicle_type}
                    <br />
                    <strong>Battery:</strong> {vehicle.battery_capacity} kWh
                    <br />
                    <strong>Rent:</strong> ₹{vehicle.rent_amount}/hour
                    <br />
                    {bookedNow && (
                      <span style={{ color: 'red', fontWeight: 600 }}>
                        Booked until: {bookedUntil}
                      </span>
                    )}
                  </Card.Text>
                  <Button
                    variant="primary"
                    onClick={() => handleShow(vehicle)}
                    disabled={bookedNow}
                  >
                    {bookedNow ? 'Booked' : 'Book'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Booking Modal */}
      <Modal show={showModal} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Book {selectedVehicle?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedVehicle && (() => {
            const bookings = vehicleBookings[selectedVehicle.vehicle_id] || [];
            const conflict = isSelectedTimeConflict(bookings);
            const nextAvailable = getNextAvailableTime(bookings);
            const bookedNow = isVehicleBookedNow(bookings);
            const bookedUntil = getCurrentBookingEnd(bookings);

            return (
              <>
                {bookedNow && (
                  <div style={{ color: 'red', fontWeight: 600, marginBottom: 10 }}>
                    Vehicle currently not available.<br />
                    Booked until: {bookedUntil}
                  </div>
                )}
                {conflict && (
                  <div style={{ color: 'red', fontWeight: 600, marginBottom: 10 }}>
                    This vehicle is already booked for the selected time range.<br />
                    {nextAvailable && (
                      <>Book after: {nextAvailable.toLocaleString()}</>
                    )}
                  </div>
                )}
                <Form className="booking-form">
                  <Form.Group>
                    <Form.Label>Your Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Mobile</Form.Label>
                    <Form.Control
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      onKeyPress={(e) => {
                        if (!/^\d$/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      required
                      pattern="^\d{10}$"
                      title="Please enter a valid 10-digit mobile number"
                      maxLength="10"
                    />
                  </Form.Group>
                  <Row>
                    <Col>
                      <Form.Group>
                        <Form.Label>Pickup Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="pickup_date"
                          value={formData.pickup_date}
                          onChange={handleChange}
                          min={getTodayDate()}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group>
                        <Form.Label>Drop Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="drop_date"
                          value={formData.drop_date}
                          onChange={handleChange}
                          min={getTodayDate()}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Form.Group>
                        <Form.Label>Pickup Time</Form.Label>
                        <Form.Control
                          type="time"
                          name="pickup_time"
                          value={formData.pickup_time}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group>
                        <Form.Label>Drop Time</Form.Label>
                        <Form.Control
                          type="time"
                          name="drop_time"
                          value={formData.drop_time}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group>
                    <Form.Label>Pickup Location</Form.Label>
                    <Form.Control
                      type="text"
                      name="pickup_location"
                      value={formData.pickup_location}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Drop Location</Form.Label>
                    <Form.Control
                      type="text"
                      name="drop_location"
                      value={formData.drop_location}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Total Cost</Form.Label>
                    <Form.Control
                      type="number"
                      name="total_cost"
                      value={formData.total_cost}
                      readOnly
                      required
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Upload ID Document</Form.Label>
                    <Form.Control
                      type="file"
                      name="document"
                      onChange={handleChange}
                      accept=".jpg,.jpeg,.png,.pdf"
                      required
                    />
                  </Form.Group>
                </Form>
              </>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleBooking}
            disabled={
              selectedVehicle &&
              (isVehicleBookedNow(vehicleBookings[selectedVehicle.vehicle_id] || []) ||
               isSelectedTimeConflict(vehicleBookings[selectedVehicle.vehicle_id] || []))
            }
          >
            Confirm Booking
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Receipt Modal */}
      <Modal show={showReceipt} onHide={handleReceiptClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Booking Receipt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {receiptData && (
            <div>
              <p><strong>Name:</strong> {receiptData.name}</p>
              <p><strong>Mobile:</strong> {receiptData.mobile}</p>
              <p><strong>Vehicle:</strong> {receiptData.vehicle}</p>
              <p><strong>Pickup Date:</strong> {receiptData.pickup_date}</p>
              <p><strong>Drop Date:</strong> {receiptData.drop_date}</p>
              <p><strong>Pickup Time:</strong> {formatTime(receiptData.pickup_time)}</p>
              <p><strong>Drop Time:</strong> {formatTime(receiptData.drop_time)}</p>
              <p><strong>Total Cost:</strong> ₹{receiptData.total_cost}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDownloadReceipt}>
            Download Receipt
          </Button>
          <Button variant="primary" onClick={handleReceiptClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Book;