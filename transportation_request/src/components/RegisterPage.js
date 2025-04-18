import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Navbar, Nav, Button, Form, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import '../theme.css';

const RegisterPage = () => {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    school: "",
    district: ""
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        school: formData.role === "parent" ? formData.school : "",
        district: formData.district,
        createdAt: new Date().toISOString()
      });

      switch (formData.role) {
        case 'parent':
          navigate('/parent-dashboard');
          break;
        case 'district':
          navigate('/district-dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <motion.div className="register-page d-flex flex-column min-vh-100" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
      <Navbar bg="primary" variant="dark" expand="lg" className="fixed-top">
        <Container>
          <Navbar.Brand href="#" className="fw-bold">Transportation Portal</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse className="justify-content-end">
            <Nav>
              <Nav.Link onClick={() => navigate("/")}>Home</Nav.Link>
              <Button variant="outline-light" className="ms-3" onClick={() => navigate('/login')}>Login</Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div className="d-flex align-items-center justify-content-center flex-grow-1" style={{ paddingBottom: "80px" }}>
        <Container>
          <Row className="justify-content-center">
            <Col md={6}>
              <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <Card className="p-4 shadow rounded">
                  <Card.Body>
                    <h2 className="text-center mb-4">Register</h2>
                    {error && <p className="text-danger text-center">{error}</p>}
                    <Form onSubmit={handleRegister}>
                      <Form.Group className="mb-3" controlId="formFirstName">
                        <Form.Label>First Name</Form.Label>
                        <Form.Control type="text" name="firstName" placeholder="Enter first name" required onChange={handleChange} />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formLastName">
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control type="text" name="lastName" placeholder="Enter last name" required onChange={handleChange} />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formEmail">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control type="email" name="email" placeholder="Enter your email" required onChange={handleChange} />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" name="password" placeholder="Enter password" required onChange={handleChange} />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formConfirmPassword">
                        <Form.Label>Confirm Password</Form.Label>
                        <Form.Control type="password" name="confirmPassword" placeholder="Confirm password" required onChange={handleChange} />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formRole">
                        <Form.Label>Select Account Type</Form.Label>
                        <Form.Select name="role" value={formData.role} onChange={handleChange} required>
                          <option value="" disabled>Select Account Type</option>
                          <option value="parent">Parent/Guardian</option>
                          <option value="district">District Admin</option>
                        </Form.Select>
                      </Form.Group>

                      {formData.role === "parent" && (
                        <Form.Group className="mb-3" controlId="formSchool">
                          <Form.Label>School</Form.Label>
                          <Form.Control type="text" name="school" placeholder="Enter school name" required onChange={handleChange} />
                        </Form.Group>
                      )}

                      {formData.role && (
                        <Form.Group className="mb-3" controlId="formDistrict">
                          <Form.Label>District</Form.Label>
                          <Form.Control type="text" name="district" placeholder="Enter district name" required onChange={handleChange} />
                        </Form.Group>
                      )}

                      <Form.Group className="mb-3" controlId="formCheckbox">
                        <Form.Check type="checkbox" label="I agree to the Terms & Conditions" required />
                      </Form.Group>

                      <Button variant="primary" type="submit" className="w-100">Register</Button>

                      <div className="text-center mt-3">
                        <span>Already have an account? </span>
                        <a href="/login" className="text-primary">Login</a>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </div>

      <footer className="bg-dark text-white py-4 mt-auto">
        <Container>
          <Row>
            <Col md={6} className="mb-3 mb-md-0">
              <h5>Transportation Request Portal</h5>
              <p className="mb-0">Simplifying school transportation management</p>
            </Col>
            <Col md={6} className="text-md-end">
              <Nav className="justify-content-md-end">
                <Nav.Link href="#" className="text-white">Privacy Policy</Nav.Link>
                <Nav.Link href="#" className="text-white">Terms of Service</Nav.Link>
                <Nav.Link href="#" className="text-white">Contact Us</Nav.Link>
              </Nav>
            </Col>
          </Row>
        </Container>
      </footer>
    </motion.div>
  );
};

export default RegisterPage;
