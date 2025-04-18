"use client";

import { useState, useEffect } from "react";
import { Container, Row, Col, Navbar, Nav, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase"; 
import "../theme.css";

const scrollToSection = (id) => {
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
};

const LandingPage = () => {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  // Contact form state
  const [contactData, setContactData] = useState({
    name: "",
    email: "",
    message: "",
  });

  // Handle navbar background change on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "contact_messages"), {
        ...contactData,
        timestamp: new Date().toISOString(),
      });
      alert("Your message has been sent!");
      setContactData({ name: "", email: "", message: "" });
    } catch (err) {
      console.error("Error submitting contact form:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <Navbar
        bg="primary"
        variant="dark"
        expand="lg"
        fixed="top"
        className={scrolled ? "scrolled" : ""}
      >
        <Container>
          <Navbar.Brand
            onClick={() => navigate("/")}
            className="fw-bold"
            style={{ cursor: "pointer" }}
          >
            Transportation Portal
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse className="justify-content-end">
            <Nav>
              <Nav.Link onClick={() => scrollToSection("hero")}>About</Nav.Link>
              <Nav.Link onClick={() => scrollToSection("features")}>
                Features
              </Nav.Link>
              <Nav.Link onClick={() => scrollToSection("contact")}>
                Contact
              </Nav.Link>
              <Button
                variant="outline-light"
                className="ms-3"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
              <Button
                variant="light"
                className="ms-2"
                onClick={() => navigate("/register")}
              >
                Register
              </Button>
              <Button
                variant="secondary"
                className="ms-2"
                onClick={() => navigate("/team")}
              >
                Team
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <header
        id="hero"
        className="hero-section text-white text-center d-flex align-items-center"
      >
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-4"
              >
                <span className="badge bg-warning text-white px-3 py-2 d-inline-block">
                  School Transportation Management
                </span>
              </motion.div>
              <motion.h1
                className="display-3 fw-bold mb-4"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                Welcome to the Transportation Request Portal
              </motion.h1>
              <motion.p
                className="lead mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Streamline your school district's transportation requests with
                our easy-to-use platform.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <Button
                  variant="warning"
                  size="lg"
                  className="me-3 mb-3"
                  onClick={() => navigate("/register")}
                >
                  Sign Up Free
                </Button>
                <Button
                  variant="outline-light"
                  size="lg"
                  className="mb-3"
                  onClick={() => scrollToSection("features")}
                >
                  Explore Features
                </Button>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </header>

      {/* Features Section */}
      <section id="features" className="py-5 bg-white">
        <Container>
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="mb-4">Key Features</h2>
              <p className="text-muted mb-0">
                Our platform provides everything you need to manage
                transportation requests efficiently.
              </p>
            </Col>
          </Row>
          <Row>
            {[
              {
                title: "Easy Submission",
                icon: "📝",
                description:
                  "Submit transportation requests quickly and easily through our user-friendly interface.",
              },
              {
                title: "Real-time Tracking",
                icon: "🔍",
                description:
                  "Track the status of your requests in real-time, from submission to approval.",
              },
              {
                title: "Secure Data Storage",
                icon: "🔒",
                description:
                  "Rest easy knowing your information is stored securely and can be easily exported when needed.",
              },
            ].map((feature, index) => (
              <Col md={4} key={index} className="mb-4">
                <motion.div
                  className="feature-card text-center p-4"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="feature-icon mb-3">{feature.icon}</div>
                  <h3 className="h4 mb-3">{feature.title}</h3>
                  <p>{feature.description}</p>
                </motion.div>
              </Col>
            ))}
          </Row>
          <Row className="mt-5 text-center">
            <Col>
              <Button
                variant="primary"
                size="lg"
                onClick={() => scrollToSection("contact-form")}
              >
                Request a Demo
              </Button>
            </Col>
          </Row>
        </Container>
      </section>




     {/* CTA Section */}
    <section id="contact" className="cta-section text-white text-center py-5">
      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            <h2 className="mb-4">Ready to Simplify Your Transportation Requests?</h2>
            <p className="lead mb-4">
              Join schools across the country in streamlining their transportation management process.
            </p>

            <Button
              variant="light"
              size="lg"
              className="mb-3"
              onClick={() => navigate("/login")}
            >
              Login to Your Account
            </Button>

            <p className="mt-3 mb-0">
              <small>
                Don’t have an account?{" "}
                <Link
                  to="/register"
                  className="text-white text-decoration-underline fw-bold"
                  style={{ cursor: "pointer" }}
                >
                  Register here
                </Link>
              </small>
            </p>
          </Col>
        </Row>
      </Container>
    </section>






      {/* Contact Form */}
      <section id="contact-form" className="contact-section py-5">
        <Container>
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="mb-4">Contact Us</h2>
              <p className="mb-4">
                Have questions or need assistance? Reach out to us!
              </p>
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col md={6}>
              <form
                className="p-4 bg-white shadow rounded"
                onSubmit={handleFormSubmit}
              >
                <div className="mb-3">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={contactData.name}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Your Email</label>
                  <input
                    type="email"
                    name="email"
                    value={contactData.email}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Your Message</label>
                  <textarea
                    name="message"
                    value={contactData.message}
                    onChange={handleInputChange}
                    className="form-control"
                    rows="4"
                    placeholder="Enter your message"
                    required
                  ></textarea>
                </div>
                <Button variant="primary" type="submit" className="w-100">
                  Send Message
                </Button>
              </form>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <Container>
          <Row>
            <Col md={6} className="mb-3 mb-md-0">
              <h5>Transportation Request Portal</h5>
              <p className="mb-0">
                Simplifying school transportation management
              </p>
            </Col>
            <Col md={6} className="text-md-end">
              <Nav className="justify-content-md-end">
                <Nav.Link href="#" className="text-white">
                  Privacy Policy
                </Nav.Link>
                <Nav.Link href="#" className="text-white">
                  Terms of Service
                </Nav.Link>
                <Nav.Link href="#" className="text-white">
                  Contact Us
                </Nav.Link>
              </Nav>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;
