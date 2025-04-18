import { useState, useEffect, useMemo, useCallback } from "react"
import { Container, Row, Col, Navbar, Nav, Button, Card, Alert, Modal, Form, Accordion, Badge } from "react-bootstrap"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import TransportationRequestForm from "./TransportationRequestForm"
import { auth, db } from "../firebase"
import { signOut } from "firebase/auth"

import { collection, addDoc, getDocs, query, orderBy, updateDoc, deleteDoc, doc, getDoc, serverTimestamp } from "firebase/firestore"
import "../theme.css"




// Contact Support Modal Component
const ContactSupportForm = ({ show, handleClose, userDistrict, userData }) => {
  const [contactData, setContactData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setContactData({ ...contactData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const user = auth.currentUser

    const supportMessage = {
      ...contactData,
      from: user?.displayName || contactData.name || "Anonymous",
      email: user?.email || contactData.email || "N/A",
      district: userData?.district || "N/A",
      userId: user?.uid || null,
      date: new Date().toISOString(),
      status: "pending",
      priority: "medium",
      role: "parent"
    };

    try {
      await addDoc(collection(db, "support_messages"), supportMessage)
      alert("Your message has been sent successfully!");
      handleClose(); // ✅ Proper way to close the modal
      setContactData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Error sending message:", error.message, error.code);
      alert("Something went wrong while sending your message.");
    }    
    
  }


  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="text-primary">Contact Support</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="contact-form-header">
          <h5>How can we help you?</h5>
          <p className="text-muted">Our support team will respond to your inquiry as soon as possible.</p>
        </div>

        <Form onSubmit={handleSubmit}>
          <div className="contact-form-section">
            <h6 className="mb-3">Your Information</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control type="text" name="name" onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control type="email" name="email" onChange={handleChange} required />
                </Form.Group>
              </Col>
            </Row>
          </div>

          <div className="contact-form-section">
            <h6 className="mb-3">Message Details</h6>
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control type="text" name="subject" onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control as="textarea" rows={5} name="message" onChange={handleChange} required />
            </Form.Group>
          </div>

          <div className="contact-form-footer d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Send Message
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

// Modal to select a child for editing when there are multiple children
const SelectChildModal = ({ show, childrenList, onSelect, onClose }) => {
  const [selectedChild, setSelectedChild] = useState(childrenList.length > 0 ? childrenList[0].id : "")

  useEffect(() => {
    if (childrenList.length > 0) {
      setSelectedChild(childrenList[0].id)
    }
  }, [childrenList])

  const handleSelect = () => {
    const childRequest = childrenList.find((child) => child.id === selectedChild)
    onSelect(childRequest)
  }

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Select Child Request to Edit</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Label>Select Child</Form.Label>
          <Form.Select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)}>
            {childrenList.map((child) => (
              <option key={child.id} value={child.id}>
                {child.studentFirstName} {child.studentLastName} – {child.school}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSelect}>
          Continue
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

// Update the ViewDetailsModal to show exact timestamps
const ViewDetailsModal = ({ show, request, onClose }) => {
  const formatDateTime = (dateString) => {
    if (!dateString) return "Not available"
    const date = new Date(dateString)
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`
  }

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>
          <div className="d-flex align-items-center">Transportation Request Details</div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {request ? (
          <div className="p-2">
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Student Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p className="mb-2">
                      <strong>Name:</strong> {request.studentFirstName} {request.studentLastName}
                    </p>
                    <p className="mb-2">
                      <strong>School:</strong> {request.school}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p className="mb-2">
                      <strong>Grade:</strong> {request.grade || "Not specified"}
                    </p>
                    <p className="mb-2">
                      <strong>School Year:</strong> {request.schoolYear || "Not specified"}
                    </p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Transportation Details</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <h6 className="text-primary mb-2">Pick-Up Information</h6>
                      <p className="mb-1">
                        <strong>Time:</strong> {request.pickupTime || "Not specified"}
                      </p>
                      <p className="mb-1">
                        <strong>Location:</strong> {request.pickupLocation || "Not specified"}
                      </p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <h6 className="text-primary mb-2">Drop-Off Information</h6>
                      <p className="mb-1">
                        <strong>Time:</strong> {request.dropOffTime || "Not specified"}
                      </p>
                      <p className="mb-1">
                        <strong>Location:</strong> {request.dropOffLocation || "Not specified"}
                      </p>
                    </div>
                  </Col>
                </Row>
                <div className="mt-2 pt-2 border-top">
                  <small className="text-muted">Request submitted on {formatDateTime(request.createdAt)}</small>
                </div>
              </Card.Body>
            </Card>
          </div>
        ) : (
          <div className="text-center py-4">
            <p>No details available.</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

// Updated Edit Request Modal Component with Update & Delete options
const EditRequestForm = ({ show, handleClose, request, refreshRequests, addNotification }) => {
  const [formData, setFormData] = useState({
    studentFirstName: "",
    studentLastName: "",
    school: "",
    pickupTime: "",
    dropOffTime: "",
    pickupLocation: "",
    dropOffLocation: "",
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (request) {
      setFormData({
        studentFirstName: request.studentFirstName || "",
        studentLastName: request.studentLastName || "",
        school: request.school || "",
        pickupTime: request.pickupTime || "",
        dropOffTime: request.dropOffTime || "",
        pickupLocation: request.pickupLocation || "",
        dropOffLocation: request.dropOffLocation || "",
      })
    }
  }, [request])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      const docRef = doc(db, "users", auth.currentUser.uid, "transportation_requests", request.id)
      await updateDoc(docRef, formData)
      console.log("Request updated.")
      addNotification("Your transportation request has been updated successfully.")
      refreshRequests()
      handleClose()
    } catch (error) {
      console.error("Error updating request:", error)
    }
  }

  const handleDelete = async () => {
    try {
      const docRef = doc(db, "users", auth.currentUser.uid, "transportation_requests", request.id)
      await deleteDoc(docRef)
      console.log("Request deleted.")
      addNotification("Your transportation request has been deleted successfully.")
      refreshRequests()
      handleClose()
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error("Error deleting request:", error)
    }
  }

  return (
    <>
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <div className="d-flex align-items-center">
              <span className="icon-container icon-edit text-primary"></span>
              Edit Transportation Request
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {request ? (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Student First Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="studentFirstName"
                      value={formData.studentFirstName}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Student Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="studentLastName"
                      value={formData.studentLastName}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>School</Form.Label>
                <Form.Control type="text" name="school" value={formData.school} onChange={handleChange} />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pick-Up Time</Form.Label>
                    <Form.Control type="time" name="pickupTime" value={formData.pickupTime} onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pick-Up Location</Form.Label>
                    <Form.Control
                      type="text"
                      name="pickupLocation"
                      value={formData.pickupLocation}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Drop-Off Time</Form.Label>
                    <Form.Control type="time" name="dropOffTime" value={formData.dropOffTime} onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Drop-Off Location</Form.Label>
                    <Form.Control
                      type="text"
                      name="dropOffLocation"
                      value={formData.dropOffLocation}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          ) : (
            <p>No request data available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-danger" onClick={() => setShowDeleteConfirm(true)}>
            Delete Request
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this transportation request? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete Request
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

// Update the main ParentDashboard component to remove most icons and add exact timestamps
const ParentDashboard = () => {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [user, setUser] = useState(null)
  const [showEdit, setShowEdit] = useState(false)
  const [editRequest, setEditRequest] = useState(null)
  const [applicationData, setApplicationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [showSelectChildModal, setShowSelectChildModal] = useState(false)
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false)
  const [selectedRequestForView, setSelectedRequestForView] = useState(null)
  const [selectedChildProfile, setSelectedChildProfile] = useState(null)
  const [formKey, setFormKey] = useState(0)
  const [userDistrict, setUserDistrict] = useState("")
  const [userData, setUserData] = useState(null);

  const addNotification = (message) => {
    setNotifications((prev) => [...prev, message])
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      }
    };
  
    fetchUserData();
  }, []);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const loadRequests = useCallback(async () => {
    if (!user?.uid) return
  
    try {
      const q = query(
        collection(db, "users", user.uid, "transportation_requests"),
        orderBy("createdAt", "desc")
      )
      const querySnapshot = await getDocs(q)
      const fetchedRequests = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
  
      setRequests(fetchedRequests)
      if (fetchedRequests.length > 0) {
        setApplicationData(selectedChildProfile || fetchedRequests[0])
      } else {
        setApplicationData(null)
      }
    } catch (error) {
      console.error("Error loading transportation requests:", error)
    }
  
    setLoading(false)
  }, [user?.uid, selectedChildProfile])

  
  useEffect(() => {
    if (user?.uid) {
      loadRequests()
    }
  }, [user]) 
  

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        navigate("/login")
        return
      }
  
      try {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setUser({ uid: firebaseUser.uid, ...userData })
          setUserDistrict(userData.district || "")
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      }
    })
  
    return () => unsubscribe()
  }, [navigate])
  
  

  // On form submission, tag the request with user's district
  const handleSubmitRequest = async (data) => {
    if (!user?.uid) {
      console.error("No user is logged in.")
      return
    }
  
    try {
      await addDoc(collection(db, "users", user.uid, "transportation_requests"), {
        ...data,
        createdAt: new Date().toISOString(),
        district: user.district || "",
        status: "pending",
        userId: user.uid,
      })
  
      setShowForm(false)
      loadRequests()
      addNotification("Your transportation request has been submitted successfully.")
    } catch (error) {
      console.error("Error saving transportation request:", error)
    }
  }
  

  // Compute distinct children for the profile dropdown (memoized)
  const distinctChildren = useMemo(() => {
    const distinct = []
    requests.forEach((req) => {
      const fullName = `${req.studentFirstName} ${req.studentLastName}`
      if (!distinct.find((child) => child.fullName === fullName)) {
        distinct.push({ ...req, fullName })
      }
    })
    return distinct
  }, [requests])

  // Handler for selecting a different child in the Student Profile box
  const handleChildProfileChange = (e) => {
    const selectedId = e.target.value
    const child = distinctChildren.find((child) => child.id === selectedId)
    setSelectedChildProfile(child)
    setApplicationData(child)
  }

  // Handler for the Quick Actions "Edit Request" button
  const handleEditRequestQuickAction = () => {
    if (distinctChildren.length === 0) {
      setShowForm(true)
    } else if (distinctChildren.length === 1) {
      openEditModal(distinctChildren[0])
    } else {
      setShowSelectChildModal(true)
    }
  }

  // Open edit modal for a specific request
  const openEditModal = (request) => {
    setEditRequest(request)
    setShowEdit(true)
  }

  // Open view details modal for a specific request
  const handleViewDetails = (request) => {
    setSelectedRequestForView(request)
    setShowViewDetailsModal(true)
  }

  // Dismiss a notification
  const dismissNotification = (index) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index))
  }

  // When "Submit New Request" is clicked, force a fresh form by incrementing formKey
  const handleNewRequest = () => {
    setFormKey((prev) => prev + 1)
    setShowForm(true)
  }

  // Get status badge for a request
  const getStatusBadge = (request) => {
    const statusMap = {
      pending: { label: "Pending", variant: "warning" },
      approved: { label: "Approved", variant: "success" },
      rejected: { label: "Rejected", variant: "danger" },
      "on-hold": { label: "On Hold", variant: "info" },
      completed: { label: "Completed", variant: "primary" },
    }
  
    const statusData = statusMap[request.status] || { label: "Unknown", variant: "secondary" }
  
    return (
      <Badge bg={statusData.variant} className="px-3 py-2">
        {statusData.label}
      </Badge>
    )
  }
  

  // Format date and time for display
  const formatDateTime = (dateString) => {
    if (!dateString) return "Not available"
    const date = new Date(dateString)
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`
  }

  return (
    <motion.div
      className="dashboard-page d-flex flex-column min-vh-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Navigation Bar */}
      <Navbar bg="primary" variant="dark" expand="lg" className="fixed-top dashboard-navbar">
        <Container>
          <Navbar.Brand href="#" className="fw-bold">
            Transportation Portal
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse className="justify-content-end">
            <Nav>
              <Button variant="outline-light" className="me-3" onClick={() => setShowContact(true)}>
                Contact Support
              </Button>
              <Button variant="light" onClick={handleLogout}>
                Log Out
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <Container className="mt-4 pt-4">
        <Row className="mb-4">
          <Col>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h2 className="mb-3">Parent Dashboard</h2>
              {userDistrict && (
                <p className="text-muted mb-3">
                  <strong>School District:</strong> {userDistrict}
                </p>
              )}
            </motion.div>
          </Col>
        </Row>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="mb-4 border-0 shadow-sm quick-actions">
            <Card.Body>
              <h5 className="card-title mb-3">Quick Actions</h5>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                <Button variant="primary" className="px-4" onClick={handleNewRequest}>
                  New Request
                </Button>
                <Button variant="outline-primary" className="px-4" onClick={handleEditRequestQuickAction}>
                  Edit Request
                </Button>
                <Button variant="outline-primary" className="px-4" onClick={() => setShowContact(true)}>
                  Contact Support
                </Button>
              </div>
            </Card.Body>
          </Card>
        </motion.div>

        <Row className="mb-4">
          {/* Student Profile */}
          <Col lg={6} className="mb-4 mb-lg-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">Student Profile</h5>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center py-4">
                      <p>Loading student information...</p>
                    </div>
                  ) : distinctChildren.length > 0 ? (
                    <>
                      {distinctChildren.length > 1 && (
                        <Form.Group className="mb-4">
                          <Form.Label>Select Student</Form.Label>
                          <Form.Select
                            onChange={handleChildProfileChange}
                            value={applicationData ? applicationData.id : ""}
                            className="mb-3"
                          >
                            {distinctChildren.map((child) => (
                              <option key={child.id} value={child.id}>
                                {child.studentFirstName} {child.studentLastName} – {child.school}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      )}

                      {applicationData && (
                        <div className="p-3 bg-light rounded">
                          <div className="d-flex align-items-center mb-3">
                            <div className="bg-primary text-white rounded-circle p-3 me-3">
                              {applicationData.studentFirstName?.charAt(0) || ""}
                              {applicationData.studentLastName?.charAt(0) || ""}
                            </div>
                            <div>
                              <h5 className="mb-1">
                                {applicationData.studentFirstName} {applicationData.studentLastName}
                              </h5>
                              <p className="text-muted mb-0">{applicationData.school || "School not specified"}</p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <p className="mb-2">
                              <strong>Grade:</strong> {applicationData.grade || "Not specified"}
                            </p>
                            <p className="mb-2">
                              <strong>School Year:</strong> {applicationData.schoolYear || "Not specified"}
                            </p>
                            <p className="mb-0">
                              <strong>District:</strong> {applicationData.district || userDistrict || "Not specified"}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p>No student profiles found.</p>
                      <Button variant="primary" onClick={handleNewRequest} className="mt-2">
                        Add Student Request
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          </Col>

          {/* Application Status */}
          <Col lg={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">Application Status</h5>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center py-4">
                      <p>Loading application status...</p>
                    </div>
                  ) : applicationData ? (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h6 className="mb-0">Current Status</h6>
                        {getStatusBadge(applicationData)}
                      </div>

                      <div className="mb-4">
                        <h6 className="text-muted mb-2">Transportation Details</h6>
                        <div className="mb-2">
                          <p className="mb-0">
                            <strong>Pick-up:</strong> {applicationData.pickupTime || "Not specified"}
                          </p>
                          <p className="mb-0 text-muted small">
                            {applicationData.pickupLocation || "Location not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="mb-0">
                            <strong>Drop-off:</strong> {applicationData.dropOffTime || "Not specified"}
                          </p>
                          <p className="mb-0 text-muted small">
                            {applicationData.dropOffLocation || "Location not specified"}
                          </p>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <span className="timestamp">Submitted: {formatDateTime(applicationData.createdAt)}</span>
                        <Button variant="outline-primary" size="sm" onClick={() => handleViewDetails(applicationData)}>
                          View Full Details
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Alert variant="warning" className="mb-3">
                        You have not submitted an application yet.
                      </Alert>
                      <Button variant="primary" onClick={handleNewRequest}>
                        Submit New Request
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Active Requests Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Active Requests</h5>
              <Badge bg="light" text="primary" className="px-3 py-2">
                {requests.length} {requests.length === 1 ? "Request" : "Requests"}
              </Badge>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <p>Loading your requests...</p>
                </div>
              ) : requests.length > 0 ? (
                <Row>
                  {requests.map((request) => (
                    <Col lg={6} key={request.id} className="mb-3">
                      <Card className="h-100 border-0 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h5 className="mb-1">
                                {request.studentFirstName} {request.studentLastName}
                              </h5>
                              <p className="text-muted mb-0">{request.school}</p>
                            </div>
                            {getStatusBadge(request)}
                          </div>

                          <div className="mb-3">
                            <div className="mb-2">
                              <p className="mb-0">
                                <strong>Pick-up:</strong> {request.pickupTime || "Not specified"}
                              </p>
                              <p className="mb-0 text-muted small">
                                {request.pickupLocation || "Location not specified"}
                              </p>
                            </div>
                            <div>
                              <p className="mb-0">
                                <strong>Drop-off:</strong> {request.dropOffTime || "Not specified"}
                              </p>
                              <p className="mb-0 text-muted small">
                                {request.dropOffLocation || "Location not specified"}
                              </p>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between mt-3 pt-2 border-top">
                            <span className="timestamp">Submitted: {formatDateTime(request.createdAt)}</span>
                            <div>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={() => openEditModal(request)}
                              >
                                Edit
                              </Button>
                              <Button variant="outline-secondary" size="sm" onClick={() => handleViewDetails(request)}>
                                View
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-4">
                  <Alert variant="warning" className="mb-3">
                    You have not submitted any transportation requests yet.
                  </Alert>
                  <Button variant="primary" onClick={handleNewRequest}>
                    Submit New Request
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Notifications</h5>
            </Card.Header>
            <Card.Body>
              {notifications.length > 0 ? (
                <div>
                  {notifications.map((note, index) => (
                    <Alert
                      key={index}
                      variant="success"
                      dismissible
                      onClose={() => dismissNotification(index)}
                      className="mb-2"
                    >
                      {note}
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-muted mb-0">No notifications at this time.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Frequently Asked Questions</h5>
            </Card.Header>
            <Card.Body>
              <Accordion>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>How do I submit a transportation request?</Accordion.Header>
                  <Accordion.Body>
                    Click "Submit New Request" and fill out the form step by step. Once submitted, your request will be
                    saved and visible under Active Requests.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>How do I track my request?</Accordion.Header>
                  <Accordion.Body>
                    Your active requests display key details such as pick-up and drop-off times. Click "View Details"
                    for a full breakdown.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="2">
                  <Accordion.Header>Who can I contact for help?</Accordion.Header>
                  <Accordion.Body>
                    Click "Contact Support" to send us a message, and we'll get back to you as soon as possible.
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Card.Body>
          </Card>
        </motion.div>
      </Container>

      {/* Transportation Request Form Modal */}
      <TransportationRequestForm
        key={formKey}
        show={showForm}
        handleClose={() => setShowForm(false)}
        initialData={null}
        onSubmit={handleSubmitRequest}
      />

      {/* Contact Support Form Modal - Improved in the component above */}
      <ContactSupportForm
        show={showContact}
        handleClose={() => setShowContact(false)}
        userDistrict={userDistrict}
        userData={userData}
      />




      {/* Edit Request Modal with Update & Delete */}
      {editRequest && (
        <EditRequestForm
          show={showEdit}
          handleClose={() => setShowEdit(false)}
          request={editRequest}
          refreshRequests={loadRequests}
          addNotification={addNotification}
        />
      )}

      {/* Select Child Modal for Editing when multiple children exist */}
      <SelectChildModal
        show={showSelectChildModal}
        childrenList={distinctChildren}
        onSelect={(childRequest) => {
          setShowSelectChildModal(false)
          openEditModal(childRequest)
        }}
        onClose={() => setShowSelectChildModal(false)}
      />

      {/* View Details Modal - Updated to show exact timestamps */}
      <ViewDetailsModal
        show={showViewDetailsModal}
        request={selectedRequestForView}
        onClose={() => setShowViewDetailsModal(false)}
      />

      {/* Footer */}
      <footer className="bg-dark text-white py-4 mt-auto">
        <Container>
          <Row>
            <Col md={6} className="mb-3 mb-md-0">
              <h5>Transportation Request Portal</h5>
              <p className="mb-0">Simplifying school transportation management</p>
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
    </motion.div>
  )
}

export default ParentDashboard;


