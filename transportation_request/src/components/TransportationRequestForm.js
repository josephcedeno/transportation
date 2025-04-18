import { useState, useEffect } from "react"
import { Row, Col, Form, Button, Modal, Card, Alert } from "react-bootstrap"

const TransportationRequestForm = ({ show, handleClose, initialData, onSubmit }) => {
  const totalSteps = 5 
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Basic Information
    studentFirstName: "",
    studentLastName: "",
    school: "",
    studentId: "",
    grade: "",
    schoolYear: "",
    needsAttended: false,
    nonVerbal: false,
    gender: "",
    // Parent/Guardian Information
    parent1FirstName: "",
    parent1LastName: "",
    parent1Phone: "",
    parent1Email: "",
    parent1Relationship: "",
    hasGuardian2: false,
    parent2FirstName: "",
    parent2LastName: "",
    parent2Phone: "",
    parent2Email: "",
    parent2Relationship: "",
    // Address Information
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    // Transportation Details
    pickupTime: "",
    pickupLocation: "",
    dropOffTime: "",
    dropOffLocation: "",
    // Emergency Contacts
    emergencyContact1Name: "",
    emergencyContact1Phone: "",
    emergencyContact1Relationship: "",
    emergencyContact2Name: "",
    emergencyContact2Phone: "",
    emergencyContact2Relationship: "",
    preferredHospital: "",
    additionalEmergencyInstructions: "",
    // Health Information
    hasMedicalNeeds: false,
    medicalDevices: [],
    otherMedicalDevice: "",
    medicalAmenities: [],
    vestSize: "",
    dnr: false,
    dnrDocumentation: null,
    dnrLegalAcknowledgment: false,
    dnrSignature: "",
    // Caretaker Information
    hasCaretaker: false,
    caretakerName: "",
    caretakerPhone: "",
    // Behavioral Information
    behavioralNeeds: {
      aggressiveBehavior: false,
      elopementRisk: false,
      easilyOverwhelmed: false,
      other: false,
    },
    behavioralStrategies: "",
    // Consent & Agreement
    parentalConsent: false,
    policyAgreement: false,
    digitalSignature: "",
    signatureDate: "",
    // Documentation Upload
    requiredDocuments: null,
    supportingDocuments: null,
    // Additional Comments
    additionalComments: "",
    // Status for admin tracking
    status: "pending",
    hasDNRFlag: false,
    requiresMedicalSupport: false,
  })

  // DNR Modal state
  const [showDnrModal, setShowDnrModal] = useState(false)

  // Form validation state
  const [validated, setValidated] = useState(false)
  const [errors, setErrors] = useState({})

  // Pre-populate formData with initialData if available
  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData])

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target

    if (type === "checkbox" && name.startsWith("behavioralNeeds.")) {
      const behaviorType = name.split(".")[1]
      setFormData({
        ...formData,
        behavioralNeeds: {
          ...formData.behavioralNeeds,
          [behaviorType]: checked,
        },
      })
    } else if (type === "checkbox" && (name === "medicalDevices" || name === "medicalAmenities")) {
      // Handle multiple checkboxes for medical devices and amenities
      const option = value
      const currentSelections = formData[name] || []

      if (checked) {
        setFormData({
          ...formData,
          [name]: [...currentSelections, option],
        })
      } else {
        setFormData({
          ...formData,
          [name]: currentSelections.filter((item) => item !== option),
        })
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
      })

      // Set hasMedicalNeeds to true if any medical device is selected
      if (name === "medicalDevices" && value !== "None" && checked) {
        setFormData((prev) => ({
          ...prev,
          hasMedicalNeeds: true,
          requiresMedicalSupport: true,
        }))
      }

      // Update DNR flag for admin tracking
      if (name === "dnr") {
        setFormData((prev) => ({
          ...prev,
          hasDNRFlag: checked,
        }))

        if (checked) {
          setShowDnrModal(true)
        }
      }
    }
  }

  // Handle DNR modal submission
  const handleDnrModalSubmit = () => {
    if (!formData.dnrDocumentation || !formData.dnrLegalAcknowledgment || !formData.dnrSignature) {
      alert("Please complete all required fields for DNR documentation")
      return
    }

    setShowDnrModal(false)
  }

  // Handle DNR modal cancellation
  const handleDnrModalCancel = () => {
    setFormData({
      ...formData,
      dnr: false,
      dnrDocumentation: null,
      dnrLegalAcknowledgment: false,
      dnrSignature: "",
      hasDNRFlag: false,
    })
    setShowDnrModal(false)
  }

  // Toggle functions
  const toggleGuardian2 = () => {
    setFormData({ ...formData, hasGuardian2: !formData.hasGuardian2 })
  }

  const toggleCaretaker = () => {
    setFormData({ ...formData, hasCaretaker: !formData.hasCaretaker })
  }

  const toggleMedicalNeeds = () => {
    setFormData({
      ...formData,
      hasMedicalNeeds: !formData.hasMedicalNeeds,
      requiresMedicalSupport: !formData.hasMedicalNeeds,
    })
  }

  // Validate current step
  const validateStep = () => {
    const newErrors = {}
    let isValid = true

    // Validate based on current step
    if (step === 1) {
      // Student Information validation
      if (!formData.studentFirstName) {
        newErrors.studentFirstName = "First name is required"
        isValid = false
      }
      if (!formData.studentLastName) {
        newErrors.studentLastName = "Last name is required"
        isValid = false
      }
      if (!formData.school) {
        newErrors.school = "School is required"
        isValid = false
      }
      if (!formData.grade) {
        newErrors.grade = "Grade is required"
        isValid = false
      }
      if (!formData.schoolYear) {
        newErrors.schoolYear = "School year is required"
        isValid = false
      }
      if (!formData.streetAddress) {
        newErrors.streetAddress = "Street address is required"
        isValid = false
      }
      if (!formData.city) {
        newErrors.city = "City is required"
        isValid = false
      }
      if (!formData.state) {
        newErrors.state = "State is required"
        isValid = false
      }
      if (!formData.zipCode) {
        newErrors.zipCode = "ZIP code is required"
        isValid = false
      }
    } else if (step === 2) {
      // Parent/Guardian Information validation
      if (!formData.parent1FirstName) {
        newErrors.parent1FirstName = "Parent/guardian first name is required"
        isValid = false
      }
      if (!formData.parent1LastName) {
        newErrors.parent1LastName = "Parent/guardian last name is required"
        isValid = false
      }
      if (!formData.parent1Phone) {
        newErrors.parent1Phone = "Phone number is required"
        isValid = false
      } else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.parent1Phone)) {
        newErrors.parent1Phone = "Phone must be in format (123) 456-7890"
        isValid = false
      }
      if (!formData.parent1Relationship) {
        newErrors.parent1Relationship = "Relationship is required"
        isValid = false
      }

      // Validate second guardian if added
      if (formData.hasGuardian2) {
        if (formData.parent2Phone && !/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.parent2Phone)) {
          newErrors.parent2Phone = "Phone must be in format (123) 456-7890"
          isValid = false
        }
      }
    } else if (step === 3) {
      // Transportation Details validation
      if (!formData.pickupTime) {
        newErrors.pickupTime = "Pick-up time is required"
        isValid = false
      }
      if (!formData.pickupLocation) {
        newErrors.pickupLocation = "Pick-up location is required"
        isValid = false
      }
      if (!formData.dropOffTime) {
        newErrors.dropOffTime = "Drop-off time is required"
        isValid = false
      }
      if (!formData.dropOffLocation) {
        newErrors.dropOffLocation = "Drop-off location is required"
        isValid = false
      }
    } else if (step === 4) {
      // Emergency Contacts validation
      if (!formData.emergencyContact1Name) {
        newErrors.emergencyContact1Name = "At least one emergency contact is required"
        isValid = false
      }
      if (!formData.emergencyContact1Phone) {
        newErrors.emergencyContact1Phone = "Emergency contact phone is required"
        isValid = false
      } else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.emergencyContact1Phone)) {
        newErrors.emergencyContact1Phone = "Phone must be in format (123) 456-7890"
        isValid = false
      }
      if (!formData.emergencyContact1Relationship) {
        newErrors.emergencyContact1Relationship = "Relationship is required"
        isValid = false
      }

      // Validate DNR if checked
      if (formData.dnr) {
        if (!formData.dnrDocumentation) {
          newErrors.dnrDocumentation = "DNR documentation is required"
          isValid = false
        }
        if (!formData.dnrLegalAcknowledgment) {
          newErrors.dnrLegalAcknowledgment = "Legal acknowledgment is required"
          isValid = false
        }
        if (!formData.dnrSignature) {
          newErrors.dnrSignature = "Signature is required for DNR"
          isValid = false
        }
      }
    } else if (step === 5) {
      // Consent & Review validation
      if (!formData.parentalConsent) {
        newErrors.parentalConsent = "Consent is required"
        isValid = false
      }
      if (!formData.policyAgreement) {
        newErrors.policyAgreement = "Agreement to policies is required"
        isValid = false
      }
      if (!formData.digitalSignature) {
        newErrors.digitalSignature = "Digital signature is required"
        isValid = false
      }
      if (!formData.signatureDate) {
        newErrors.signatureDate = "Signature date is required"
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const nextStep = () => {
    if (validateStep()) {
      if (step < totalSteps) setStep(step + 1)
    } else {
      setValidated(true)
    }
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateStep()) {
      // Set today's date for signature if not already set
      if (!formData.signatureDate) {
        const today = new Date().toISOString().split("T")[0]
        setFormData({
          ...formData,
          signatureDate: today,
        })
      }

      onSubmit(formData)
      handleClose()
    } else {
      setValidated(true)
    }
  }

  // Get step title
  const getStepTitle = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return "Student Information"
      case 2:
        return "Parent/Guardian Information"
      case 3:
        return "Transportation Details"
      case 4:
        return "Health & Emergency Information"
      case 5:
        return "Review & Submit"
      default:
        return ""
    }
  }

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    if (!value) return value

    const phoneNumber = value.replace(/[^\d]/g, "")
    const phoneNumberLength = phoneNumber.length

    if (phoneNumberLength < 4) return phoneNumber
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }

  // Handle phone number input
  const handlePhoneChange = (e) => {
    const formattedPhoneNumber = formatPhoneNumber(e.target.value)
    setFormData({
      ...formData,
      [e.target.name]: formattedPhoneNumber,
    })
  }

  // Render step indicators
  const renderStepIndicators = () => {
    return (
      <div className="step-indicators d-flex justify-content-between mb-4">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNum) => (
          <div
            key={stepNum}
            className={`step-indicator ${step === stepNum ? "active" : ""} ${step > stepNum ? "completed" : ""}`}
            onClick={() => setStep(stepNum)}
          >
            <div className="step-number">{stepNum}</div>
            <div className="step-title">{getStepTitle(stepNum)}</div>
          </div>
        ))}
      </div>
    )
  }

  // Render DNR Modal
  const renderDnrModal = () => {
    return (
      <Modal show={showDnrModal} onHide={handleDnrModalCancel} backdrop="static" centered>
        <Modal.Header closeButton className="bg-warning text-white">
          <Modal.Title>Do Not Resuscitate (DNR) Documentation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-4">
            <h5>Important Legal Information</h5>
            <p>
              A Do Not Resuscitate (DNR) order is a legal document that prevents medical staff from performing CPR. This
              is a serious medical and legal decision that requires proper documentation.
            </p>
          </Alert>

          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">
              Upload DNR Documentation <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="file"
              name="dnrDocumentation"
              onChange={handleChange}
              isInvalid={validated && errors.dnrDocumentation}
              required
            />
            <Form.Text className="text-muted">
              Please upload the official DNR documentation signed by a physician. Only PDF files are accepted (max 5MB).
            </Form.Text>
            <Form.Control.Feedback type="invalid">{errors.dnrDocumentation}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Check
              type="checkbox"
              id="dnrLegalAcknowledgment"
              label="I understand that this is a legal declaration and I have provided valid DNR documentation signed by a physician."
              name="dnrLegalAcknowledgment"
              checked={formData.dnrLegalAcknowledgment}
              onChange={handleChange}
              isInvalid={validated && errors.dnrLegalAcknowledgment}
              required
            />
            <Form.Control.Feedback type="invalid">{errors.dnrLegalAcknowledgment}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">
              Digital Signature <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="dnrSignature"
              value={formData.dnrSignature}
              onChange={handleChange}
              placeholder="Type your full legal name"
              isInvalid={validated && errors.dnrSignature}
              required
            />
            <Form.Control.Feedback type="invalid">{errors.dnrSignature}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleDnrModalCancel}>
            Cancel
          </Button>
          <Button variant="warning" onClick={handleDnrModalSubmit}>
            Confirm DNR Documentation
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }

  const renderStep = () => {
    switch (step) {
      case 1: // Student Information
        return (
          <div className="form-section">
            <h4 className="section-title">Student Information</h4>
            <p className="section-description">
              Please provide basic information about the student requiring transportation.
            </p>

            <div className="form-section-content">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      First Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="studentFirstName"
                      value={formData.studentFirstName}
                      onChange={handleChange}
                      isInvalid={validated && errors.studentFirstName}
                      required
                    />
                    <Form.Control.Feedback type="invalid">{errors.studentFirstName}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Last Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="studentLastName"
                      value={formData.studentLastName}
                      onChange={handleChange}
                      isInvalid={validated && errors.studentLastName}
                      required
                    />
                    <Form.Control.Feedback type="invalid">{errors.studentLastName}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      School <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      name="school"
                      value={formData.school}
                      onChange={handleChange}
                      isInvalid={validated && errors.school}
                      required
                    >
                      <option value="">Select School</option>
                      <option>Deep Run High School</option>
                      <option>Douglas S. Freeman High School</option>
                      <option>Mills G. Godwin High School</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.school}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Student ID</Form.Label>
                    <Form.Control type="text" name="studentId" value={formData.studentId} onChange={handleChange} />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      Grade <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      isInvalid={validated && errors.grade}
                      required
                    >
                      <option value="">Select Grade</option>
                      {[...Array(13).keys()].map((i) => (
                        <option key={i} value={i === 0 ? "Pre-K" : i}>
                          {i === 0 ? "Pre-K" : i}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.grade}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      School Year <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      name="schoolYear"
                      value={formData.schoolYear}
                      onChange={handleChange}
                      isInvalid={validated && errors.schoolYear}
                      required
                    >
                      <option value="">Select Year</option>
                      <option>2024-2025</option>
                      <option>2025-2026</option>
                      <option>2026-2027</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.schoolYear}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Student Address</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>
                          Street Address <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="streetAddress"
                          value={formData.streetAddress}
                          onChange={handleChange}
                          placeholder="Street Address"
                          isInvalid={validated && errors.streetAddress}
                          required
                        />
                        <Form.Control.Feedback type="invalid">{errors.streetAddress}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={5}>
                      <Form.Group>
                        <Form.Label>
                          City <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="City"
                          isInvalid={validated && errors.city}
                          required
                        />
                        <Form.Control.Feedback type="invalid">{errors.city}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>
                          State <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="State"
                          isInvalid={validated && errors.state}
                          required
                        />
                        <Form.Control.Feedback type="invalid">{errors.state}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>
                          ZIP Code <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleChange}
                          placeholder="ZIP Code"
                          isInvalid={validated && errors.zipCode}
                          required
                        />
                        <Form.Control.Feedback type="invalid">{errors.zipCode}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <div className="special-needs-section mt-4">
                <h5>Special Considerations</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="needsAttended"
                        label="Student needs to be attended by a parent/guardian when boarding or departing the bus"
                        name="needsAttended"
                        checked={formData.needsAttended}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Check
                        type="checkbox"
                        id="nonVerbal"
                        label="Student is non-verbal in English"
                        name="nonVerbal"
                        checked={formData.nonVerbal}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            </div>
          </div>
        )

      case 2: // Parent/Guardian Information
        return (
          <div className="form-section">
            <h4 className="section-title">Parent/Guardian Information</h4>
            <p className="section-description">
              Please provide contact information for the student's parents or guardians.
            </p>

            <div className="form-section-content">
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">
                    Primary Parent/Guardian <span className="text-danger">*</span>
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          First Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="parent1FirstName"
                          value={formData.parent1FirstName}
                          onChange={handleChange}
                          isInvalid={validated && errors.parent1FirstName}
                          required
                        />
                        <Form.Control.Feedback type="invalid">{errors.parent1FirstName}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Last Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="parent1LastName"
                          value={formData.parent1LastName}
                          onChange={handleChange}
                          isInvalid={validated && errors.parent1LastName}
                          required
                        />
                        <Form.Control.Feedback type="invalid">{errors.parent1LastName}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          Phone Number <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="tel"
                          name="parent1Phone"
                          value={formData.parent1Phone}
                          onChange={handlePhoneChange}
                          isInvalid={validated && errors.parent1Phone}
                          required
                          placeholder="(123) 456-7890"
                        />
                        <Form.Control.Feedback type="invalid">{errors.parent1Phone}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          name="parent1Email"
                          value={formData.parent1Email}
                          onChange={handleChange}
                          placeholder="email@example.com"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          Relationship to Student <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="parent1Relationship"
                          value={formData.parent1Relationship}
                          onChange={handleChange}
                          isInvalid={validated && errors.parent1Relationship}
                          required
                        >
                          <option value="">Select Relationship</option>
                          <option>Mother</option>
                          <option>Father</option>
                          <option>Guardian</option>
                          <option>Other</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{errors.parent1Relationship}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <div className="d-flex align-items-center mb-3">
                <Form.Check
                  type="checkbox"
                  id="hasGuardian2"
                  label="Add a second parent/guardian"
                  checked={formData.hasGuardian2}
                  onChange={toggleGuardian2}
                  className="me-2"
                />
              </div>

              {formData.hasGuardian2 && (
                <Card className="mb-4 border-0 shadow-sm">
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">Secondary Parent/Guardian</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>First Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="parent2FirstName"
                            value={formData.parent2FirstName}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="parent2LastName"
                            value={formData.parent2LastName}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Phone Number</Form.Label>
                          <Form.Control
                            type="tel"
                            name="parent2Phone"
                            value={formData.parent2Phone}
                            onChange={handlePhoneChange}
                            isInvalid={validated && errors.parent2Phone}
                            placeholder="(123) 456-7890"
                          />
                          <Form.Control.Feedback type="invalid">{errors.parent2Phone}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            name="parent2Email"
                            value={formData.parent2Email}
                            onChange={handleChange}
                            placeholder="email@example.com"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Relationship to Student</Form.Label>
                          <Form.Select
                            name="parent2Relationship"
                            value={formData.parent2Relationship}
                            onChange={handleChange}
                          >
                            <option value="">Select Relationship</option>
                            <option>Mother</option>
                            <option>Father</option>
                            <option>Guardian</option>
                            <option>Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}
            </div>
          </div>
        )

      case 3: // Transportation Details
        return (
          <div className="form-section">
            <h4 className="section-title">Transportation Details</h4>
            <p className="section-description">Please provide information about the student's transportation needs.</p>

            <div className="form-section-content">
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Pick-Up Information</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Pick-Up Time <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="time"
                          name="pickupTime"
                          value={formData.pickupTime}
                          onChange={handleChange}
                          isInvalid={validated && errors.pickupTime}
                          required
                        />
                        <Form.Control.Feedback type="invalid">{errors.pickupTime}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Pick-Up Location <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="pickupLocation"
                          value={formData.pickupLocation}
                          onChange={handleChange}
                          isInvalid={validated && errors.pickupLocation}
                          required
                          placeholder="Enter specific location details"
                        />
                        <Form.Text className="text-muted">
                          Provide specific details about the pick-up location
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">{errors.pickupLocation}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Drop-Off Information</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Drop-Off Time <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="time"
                          name="dropOffTime"
                          value={formData.dropOffTime}
                          onChange={handleChange}
                          isInvalid={validated && errors.dropOffTime}
                          required
                        />
                        <Form.Control.Feedback type="invalid">{errors.dropOffTime}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Drop-Off Location <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="dropOffLocation"
                          value={formData.dropOffLocation}
                          onChange={handleChange}
                          isInvalid={validated && errors.dropOffLocation}
                          required
                          placeholder="Enter specific location details"
                        />
                        <Form.Text className="text-muted">
                          Provide specific details about the drop-off location
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">{errors.dropOffLocation}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          </div>
        )

      case 4: // Health & Emergency Information
        return (
          <div className="form-section">
            <h4 className="section-title">Health & Emergency Information</h4>
            <p className="section-description">
              Please provide health information and emergency contacts for the student.
            </p>

            <div className="form-section-content">
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">
                    Emergency Contacts <span className="text-danger">*</span>
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Alert variant="info" className="mb-3">
                    <p className="mb-0">
                      Please provide at least one emergency contact other than the parent/guardian.
                    </p>
                  </Alert>

                  <Row className="mb-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>
                          Contact #1 Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="emergencyContact1Name"
                          value={formData.emergencyContact1Name}
                          onChange={handleChange}
                          isInvalid={validated && errors.emergencyContact1Name}
                          required
                        />
                        <Form.Control.Feedback type="invalid">{errors.emergencyContact1Name}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>
                          Phone <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="tel"
                          name="emergencyContact1Phone"
                          value={formData.emergencyContact1Phone}
                          onChange={handlePhoneChange}
                          isInvalid={validated && errors.emergencyContact1Phone}
                          required
                          placeholder="(123) 456-7890"
                        />
                        <Form.Control.Feedback type="invalid">{errors.emergencyContact1Phone}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>
                          Relationship <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="emergencyContact1Relationship"
                          value={formData.emergencyContact1Relationship}
                          onChange={handleChange}
                          isInvalid={validated && errors.emergencyContact1Relationship}
                          required
                        >
                          <option value="">Select Relationship</option>
                          <option>Parent</option>
                          <option>Guardian</option>
                          <option>Relative</option>
                          <option>Neighbor</option>
                          <option>Friend</option>
                          <option>Other</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.emergencyContact1Relationship}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Contact #2 Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="emergencyContact2Name"
                          value={formData.emergencyContact2Name}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="emergencyContact2Phone"
                          value={formData.emergencyContact2Phone}
                          onChange={handlePhoneChange}
                          placeholder="(123) 456-7890"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Relationship</Form.Label>
                        <Form.Select
                          name="emergencyContact2Relationship"
                          value={formData.emergencyContact2Relationship}
                          onChange={handleChange}
                        >
                          <option value="">Select Relationship</option>
                          <option>Parent</option>
                          <option>Guardian</option>
                          <option>Relative</option>
                          <option>Neighbor</option>
                          <option>Friend</option>
                          <option>Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Preferred Hospital (Optional)</Form.Label>
                        <Form.Control
                          type="text"
                          name="preferredHospital"
                          value={formData.preferredHospital}
                          onChange={handleChange}
                          placeholder="Enter preferred hospital name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Additional Emergency Instructions</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          name="additionalEmergencyInstructions"
                          value={formData.additionalEmergencyInstructions}
                          onChange={handleChange}
                          placeholder="Enter any special instructions for emergencies"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Health Information</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="hasMedicalNeeds"
                      label="Student has medical needs that require support during transportation"
                      checked={formData.hasMedicalNeeds}
                      onChange={toggleMedicalNeeds}
                    />
                  </Form.Group>

                  {formData.hasMedicalNeeds && (
                    <>
                      <Row className="mb-3">
                        <Col md={12}>
                          <Form.Label>Medical Devices (Select all that apply)</Form.Label>
                          <div className="d-flex flex-wrap gap-3">
                            {[
                              "None",
                              "Manual Wheelchair",
                              "Motorized Wheelchair",
                              "Crutches",
                              "Walker",
                              "Oxygen",
                              "Car Seat (Booster Seat)",
                              "Splint (Safety Equipment)",
                              "Brace (Safety Equipment)",
                              "Other",
                            ].map((device) => (
                              <Form.Check
                                key={device}
                                type="checkbox"
                                id={`device-${device}`}
                                label={device}
                                name="medicalDevices"
                                value={device}
                                checked={formData.medicalDevices.includes(device)}
                                onChange={handleChange}
                              />
                            ))}
                          </div>
                        </Col>
                      </Row>

                      {formData.medicalDevices.includes("Other") && (
                        <Row className="mb-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Please specify other medical device</Form.Label>
                              <Form.Control
                                type="text"
                                name="otherMedicalDevice"
                                value={formData.otherMedicalDevice}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      )}

                      <Row className="mb-3">
                        <Col md={12}>
                          <Form.Label>Required Amenities (Select all that apply)</Form.Label>
                          <div className="d-flex flex-wrap gap-3">
                            {["None", "Wheelchair Holder", "Safety Harness", "Special Seating"].map((amenity) => (
                              <Form.Check
                                key={amenity}
                                type="checkbox"
                                id={`amenity-${amenity}`}
                                label={amenity}
                                name="medicalAmenities"
                                value={amenity}
                                checked={formData.medicalAmenities.includes(amenity)}
                                onChange={handleChange}
                              />
                            ))}
                          </div>
                        </Col>
                      </Row>

                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Safety Vest Size (if needed)</Form.Label>
                            <Form.Select name="vestSize" value={formData.vestSize} onChange={handleChange}>
                              <option value="">Select Size (if needed)</option>
                              <option>None</option>
                              <option>Small</option>
                              <option>Medium</option>
                              <option>Large</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                    </>
                  )}

                  <Row className="mb-3 mt-4">
                    <Col>
                      <div className="d-flex align-items-center">
                        <Form.Check
                          type="checkbox"
                          id="dnr"
                          label="Student has a Do Not Resuscitate (DNR) order"
                          name="dnr"
                          checked={formData.dnr}
                          onChange={handleChange}
                          className="me-2"
                        />
                        <Button variant="outline-info" size="sm" onClick={() => setShowDnrModal(true)} className="ms-2">
                          Info
                        </Button>
                      </div>
                      {formData.dnr && (
                        <div className="mt-2">
                          <Alert variant="warning">
                            <p className="mb-0">
                              <strong>DNR Documentation Status:</strong>{" "}
                              {formData.dnrDocumentation ? "Uploaded" : "Not Uploaded"}
                            </p>
                          </Alert>
                        </div>
                      )}
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col>
                      <Form.Check
                        type="checkbox"
                        id="hasCaretaker"
                        label="Student has a caretaker"
                        checked={formData.hasCaretaker}
                        onChange={toggleCaretaker}
                      />
                    </Col>
                  </Row>

                  {formData.hasCaretaker && (
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Caretaker Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="caretakerName"
                            value={formData.caretakerName}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Caretaker Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="caretakerPhone"
                            value={formData.caretakerPhone}
                            onChange={handlePhoneChange}
                            placeholder="(123) 456-7890"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>

              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Behavioral Information</h5>
                </Card.Header>
                <Card.Body>
                  <p>Select any behaviors that apply to the student:</p>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Check
                        type="checkbox"
                        id="behavioralNeeds.aggressiveBehavior"
                        label="Displays aggressive or dangerous behavior"
                        name="behavioralNeeds.aggressiveBehavior"
                        checked={formData.behavioralNeeds.aggressiveBehavior}
                        onChange={handleChange}
                        className="mb-2"
                      />
                      <Form.Check
                        type="checkbox"
                        id="behavioralNeeds.elopementRisk"
                        label="Elopement risk (may try to leave/run away)"
                        name="behavioralNeeds.elopementRisk"
                        checked={formData.behavioralNeeds.elopementRisk}
                        onChange={handleChange}
                        className="mb-2"
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Check
                        type="checkbox"
                        id="behavioralNeeds.easilyOverwhelmed"
                        label="Easily overwhelmed by noise/activity"
                        name="behavioralNeeds.easilyOverwhelmed"
                        checked={formData.behavioralNeeds.easilyOverwhelmed}
                        onChange={handleChange}
                        className="mb-2"
                      />
                      <Form.Check
                        type="checkbox"
                        id="behavioralNeeds.other"
                        label="Other behavioral considerations"
                        name="behavioralNeeds.other"
                        checked={formData.behavioralNeeds.other}
                        onChange={handleChange}
                        className="mb-2"
                      />
                    </Col>
                  </Row>

                  {(formData.behavioralNeeds.aggressiveBehavior ||
                    formData.behavioralNeeds.elopementRisk ||
                    formData.behavioralNeeds.easilyOverwhelmed ||
                    formData.behavioralNeeds.other) && (
                    <Row>
                      <Col>
                        <Form.Group>
                          <Form.Label>Strategies that work well with the student:</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="behavioralStrategies"
                            value={formData.behavioralStrategies}
                            onChange={handleChange}
                            placeholder="Please describe strategies that help manage these behaviors"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>
        )

      case 5: // Review & Submit
        return (
          <div className="form-section">
            <h4 className="section-title">Review & Submit</h4>
            <p className="section-description">
              Please review your information and submit your transportation request.
            </p>

            <div className="form-section-content">
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Student Information</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={6}>
                      <p className="mb-1">
                        <strong>Name:</strong> {formData.studentFirstName} {formData.studentLastName}
                      </p>
                      <p className="mb-1">
                        <strong>School:</strong> {formData.school}
                      </p>
                      <p className="mb-1">
                        <strong>Grade:</strong> {formData.grade}
                      </p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1">
                        <strong>Student ID:</strong> {formData.studentId}
                      </p>
                      <p className="mb-1">
                        <strong>School Year:</strong> {formData.schoolYear}
                      </p>
                      <p className="mb-1">
                        <strong>Address:</strong> {formData.streetAddress}, {formData.city}, {formData.state}{" "}
                        {formData.zipCode}
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Transportation Details</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={6}>
                      <p className="mb-1">
                        <strong>Pick-up Time:</strong> {formData.pickupTime}
                      </p>
                      <p className="mb-1">
                        <strong>Pick-up Location:</strong> {formData.pickupLocation}
                      </p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1">
                        <strong>Drop-off Time:</strong> {formData.dropOffTime}
                      </p>
                      <p className="mb-1">
                        <strong>Drop-off Location:</strong> {formData.dropOffLocation}
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Special Considerations</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={12}>
                      <ul className="list-unstyled">
                        {formData.needsAttended && (
                          <li className="mb-2">
                            <span className="badge bg-info me-2">Needs Attended</span>
                            Student needs to be attended by a parent/guardian when boarding or departing the bus
                          </li>
                        )}
                        {formData.nonVerbal && (
                          <li className="mb-2">
                            <span className="badge bg-info me-2">Non-verbal</span>
                            Student is non-verbal in English
                          </li>
                        )}
                        {formData.hasMedicalNeeds && (
                          <li className="mb-2">
                            <span className="badge bg-info me-2">Medical Needs</span>
                            Student has medical needs that require support during transportation
                          </li>
                        )}
                        {formData.dnr && (
                          <li className="mb-2">
                            <span className="badge bg-warning me-2">DNR</span>
                            Student has a Do Not Resuscitate (DNR) order
                          </li>
                        )}
                        {formData.hasCaretaker && (
                          <li className="mb-2">
                            <span className="badge bg-info me-2">Caretaker</span>
                            Student has a caretaker: {formData.caretakerName}
                          </li>
                        )}
                        {(formData.behavioralNeeds.aggressiveBehavior ||
                          formData.behavioralNeeds.elopementRisk ||
                          formData.behavioralNeeds.easilyOverwhelmed ||
                          formData.behavioralNeeds.other) && (
                          <li className="mb-2">
                            <span className="badge bg-info me-2">Behavioral Needs</span>
                            Student has behavioral considerations that require attention
                          </li>
                        )}
                      </ul>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Documentation & Consent</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Upload Supporting Documents (Optional)</Form.Label>
                    <Form.Control type="file" name="supportingDocuments" onChange={handleChange} />
                    <Form.Text className="text-muted">
                      Upload any supporting documents (e.g., doctor's notes, consent forms). Allowed file types: PDF,
                      JPG, PNG. Maximum size: 5MB.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Additional Comments</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="additionalComments"
                      value={formData.additionalComments}
                      onChange={handleChange}
                      placeholder="Any additional information we should know"
                    />
                  </Form.Group>

                  <div className="consent-section mt-4 p-3 bg-light rounded">
                    <h5>Parental Consent</h5>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="parentalConsent"
                        label="I hereby give consent for my child to use the transportation services as described."
                        name="parentalConsent"
                        checked={formData.parentalConsent}
                        onChange={handleChange}
                        isInvalid={validated && errors.parentalConsent}
                        required
                      />
                      <Form.Control.Feedback type="invalid">{errors.parentalConsent}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="policyAgreement"
                        label="I confirm that the information provided is accurate and I agree to the district's transportation policy."
                        name="policyAgreement"
                        checked={formData.policyAgreement}
                        onChange={handleChange}
                        isInvalid={validated && errors.policyAgreement}
                        required
                      />
                      <Form.Control.Feedback type="invalid">{errors.policyAgreement}</Form.Control.Feedback>
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Digital Signature (Type full name) <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="digitalSignature"
                            value={formData.digitalSignature}
                            onChange={handleChange}
                            isInvalid={validated && errors.digitalSignature}
                            required
                          />
                          <Form.Control.Feedback type="invalid">{errors.digitalSignature}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Signature Date <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="date"
                            name="signatureDate"
                            value={formData.signatureDate}
                            onChange={handleChange}
                            isInvalid={validated && errors.signatureDate}
                            required
                          />
                          <Form.Control.Feedback type="invalid">{errors.signatureDate}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Modal show={show} onHide={handleClose} size="lg" centered backdrop="static">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Transportation Request Form</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="form-container p-4">
            {renderStepIndicators()}

            <Form onSubmit={handleSubmit} noValidate validated={validated}>
              {renderStep()}

              <div className="form-navigation d-flex justify-content-between mt-4">
                {step > 1 && (
                  <Button variant="outline-secondary" onClick={prevStep} className="px-4">
                    Back
                  </Button>
                )}

                {step < totalSteps ? (
                  <Button variant="primary" onClick={nextStep} className="px-4 ms-auto">
                    Next
                  </Button>
                ) : (
                  <Button variant="success" type="submit" className="px-4 ms-auto">
                    Submit Request
                  </Button>
                )}
              </div>
            </Form>
          </div>
        </Modal.Body>
      </Modal>

      {/* DNR Modal */}
      {renderDnrModal()}
    </>
  )
}

export default TransportationRequestForm

