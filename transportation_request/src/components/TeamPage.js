"use client"

import { useEffect } from "react"
import { Container, Row, Col, Navbar, Nav, Card } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import "../theme.css"

const TeamPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const teamMembers = [
    {
      name: "Joseph Cedeno",
      role: "Project Lead",
      image: "/attachments/joseph.jpeg",
      bio: "Joseph oversees the project and ensures the team stays aligned with its goals.",
    },
    {
      name: "Sritha Kankanala",
      role: "Project Manager",
      image: "/attachments/srithaPage.jpeg",
      bio: "Sritha manages timelines and coordination to keep the project on track.",
    },
    {
      name: "Avi Shah",
      role: "Lead Developer",
      image: "/attachments/aviPic.png",
      bio: "Avi leads development efforts and builds the core systems of the application.",
    },
    {
      name: "Abhinav Gitta",
      role: "Backend Developer",
      image: "/attachments/abhinavPic.jpg",
      bio: "Abhinav handles backend development and ensures data is managed efficiently.",
    },
    {
      name: "Swetha Kodali",
      role: "Developer",
      image: "/attachments/swethaPic.jpeg",
      bio: "Swetha contributes across the stack, focusing on functionality and usability.",
    },
    {
      name: "Dyson Bawol",
      role: "Developer",
      image: "/attachments/dysonPic.jpeg",
      bio: "Dyson works on front-end development to deliver a seamless user experience.",
    },
  ]
  

  return (
    <div className="team-page-wrapper">
      {/* Navigation Bar */}
      <Navbar bg="primary" variant="dark" expand="lg" className="fixed-top shadow-sm">
        <Container>
          <Navbar.Brand className="fw-bold">Transportation Portal</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse className="justify-content-end">
            <Nav>
              <Nav.Link onClick={() => navigate("/")}>Home</Nav.Link>
              <Nav.Link onClick={() => navigate("/register")}>Register</Nav.Link>
              <Nav.Link onClick={() => navigate("/login")}>Login</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section className="team-hero bg-gradient-primary text-white text-center d-flex align-items-center justify-content-center">
        <div className="team-hero-overlay"></div>
        <Container className="team-hero-content py-5">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="display-4 fw-bold">Meet Our Team</h1>
            <p className="lead">Passionate high school innovators from the Center for Information Technology</p>
          </motion.div>
        </Container>
      </section>

      {/* Mission Statement */}
      <section className="team-mission">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <motion.div className="mission-content text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
                <h2>Our Mission</h2>
                <p>
                  We're students at CIT, dedicated to solving real-world problems through technology. This portal helps
                  streamline school transportation and enhances communication between families and school districts.
                </p>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Team Members Section */}
      <section className="team-members-section">
        <Container>
          <motion.div className="section-header text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
            <h2>The Team</h2>
            <p className="lead">The brains and hearts behind this project</p>
          </motion.div>

          <div className="team-members-grid">
            {teamMembers.map((member, index) => (
              <motion.div
                className="team-member-card"
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="member-image-container">
                  <img src={member.image} alt={member.name} className="member-image" />
                </div>
                <div className="member-info">
                  <h3>{member.name}</h3>
                  <span className="member-role">{member.role}</span>
                  <p className="member-bio">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Core Values */}
      <section className="team-values">
        <Container>
          <div className="values-content text-center">
            <h2>CIT Core Values</h2>
            <p>What drives our work and collaboration</p>
          </div>

          <Row>
            {[
              { icon: "T", title: "Teamwork", text: "We build together, leveraging everyone's strengths." },
              { icon: "I", title: "Integrity", text: "We act with honesty and strong moral principles." },
              { icon: "E", title: "Excellence", text: "We strive to deliver high-quality results in everything." },
              { icon: "R", title: "Respect", text: "We value every voice and treat each other with kindness." },
            ].map((val, idx) => (
              <Col md={3} sm={6} className="mb-4" key={idx}>
                <motion.div className="text-center p-4 bg-white rounded shadow-sm h-100" whileHover={{ y: -10 }}>
                  <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "70px", height: "70px" }}>
                    <i className="fs-3">{val.icon}</i>
                  </div>
                  <h4 className="mb-2">{val.title}</h4>
                  <p className="mb-0 text-muted">{val.text}</p>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="team-footer">
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
    </div>
  )
}

export default TeamPage
