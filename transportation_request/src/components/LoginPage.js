import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Navbar, Nav, Button, Form, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import '../theme.css';




const LoginPage = () => {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  

  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const db = getFirestore();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;

        console.log("User role found:", userRole);

        if (userRole === 'parent') {
          navigate('/parent-dashboard');
        } else if (userRole === 'district') {
          navigate('/district-dashboard');
        } else if (userRole === 'admin') {
          navigate('/admin-dashboard');
        } else {
          setError('Unknown user role. Please contact support.');
        }
      } else {
        setError('User data not found.');
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message);
    }
  };

  return (
    <motion.div 
      className="login-page d-flex flex-column min-vh-100"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Navbar bg="primary" variant="dark" expand="lg" className="fixed-top">
        <Container>
          <Navbar.Brand href="#" className="fw-bold">Transportation Portal</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse className="justify-content-end">
            <Nav>
              <Nav.Link onClick={() => navigate("/")}>Home</Nav.Link>
              <Button variant="primary" className="ms-2" onClick={() => navigate('/register')}>Register</Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div className="d-flex align-items-center justify-content-center flex-grow-1" style={{ paddingBottom: "80px" }}>
        <Container>
          <Row className="justify-content-center">
            <Col md={5}>
              <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <Card className="p-4 shadow rounded login-card">
                  <Card.Body>
                    <h2 className="text-center mb-4">Login</h2>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <Form onSubmit={handleLogin}>
                      <Form.Group className="mb-3" controlId="formEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="formPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="formCheckbox">
                        <Form.Check type="checkbox" label="Remember me" />
                      </Form.Group>
                      <Button variant="primary" type="submit" className="w-100">Login</Button>
                      <div className="text-center mt-3">
                        <a href="/forgot-password" className="text-primary">Forgot password?</a>
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

export default LoginPage;