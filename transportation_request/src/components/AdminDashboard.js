import { useEffect, useState, useMemo } from "react"
import {
  Container,
  Row,
  Col,
  Navbar,
  Nav,
  Button,
  Card,
  Table,
  Form,
  Badge,
  Dropdown,
  Tabs,
  Tab,
  Alert,
  OverlayTrigger,
  Tooltip,
  Pagination,
  ListGroup,
  InputGroup,
  Modal,
} from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebase"
import { getDocs, collection, query, where, collectionGroup, setDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth";
import { CSVLink } from "react-csv"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { signOut } from "firebase/auth"
import "../theme.css"

// Custom component for status distribution visualization
const StatusDistribution = ({ data }) => {
  // Calculate total
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="status-distribution">
      <div className="status-bars">
        {data.map((item, index) => {
          const percent = total > 0 ? Math.round((item.value / total) * 100) : 0
          const COLORS = ["#4285F4", "#34A853", "#FBBC05", "#EA4335", "#8667D9"]

          return (
            <div key={index} className="status-item">
              <div className="status-label">
                <span className="status-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="status-name">{item.name}</span>
              </div>
              <div className="status-bar-container">
                <div
                  className="status-bar"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: COLORS[index % COLORS.length],
                    minWidth: item.value > 0 ? "20px" : "0",
                  }}
                ></div>
                <span className="status-value">
                  {item.value} ({percent}%)
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [notification, setNotification] = useState(null)
  const [showDistrictModal, setShowDistrictModal] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [selectedSupport, setSelectedSupport] = useState(null)
  const [districtFilter, setDistrictFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: "", end: "" })
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showMapView, setShowMapView] = useState(false)

  const [districts, setDistricts] = useState([])
  const [supportMessages, setSupportMessages] = useState([])
  const [transportationRequests, setTransportationRequests] = useState([])
  const [systemActivity, setSystemActivity] = useState([])
  const [showContact, setShowContact] = useState(false);

  const [newDistrict, setNewDistrict] = useState({
    name: "",
    email: "",
    password: "",
  })

  const [reportType, setReportType] = useState("transportation");
  const [reportFormat, setReportFormat] = useState("csv");
  const [reportDistrict, setReportDistrict] = useState("All");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [reportHeaders, setReportHeaders] = useState([]);

  


   

  // Status options for the dropdown - wrapped in useMemo to avoid recreation on every render
  const statusOptions = useMemo(() => [
    { value: "pending", label: "Pending Review", variant: "warning" },
    { value: "approved", label: "Approved", variant: "success" },
    { value: "rejected", label: "Rejected", variant: "danger" },
    { value: "on-hold", label: "On Hold", variant: "info" },
    { value: "completed", label: "Completed", variant: "primary" },
  ], []);

  // Calculate dashboard stats
  const totalRequests = transportationRequests.length
  const pendingRequests = transportationRequests.filter((r) => r.status === "pending").length
  const approvedRequests = transportationRequests.filter((r) => r.status === "approved").length
  const rejectedRequests = transportationRequests.filter((r) => r.status === "rejected").length
  const flaggedRequests = transportationRequests.filter((r) => r.flags && r.flags.length > 0).length
  const totalDistricts = districts.length
  const activeDistricts = districts.filter((d) => d.status === "active").length
  const totalAdmins = districts.reduce((sum, d) => sum + d.admins.length, 0)
  const pendingSupportMessages = supportMessages.filter((m) => m.status === "pending").length

  // Chart data
  const districtStats = useMemo(() => {
    return districts
      .map((district) => ({
        name: district.name,
        requests: district.requestCount,
      }))
      .sort((a, b) => b.requests - a.requests)
  }, [districts])

  const statusStats = useMemo(() => {
    const counts = {}
    statusOptions.forEach((option) => {
      counts[option.label] = transportationRequests.filter((r) => r.status === option.value).length
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [transportationRequests, statusOptions])

  const weeklyRequestsData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const counts = Array(7).fill(0)
    
    transportationRequests.forEach(req => {
      const day = new Date(req.createdAt).getDay()
      counts[day]++
    })
  
    return days.map((name, i) => ({ name, requests: counts[i] }))
  }, [transportationRequests])
  

  const monthlyRequestsData = useMemo(() => {
    const months = Array(12).fill(0)
  
    transportationRequests.forEach(req => {
      const date = new Date(req.createdAt || req.updatedAt || Date.now())
      const month = date.getMonth()
      months[month]++
    })
  
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  
    return monthLabels.map((name, i) => ({
      name,
      requests: months[i],
    }))
  }, [transportationRequests])
  

  // Define COLORS array for charts
  const COLORS = useMemo(() => ["#4285F4", "#34A853", "#FBBC05", "#EA4335", "#8667D9"], []);

  useEffect(() => {
    // Check admin authentication and permissions
    const checkAdminAccess = async () => {
      if (!auth.currentUser) {
        navigate("/login")
        return
      }

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
        if (!userDoc.exists() || userDoc.data().role !== "admin") {
          navigate("/unauthorized")
        }
      } catch (error) {
        console.error("Error checking admin access:", error)
        navigate("/login")
      }
    }

    checkAdminAccess()
  }, [navigate])



  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const requestSnapshot = await getDocs(collectionGroup(db, "transportation_requests"));
        const userSnapshot = await getDocs(collection(db, "users"));
    
        const districtMap = {};
    
        requestSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const districtName = data.district;
    
          if (!districtName) return;
    
          if (!districtMap[districtName]) {
            districtMap[districtName] = {
              name: districtName,
              admins: [],
              requestCount: 0,
              activeRequests: 0,
              adminCount: 0,
              lastActive: data.updatedAt || data.createdAt || new Date().toISOString()
            };
          }
    
          districtMap[districtName].requestCount += 1;
    
          if (["pending", "approved"].includes(data.status)) {
            districtMap[districtName].activeRequests += 1;
          }
    
          const lastActivity = new Date(data.updatedAt || data.createdAt || Date.now()).getTime();
          const currentLast = new Date(districtMap[districtName].lastActive).getTime();
    
          if (lastActivity > currentLast) {
            districtMap[districtName].lastActive = data.updatedAt || data.createdAt;
          }
        });
    
        userSnapshot.docs.forEach((doc) => {
          const userData = doc.data();
          if (userData.role === "district" && userData.district) {
            const dist = userData.district;
            if (!districtMap[dist]) {
              districtMap[dist] = {
                name: dist,
                admins: [],
                requestCount: 0,
                activeRequests: 0,
                adminCount: 0,
                lastActive: new Date().toISOString(),
              };
            }
    
            districtMap[dist].admins.push({
              id: doc.id,
              email: userData.email,
              fullName: `${userData.firstName} ${userData.lastName}`,
            });
    
            districtMap[dist].adminCount += 1;
          }
        });
    
        setDistricts(Object.values(districtMap));
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    };
    
  
    fetchDistricts()
  }, [])
  


  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const snapshot = await getDocs(collectionGroup(db, "transportation_requests"))
  
        const data = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(req => {
            const created = new Date(req.createdAt || req.updatedAt || Date.now())
            return (
              created.getFullYear() >= 2024 &&
              !(req.studentFirstName?.toLowerCase().includes("test") || req.studentLastName?.toLowerCase().includes("test"))
            )
          })
  
        setTransportationRequests(data)
      } catch (error) {
        console.error("Error fetching transportation requests:", error)
      }
    }
  
    fetchRequests()
  }, [])
  
  
  
  useEffect(() => {
    const fetchSupportMessages = async () => {
      try {
        const snapshot = await getDocs(collection(db, "support_messages"))
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSupportMessages(data);
      } catch (error) {
        console.error("Error fetching support messages:", error);
      }
    };
  
    fetchSupportMessages();
  }, []);


  

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const snapshot = await getDocs(collection(db, "systemActivity"))
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        setSystemActivity(data)
      } catch (error) {
        console.error("Error fetching system activity:", error)
      }
    }
  
    fetchActivity()
  }, [])
  
  
  

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }


  

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTimeSince = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffSec / 3600)
    const diffDay = Math.floor(diffHour / 24)

    if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`
    if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`
    if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`
    return "Just now"
  }

  const getStatusBadge = (status) => {
    const statusOption = statusOptions.find((opt) => opt.value === status) || statusOptions[0]
    return (
      <Badge bg={statusOption.variant} className="status-badge">
        {statusOption.label}
      </Badge>
    )
  }

  const getSupportStatusBadge = (status) => {
    let variant = "secondary"
    let label = status

    switch (status) {
      case "pending":
        variant = "warning"
        label = "Pending"
        break
      case "in-progress":
        variant = "info"
        label = "In Progress"
        break
      case "resolved":
        variant = "success"
        label = "Resolved"
        break
      default:
        break
    }

    return (
      <Badge bg={variant} className="status-badge">
        {label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority) => {
    let variant = "secondary"

    switch (priority) {
      case "low":
        variant = "success"
        break
      case "medium":
        variant = "warning"
        break
      case "high":
        variant = "danger"
        break
      default:
        break
    }

    return (
      <Badge bg={variant} className="priority-badge">
        {priority}
      </Badge>
    )
  }

  const renderFlagIcons = (flags) => {
    if (!flags || flags.length === 0) return null

    return (
      <div className="d-flex flex-wrap gap-1">
        {flags.includes("dnr") && (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>Do Not Release: This student should not be released without proper authorization</Tooltip>
            }
          >
            <Badge bg="danger" className="flag-badge">
              DNR
            </Badge>
          </OverlayTrigger>
        )}
        {flags.includes("needsAttended") && (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Needs Attended: This student requires supervision during transportation</Tooltip>}
          >
            <Badge bg="warning" text="dark" className="flag-badge">
              Attended
            </Badge>
          </OverlayTrigger>
        )}
        {flags.includes("nonVerbal") && (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>Non-Verbal: This student is non-verbal and may require alternative communication</Tooltip>
            }
          >
            <Badge bg="info" className="flag-badge">
              Non-Verbal
            </Badge>
          </OverlayTrigger>
        )}
      </div>
    )
  }

  // Pagination for tables
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Filtered districts based on search
  const filteredDistricts = districts.filter(
    (district) =>
      (district.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  )
  

  

  // Filtered support messages based on search and status filter
  const filteredSupport = supportMessages.filter(
    (message) =>
      ((message.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
       (message.from || "").toLowerCase().includes(searchQuery.toLowerCase())) &&
      (statusFilter === "All" || message.status === statusFilter)
  )
  
  

  // Filtered requests based on search, district filter, and status filter
  const filteredRequests = transportationRequests.filter((request) => {
    const fullName = `${request.studentFirstName || ""} ${request.studentLastName || ""}`.toLowerCase()
    const school = (request.school || "").toLowerCase()
    const district = (request.district || "").toLowerCase()
    const status = (request.status || "").toLowerCase()
    const query = searchQuery.toLowerCase()
  
    const matchesSearch = fullName.includes(query) || school.includes(query) || district.includes(query)
    const matchesDistrict = districtFilter === "All" || request.district === districtFilter
    const matchesStatus = statusFilter === "All" || request.status === statusFilter
  
    return matchesSearch && matchesDistrict && matchesStatus
  })
  
  

  // Pagination for current items
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentDistricts = filteredDistricts.slice(indexOfFirstItem, indexOfLastItem)
  const currentSupport = filteredSupport.slice(indexOfFirstItem, indexOfLastItem)
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem)

  // Total pages for pagination
  const totalDistrictPages = Math.ceil(filteredDistricts.length / itemsPerPage)
  const totalSupportPages = Math.ceil(filteredSupport.length / itemsPerPage)
  const totalRequestPages = Math.ceil(filteredRequests.length / itemsPerPage)

  const handleViewDistrictRequests = (districtName) => {
    setDistrictFilter(districtName);
    setActiveTab("requests");
  };


  const createDistrictAccount = async () => {
    const nameInput = document.getElementById("district-name")
    const emailInput = document.getElementById("district-email")
    const passwordInput = document.getElementById("district-password")
    const contactInput = document.getElementById("district-contact") 
    const name = nameInput?.value.trim()
    const email = emailInput?.value.trim()
    const password = passwordInput?.value
    const contact = contactInput?.value.trim() || ""
  

    if (!name || !email || !password) {
      alert("Please fill in district name, email, and password.")
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const userId = userCredential.user.uid

      await setDoc(doc(db, "users", userId), {
        firstName: name,
        lastName: "",
        email,
        phone: contact,
        district: name,
        role: "district",
        createdAt: new Date().toISOString(),
      })

      alert("District account created successfully!")
      setShowDistrictModal(false)
    } catch (error) {
      console.error("Error creating district account:", error)
      alert(`Failed to create account: ${error.message}`)
    }
  }

  const handleGenerateReport = () => {
    let data = [];
    let headers = [];
  
    const start = reportStartDate ? new Date(reportStartDate) : null;
    const end = reportEndDate ? new Date(reportEndDate) : null;
  
    // Helper to check date range
    const inDateRange = (dateStr) => {
      const date = new Date(dateStr);
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    };
  
    // Filter and format data
    switch (reportType) {
      case "transportation":
        data = transportationRequests
          .filter(req =>
            (reportDistrict === "All" || req.district === reportDistrict) &&
            inDateRange(req.createdAt || req.updatedAt)
          )
          .map(req => ({
            Student: `${req.studentFirstName} ${req.studentLastName}`,
            Grade: req.grade,
            School: req.school,
            District: req.district,
            Status: req.status,
            Submitted: formatDate(req.createdAt || req.updatedAt),
          }));
  
        headers = [
          { label: "Student", key: "Student" },
          { label: "Grade", key: "Grade" },
          { label: "School", key: "School" },
          { label: "District", key: "District" },
          { label: "Status", key: "Status" },
          { label: "Submitted", key: "Submitted" },
        ];
        break;
  
      case "support":
        data = supportMessages
          .filter(msg =>
            (reportDistrict === "All" || msg.district === reportDistrict) &&
            inDateRange(msg.date)
          )
          .map(msg => ({
            Subject: msg.subject,
            From: msg.from,
            Email: msg.email,
            District: msg.district,
            Status: msg.status,
            Priority: msg.priority,
            Date: formatDate(msg.date),
          }));
  
        headers = [
          { label: "Subject", key: "Subject" },
          { label: "From", key: "From" },
          { label: "Email", key: "Email" },
          { label: "District", key: "District" },
          { label: "Status", key: "Status" },
          { label: "Priority", key: "Priority" },
          { label: "Date", key: "Date" },
        ];
        break;
  
      case "districts":
        data = districts.map(d => ({
          Name: d.name,
          Admins: d.admins.length,
          Requests: d.requestCount,
          ActiveRequests: d.activeRequests,
          LastActive: formatDate(d.lastActive),
        }));
  
        headers = [
          { label: "District", key: "Name" },
          { label: "Admins", key: "Admins" },
          { label: "Requests", key: "Requests" },
          { label: "Active Requests", key: "ActiveRequests" },
          { label: "Last Active", key: "LastActive" },
        ];
        break;
  
      case "system":
        data = systemActivity
          .filter(log => inDateRange(log.timestamp))
          .map(log => ({
            User: log.user,
            Action: log.action,
            District: log.district,
            Details: log.details,
            Timestamp: formatDate(log.timestamp),
          }));
  
        headers = [
          { label: "User", key: "User" },
          { label: "Action", key: "Action" },
          { label: "District", key: "District" },
          { label: "Details", key: "Details" },
          { label: "Timestamp", key: "Timestamp" },
        ];
        break;
  
      default:
        break;
    }
  
    setReportData(data);
    setReportHeaders(headers);
  };
  

 
  

  return (
    <div className="dashboard-page">
      <Navbar bg="primary" variant="dark" expand="lg" className="fixed-top">
        <Container>
          <Navbar.Brand href="#">Transportation Portal</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse className="justify-content-end">
            <Nav>
              <Button variant="outline-light" className="me-2" onClick={() => setShowContact(true)}>
                Contact Support
              </Button>
              <Button variant="light" onClick={handleLogout}>
                Log Out
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="dashboard-container">
        <div className="dashboard-header mb-4">
          <Row className="align-items-center">
            <Col>
              <h2 className="dashboard-title">Admin Dashboard</h2>
              <p className="text-muted mb-0">System-wide Transportation Management</p>
            </Col>
            <Col xs="auto" className="text-end">
              <div className="welcome-message">
                <h5 className="mb-0">Welcome, Administrator</h5>
                <p className="text-muted mb-0">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </Col>
          </Row>
        </div>

        {notification && (
          <Alert
            variant={notification.type}
            onClose={() => setNotification(null)}
            dismissible
            className="mb-4 dashboard-alert"
          >
            {notification.message}
          </Alert>
        )}

        <Row className="mb-4">
          <Col>
            <Card className="dashboard-card">
              <Card.Body className="p-0">
                <Nav variant="tabs" className="admin-tabs">
                  <Nav.Item>
                    <Nav.Link
                      className={activeTab === "overview" ? "active" : ""}
                      onClick={() => setActiveTab("overview")}
                    >
                      Overview
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      className={activeTab === "districts" ? "active" : ""}
                      onClick={() => setActiveTab("districts")}
                    >
                      Districts
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      className={activeTab === "requests" ? "active" : ""}
                      onClick={() => setActiveTab("requests")}
                    >
                      Requests
                    </Nav.Link>
                  </Nav.Item>
                  

                  <Nav.Item>
                    <Nav.Link
                      className={activeTab === "support" ? "active" : ""}
                      onClick={() => setActiveTab("support")}
                    >
                      Support
                      {pendingSupportMessages > 0 && (
                        <Badge bg="danger" className="ms-2">
                          {pendingSupportMessages}
                        </Badge>
                      )}
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      className={activeTab === "reports" ? "active" : ""}
                      onClick={() => setActiveTab("reports")}
                    >
                      Reports
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      className={activeTab === "security" ? "active" : ""}
                      onClick={() => setActiveTab("security")}
                    >
                      Security
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      className={activeTab === "config" ? "active" : ""}
                      onClick={() => setActiveTab("config")}
                    >
                      System Config
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Overview Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Stats Cards */}
            <Row className="mb-4">
              <Col lg={3} md={6} className="mb-3 mb-lg-0">
                <Card className="dashboard-stat-card">
                  <Card.Body>
                    <div className="stat-icon-container bg-primary-light">
                      <i className="bi bi-clipboard-data stat-icon"></i>
                    </div>
                    <div className="stat-content">
                      <h3 className="stat-value">{totalRequests}</h3>
                      <p className="stat-label">Total Requests</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={3} md={6} className="mb-3 mb-lg-0">
                <Card className="dashboard-stat-card">
                  <Card.Body>
                    <div className="stat-icon-container bg-success-light">
                      <i className="bi bi-building stat-icon"></i>
                    </div>
                    <div className="stat-content">
                      <h3 className="stat-value">{totalDistricts}</h3>
                      <p className="stat-label">Districts Onboarded</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={3} md={6} className="mb-3 mb-lg-0">
                <Card className="dashboard-stat-card">
                  <Card.Body>
                    <div className="stat-icon-container bg-info-light">
                      <i className="bi bi-people stat-icon"></i>
                    </div>
                    <div className="stat-content">
                      <h3 className="stat-value">{totalAdmins}</h3>
                      <p className="stat-label">District Admins</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={3} md={6}>
                <Card className="dashboard-stat-card">
                  <Card.Body>
                    <div className="stat-icon-container bg-danger-light">
                      <i className="bi bi-exclamation-triangle stat-icon"></i>
                    </div>
                    <div className="stat-content">
                      <h3 className="stat-value">{flaggedRequests}</h3>
                      <p className="stat-label">Flagged Requests</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>


            <Row className="mb-4">
              <Col lg={8}>
                {/* Charts Section */}
                <Card className="dashboard-card mb-4">
                  <Card.Body>
                    <h5 className="card-title">System-wide Requests</h5>
                    <Tabs defaultActiveKey="weekly" id="request-trends-tabs" className="mb-3">
                      <Tab eventKey="weekly" title="This Week">
                        <div className="chart-container">
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={weeklyRequestsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="name" stroke="#666" />
                              <YAxis allowDecimals={false} stroke="#666" />
                              <RechartsTooltip />
                              <Bar dataKey="requests" fill="#2563eb" name="Requests" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Tab>
                      <Tab eventKey="monthly" title="This Year">
                        <div className="chart-container">
                          <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={monthlyRequestsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="name" stroke="#666" />
                              <YAxis allowDecimals={false} stroke="#666" />
                              <RechartsTooltip />
                              <Line
                                type="monotone"
                                dataKey="requests"
                                stroke="#2563eb"
                                strokeWidth={2}
                                activeDot={{ r: 8 }}
                                dot={{ r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </Tab>
                    </Tabs>
                  </Card.Body>
                </Card>

                <Row>
                  <Col md={6}>
                    <Card className="dashboard-card mb-4">
                      <Card.Body>
                        <h5 className="card-title">Top Districts</h5>
                        <div className="chart-container">
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart
                              data={districtStats}
                              layout="vertical"
                              margin={{ top: 5, right: 20, bottom: 5, left: 80 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                              <XAxis
                                type="number"
                                stroke="#666"
                                domain={[0, Math.max(...districtStats.map((s) => s.requests)) || 5]}
                                tickCount={Math.max(...districtStats.map((s) => s.requests)) + 1 || 6}
                                allowDecimals={false}
                              />
                              <YAxis type="category" dataKey="name" stroke="#666" width={80} tick={{ fontSize: 12 }} />
                              <RechartsTooltip formatter={(value) => [`${value} requests`]} />
                              <Bar dataKey="requests" fill="#2563eb" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="dashboard-card mb-4">
                      <Card.Body>
                        <h5 className="card-title">Request Status</h5>
                        <div className="chart-container">
                          <StatusDistribution data={statusStats} />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Col>

              <Col lg={4}>
                <Card className="dashboard-card mb-4">
                  <Card.Body>
                    <h5 className="card-title">System Activity</h5>
                    <div className="activity-list">
                      {systemActivity.map((activity, index) => (
                        <div key={index} className="activity-item">
                          <div className="activity-icon">
                            {activity.action.includes("status") && (
                              <i className="bi bi-check-circle activity-icon-approved"></i>
                            )}
                            {activity.action.includes("login") && (
                              <i className="bi bi-shield-exclamation activity-icon-rejected"></i>
                            )}
                            {activity.action.includes("Backup") && (
                              <i className="bi bi-database-check activity-icon-completed"></i>
                            )}
                            {activity.action.includes("admin") && (
                              <i className="bi bi-person-plus activity-icon-pending"></i>
                            )}
                            {activity.action.includes("report") && (
                              <i className="bi bi-file-earmark-text activity-icon-hold"></i>
                            )}
                          </div>
                          <div className="activity-content">
                            <p className="activity-text">
                              <strong>{activity.user}</strong> {activity.action}
                            </p>
                            <small className="text-muted">{activity.details}</small>
                            <p className="activity-time">
                              {getTimeSince(activity.timestamp)} • {activity.district}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                  <Card.Footer className="text-center">
                    <Button variant="outline-primary" size="sm" className="w-100">
                      View All Activity
                    </Button>
                  </Card.Footer>
                </Card>

                <Card className="dashboard-card">
                  <Card.Body>
                    <h5 className="card-title">Tasks Requiring Attention</h5>
                    <div className="task-list">
                      {pendingRequests > 0 && (
                        <div className="task-item">
                          <div className="task-icon bg-warning-light">
                            <i className="bi bi-hourglass-split"></i>
                          </div>
                          <div className="task-content">
                            <h6 className="mb-1">Pending Requests</h6>
                            <p className="mb-0">{pendingRequests} requests awaiting review</p>
                          </div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="ms-auto"
                            onClick={() => {
                              setActiveTab("requests")
                              setStatusFilter("pending")
                            }}
                          >
                            Review
                          </Button>
                        </div>
                      )}
                      {pendingSupportMessages > 0 && (
                        <div className="task-item">
                          <div className="task-icon bg-danger-light">
                            <i className="bi bi-envelope"></i>
                          </div>
                          <div className="task-content">
                            <h6 className="mb-1">Support Messages</h6>
                            <p className="mb-0">{pendingSupportMessages} messages need attention</p>
                          </div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="ms-auto"
                            onClick={() => {
                              setActiveTab("support")
                              setStatusFilter("pending")
                            }}
                          >
                            View
                          </Button>
                        </div>
                      )}
                      {flaggedRequests > 0 && (
                        <div className="task-item">
                          <div className="task-icon bg-info-light">
                            <i className="bi bi-flag"></i>
                          </div>
                          <div className="task-content">
                            <h6 className="mb-1">Flagged Requests</h6>
                            <p className="mb-0">{flaggedRequests} requests have special considerations</p>
                          </div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="ms-auto"
                            onClick={() => setActiveTab("requests")}
                          >
                            View
                          </Button>
                        </div>
                      )}
                      {pendingRequests === 0 && pendingSupportMessages === 0 && flaggedRequests === 0 && (
                        <div className="text-center py-3">
                          <i className="bi bi-check-circle-fill text-success fs-1"></i>
                          <p className="mt-2 mb-0">All caught up! No pending tasks.</p>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col lg={8}>
                <Card className="dashboard-card">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title mb-0">Geographic Distribution</h5>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setShowMapView(!showMapView)}
                        className="map-toggle-btn"
                      >
                        {showMapView ? "Hide Map" : "Show Map"}
                      </Button>
                    </div>
                    {showMapView ? (
                      <div className="map-container">
                        <div className="map-placeholder">
                          <div className="text-center py-5">
                            <i className="bi bi-map fs-1"></i>
                            <p className="mt-2">
                              Map view would display the geographic distribution of transportation requests
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Table hover responsive className="district-table">
                        <thead>
                          <tr>
                            <th>District</th>
                            <th>Requests</th>
                            <th>Active</th>
                            <th>Admins</th>
                            <th>Last Activity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {districts.slice(0, 5).map((district, index) => (
                            <tr key={index}>
                              <td>
                                <Button variant="link" onClick={() => handleViewDistrictRequests(district.name)}>
                                  {district.name}
                                </Button>
                              </td>
                              <td>{district.requestCount}</td>
                              <td>{district.activeRequests}</td>
                              <td>{district.adminCount}</td>
                              <td>{getTimeSince(district.lastActive)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                  <Card.Footer className="text-center">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="w-100"
                      onClick={() => setActiveTab("districts")}
                    >
                      View All Districts
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
              <Col lg={4}>
                <Card className="dashboard-card">
                  <Card.Body>
                    <h5 className="card-title">Quick Actions</h5>
                    <div className="d-grid gap-2">
                      <Button
                        variant="primary"
                        className="quick-action-btn"
                        onClick={() => setShowDistrictModal(true)}
                      >
                        <i className="bi bi-building-add quick-action-icon"></i>
                        <span>Add New District</span>
                      </Button>
                      <Button
                        variant="outline-primary"
                        className="quick-action-btn"
                        onClick={() => setShowReportModal(true)}
                      >
                        <i className="bi bi-file-earmark-bar-graph quick-action-icon"></i>
                        <span>Generate System Report</span>
                      </Button>
                      <Button
                        variant="outline-secondary"
                        className="quick-action-btn"
                        onClick={() => setShowConfigModal(true)}
                      >
                        <i className="bi bi-gear quick-action-icon"></i>
                        <span>System Configuration</span>
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {activeTab === "requests" && (
          <Card className="dashboard-card mb-4">
            <Card.Body>
              <h5 className="card-title mb-3">
                Student Transportation Requests {districtFilter !== "All" && `for ${districtFilter}`}
              </h5>

              <Form className="mb-3">
                <Row>
                  <Col md={4}>
                    <InputGroup>
                      <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search by student or school"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={districtFilter}
                      onChange={(e) => setDistrictFilter(e.target.value)}
                    >
                      <option value="All">All Districts</option>
                      {districts.map((d, i) => (
                        <option key={i} value={d.name}>{d.name}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All Statuses</option>
                      {statusOptions.map((opt, i) => (
                        <option key={i} value={opt.value}>{opt.label}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={2} className="text-end">
                    <Button variant="outline-secondary" onClick={() => {
                      setSearchQuery("")
                      setDistrictFilter("All")
                      setStatusFilter("All")
                    }}>
                      Reset
                    </Button>
                  </Col>
                </Row>
              </Form>

            


              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>School</th>
                    <th>Grade</th>
                    <th>District</th>
                    <th>Status</th>
                    <th>Flags</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRequests.length > 0 ? (
                    currentRequests.map((req) => (
                      <tr key={req.id}>
                        <td>{req.studentFirstName} {req.studentLastName}</td>
                        <td>{req.school}</td>
                        <td>{req.grade}</td>
                        <td>{req.district}</td>
                        <td>{getStatusBadge(req.status)}</td>
                        <td>{renderFlagIcons(req.flags)}</td>
                        <td>{formatDate(req.createdAt || req.updatedAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted">No requests found.</td>
                    </tr>
                  )}
                </tbody>
                {totalRequestPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination>
                    <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />

                    {Array.from({ length: Math.min(5, totalRequestPages) }).map((_, index) => {
                      let pageNumber
                      if (totalRequestPages <= 5) {
                        pageNumber = index + 1
                      } else if (currentPage <= 3) {
                        pageNumber = index + 1
                      } else if (currentPage >= totalRequestPages - 2) {
                        pageNumber = totalRequestPages - 4 + index
                      } else {
                        pageNumber = currentPage - 2 + index
                      }

                      return (
                        <Pagination.Item
                          key={pageNumber}
                          active={pageNumber === currentPage}
                          onClick={() => paginate(pageNumber)}
                        >
                          {pageNumber}
                        </Pagination.Item>
                      )
                    })}

                    <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalRequestPages} />
                    <Pagination.Last onClick={() => paginate(totalRequestPages)} disabled={currentPage === totalRequestPages} />
                  </Pagination>
                </div>
              )}

              </Table>
            </Card.Body>
          </Card>
        )}

        {activeTab === "support" && (
          <Card className="dashboard-card mb-4">
            <Card.Body>
              <h5 className="card-title mb-3">Support Messages</h5>

              <Form className="mb-3">
                <Row>
                  <Col md={6}>
                    <InputGroup>
                      <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search by subject or sender"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={4}>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </Form.Select>
                  </Col>
                  <Col md={2} className="text-end">
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setSearchQuery("")
                        setStatusFilter("All")
                      }}
                    >
                      Reset
                    </Button>
                  </Col>
                </Row>
              </Form>

              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>From</th>
                    <th>District</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Received</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSupport.length > 0 ? (
                    currentSupport.map((msg) => (
                      <tr key={msg.id}>
                        <td>{msg.subject}</td>
                        <td>{msg.from}</td>
                        <td>{msg.district}</td>
                        <td>{getSupportStatusBadge(msg.status)}</td>
                        <td>{getPriorityBadge(msg.priority)}</td>
                        <td>{formatDate(msg.date)}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                              setSelectedSupport(msg)
                              setShowSupportModal(true)
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted">No support messages found.</td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {totalSupportPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination>
                    <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                    {Array.from({ length: Math.min(5, totalSupportPages) }).map((_, index) => {
                      let pageNumber;
                      if (totalSupportPages <= 5) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = index + 1;
                      } else if (currentPage >= totalSupportPages - 2) {
                        pageNumber = totalSupportPages - 4 + index;
                      } else {
                        pageNumber = currentPage - 2 + index;
                      }

                      return (
                        <Pagination.Item
                          key={pageNumber}
                          active={pageNumber === currentPage}
                          onClick={() => paginate(pageNumber)}
                        >
                          {pageNumber}
                        </Pagination.Item>
                      );
                    })}
                    <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalSupportPages} />
                    <Pagination.Last onClick={() => paginate(totalSupportPages)} disabled={currentPage === totalSupportPages} />
                  </Pagination>
                </div>
              )}
            </Card.Body>
          </Card>
        )}


        {/* Districts Tab Content */}
        {activeTab === "districts" && (
          <>
            <Card className="dashboard-card mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0">District Management</h5>
                  <Button variant="primary" size="sm" onClick={() => setShowDistrictModal(true)}>
                    <i className="bi bi-plus-lg me-1"></i> Add District
                  </Button>
                </div>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="bi bi-search"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Search districts..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      aria-label="Filter by status"
                    >
                      <option value="All">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Col>
                  <Col md={3} className="text-end">
                    <Button variant="outline-secondary" onClick={() => setSearchQuery("")}>
                      Reset Filters
                    </Button>
                  </Col>
                </Row>

                <div className="table-responsive">
                  <Table hover className="district-table">
                    <thead>
                      <tr>
                        <th>District Name</th>
                        <th>Status</th>
                        <th>Admins</th>
                        <th>Total Requests</th>
                        <th>Active Requests</th>
                        <th>Last Activity</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDistricts.map((district, index) => (
                        <tr key={index}>
                          <td>
                            <div className="district-name">{district.name}</div>
                          </td>
                          <td>
                            <Badge bg="success" className="status-badge">Active</Badge>
                          </td>
                          <td>{district.admins.length}</td>
                          <td>—</td> 
                          <td>—</td> 
                          <td>—</td> 
                          <td>
                            <div className="d-flex justify-content-center gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedDistrict(district)
                                  setShowDistrictModal(true)
                                }}
                                className="action-btn"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => {
                                  setDistrictFilter(district.name)
                                  setActiveTab("requests")
                                }}
                                className="action-btn"
                              >
                                Requests
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => {
                                  setDistrictFilter(district.name)
                                  setActiveTab("admins")
                                }}
                                className="action-btn"
                              >
                                Admins
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {totalDistrictPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                      <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                      <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />

                      {Array.from({ length: Math.min(5, totalDistrictPages) }).map((_, index) => {
                        let pageNumber
                        if (totalDistrictPages <= 5) {
                          pageNumber = index + 1
                        } else if (currentPage <= 3) {
                          pageNumber = index + 1
                        } else if (currentPage >= totalDistrictPages - 2) {
                          pageNumber = totalDistrictPages - 4 + index
                        } else {
                          pageNumber = currentPage - 2 + index
                        }

                        return (
                          <Pagination.Item
                            key={pageNumber}
                            active={pageNumber === currentPage}
                            onClick={() => paginate(pageNumber)}
                          >
                            {pageNumber}
                          </Pagination.Item>
                        )
                      })}

                      <Pagination.Next
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalDistrictPages}
                      />
                      <Pagination.Last
                        onClick={() => paginate(totalDistrictPages)}
                        disabled={currentPage === totalDistrictPages}
                      />
                    </Pagination>
                  </div>
                )}
              </Card.Body>
            </Card>

            <Row>
              <Col md={6}>
                <Card className="dashboard-card mb-4">
                  <Card.Body>
                    <h5 className="card-title">District Performance</h5>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={districtStats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" stroke="#666" />
                          <YAxis allowDecimals={false} stroke="#666" />
                          <RechartsTooltip />
                          <Bar dataKey="requests" fill="#2563eb" name="Total Requests" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="dashboard-card mb-4">
                  <Card.Body>
                    <h5 className="card-title">District Status</h5>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Active", value: activeDistricts },
                              { name: "Inactive", value: totalDistricts - activeDistricts },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell fill="#34A853" />
                            <Cell fill="#9CA3AF" />
                          </Pie>
                          <Legend />
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {activeTab === "reports" && (
          <Card className="dashboard-card mb-4">
          <Card.Body>
            <h5 className="card-title mb-3">Generate Reports</h5>
        
            <Form>
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Report Type</Form.Label>
                    <Form.Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                      <option value="transportation">Transportation Requests</option>
                      <option value="support">Support Messages</option>
                      <option value="districts">District Activity</option>
                      <option value="system">System Logs</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Format</Form.Label>
                    <Form.Select value={reportFormat} onChange={(e) => setReportFormat(e.target.value)}>
                      <option value="csv">CSV</option>
                      <option value="pdf" disabled>PDF (coming soon)</option>
                      <option value="excel" disabled>Excel (coming soon)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>District (Optional)</Form.Label>
                    <Form.Select value={reportDistrict} onChange={(e) => setReportDistrict(e.target.value)}>
                      <option value="All">All</option>
                      {districts.map((d, i) => (
                        <option key={i} value={d.name}>{d.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
        
              <Row className="mb-3">
                <Col>
                  <Form.Label>Date Range</Form.Label>
                  <InputGroup>
                    <Form.Control type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} />
                    <Form.Control type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} />
                  </InputGroup>
                </Col>
              </Row>
        
              <div className="d-flex justify-content-between align-items-center mt-3">
                <Button onClick={handleGenerateReport} variant="primary">
                  Generate Report
                </Button>
        
                {reportData.length > 0 && (
                <CSVLink
                  data={reportData}
                  headers={reportHeaders}
                  filename={`${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`}
                  className="btn btn-success"
                >
                  Download CSV
                </CSVLink>
              )}
              </div>
            </Form>
          </Card.Body>
        </Card> 
      )}

      {activeTab === "security" && (
        <Card className="dashboard-card mb-4">
          <Card.Body>
            <h5 className="card-title">Security Settings</h5>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Password Policy</Form.Label>
                <Form.Select defaultValue="strong">
                  <option value="basic">Basic (8+ characters)</option>
                  <option value="medium">Medium (letters & numbers)</option>
                  <option value="strong">Strong (letters, numbers, symbols)</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Require Two-Factor Authentication"
                  defaultChecked
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Auto-lock after 5 failed login attempts"
                  defaultChecked
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Session Timeout (in minutes)</Form.Label>
                <Form.Control type="number" defaultValue="30" />
              </Form.Group>
            </Form>
          </Card.Body>
        </Card>
      )}

      {activeTab === "config" && (
        <Card className="dashboard-card mb-4">
          <Card.Body>
            <h5 className="card-title">System Configuration</h5>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>System Name</Form.Label>
                <Form.Control type="text" defaultValue="Transportation Request Portal" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Admin Contact Email</Form.Label>
                <Form.Control type="email" defaultValue="admin@transportationportal.org" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Time Zone</Form.Label>
                <Form.Select defaultValue="America/New_York">
                  <option value="America/New_York">Eastern</option>
                  <option value="America/Chicago">Central</option>
                  <option value="America/Denver">Mountain</option>
                  <option value="America/Los_Angeles">Pacific</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Card.Body>
        </Card>
      )}




        {/* Add District Modal */}
        <Modal show={showDistrictModal} onHide={() => setShowDistrictModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{selectedDistrict ? "Edit District" : "Add New District"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>District Name</Form.Label>
              <Form.Control
                id="district-name"
                type="text"
                placeholder="Enter district name"
                value={newDistrict.name}
                onChange={(e) => setNewDistrict({ ...newDistrict, name: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Admin Email</Form.Label>
              <Form.Control
                id = 'district-email'
                type="email"
                placeholder="Enter admin email"
                value={newDistrict.email}
                onChange={(e) => setNewDistrict({ ...newDistrict, email: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Admin Password</Form.Label>
              <Form.Control
                id = 'district-password'
                type="password"
                placeholder="Enter password"
                value={newDistrict.password}
                onChange={(e) => setNewDistrict({ ...newDistrict, password: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contact Phone</Form.Label>
              <Form.Control
                id="district-contact"
                type="tel"
                placeholder="Optional contact number"
              />
            </Form.Group>
          </Form>

          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDistrictModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createDistrictAccount}>
              {selectedDistrict ? "Save Changes" : "Add District"}
            </Button>
          </Modal.Footer>
        </Modal>

        

        {/* Support Message Modal */}
        <Modal show={showSupportModal} onHide={() => setShowSupportModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Support Message Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedSupport && (
              <>
                <div className="support-message-header">
                  <h5>{selectedSupport.subject}</h5>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <span className="text-muted">From: </span>
                      <strong>{selectedSupport.from}</strong> ({selectedSupport.email})
                    </div>
                    <div>
                      {getPriorityBadge(selectedSupport.priority)}
                      {getSupportStatusBadge(selectedSupport.status)}
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <span className="text-muted">District: </span>
                      <strong>{selectedSupport.district}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Date: </span>
                      <strong>{formatDate(selectedSupport.date)} {formatTime(selectedSupport.date)}</strong>
                    </div>
                  </div>
                </div>
                <div className="support-message-content p-3 bg-light rounded mb-3">
                  <p>{selectedSupport.message}</p>
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSupportModal(false)}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Report Generation Modal */}
        <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Generate Report</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Report Type</Form.Label>
                    <Form.Select defaultValue="transportation">
                      <option value="transportation">Transportation Requests</option>
                      <option value="district">District Activity</option>
                      <option value="admin">Admin Activity</option>
                      <option value="support">Support Tickets</option>
                      <option value="system">System Performance</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Format</Form.Label>
                    <Form.Select defaultValue="csv">
                      <option value="csv">CSV</option>
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>District</Form.Label>
                    <Form.Select defaultValue="All">
                      <option value="All">All Districts</option>
                      {districts.map((district, index) => (
                        <option key={index} value={district.name}>
                          {district.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date Range</Form.Label>
                    <Row>
                      <Col>
                        <Form.Control type="date" placeholder="Start Date" />
                      </Col>
                      <Col>
                        <Form.Control type="date" placeholder="End Date" />
                      </Col>
                    </Row>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Include Fields</Form.Label>
                <div className="d-flex flex-wrap gap-3">
                  <Form.Check type="checkbox" label="Student Information" defaultChecked />
                  <Form.Check type="checkbox" label="School Information" defaultChecked />
                  <Form.Check type="checkbox" label="Transportation Details" defaultChecked />
                  <Form.Check type="checkbox" label="Special Considerations" defaultChecked />
                  <Form.Check type="checkbox" label="Status History" defaultChecked />
                  <Form.Check type="checkbox" label="Admin Notes" />
                </div>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReportModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setShowReportModal(false)}>
              Generate Report
            </Button>
          </Modal.Footer>
        </Modal>

        {/* System Configuration Modal */}
        <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>System Configuration</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Tabs defaultActiveKey="general" id="config-tabs" className="mb-3">
              <Tab eventKey="general" title="General">
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>System Name</Form.Label>
                    <Form.Control type="text" defaultValue="Transportation Request Portal" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Administrator Email</Form.Label>
                    <Form.Control type="email" defaultValue="admin@transportationportal.org" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Default Language</Form.Label>
                    <Form.Select defaultValue="en">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Time Zone</Form.Label>
                    <Form.Select defaultValue="America/New_York">
                      <option value="America/New_York">Eastern Time (US & Canada)</option>
                      <option value="America/Chicago">Central Time (US & Canada)</option>
                      <option value="America/Denver">Mountain Time (US & Canada)</option>
                      <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    </Form.Select>
                  </Form.Group>
                </Form>
              </Tab>
              <Tab eventKey="security" title="Security">
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Password Policy</Form.Label>
                    <Form.Select defaultValue="strong">
                      <option value="basic">Basic (8+ characters)</option>
                      <option value="medium">Medium (8+ chars, mixed case, numbers)</option>
                      <option value="strong">Strong (8+ chars, mixed case, numbers, symbols)</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check type="checkbox" label="Require Two-Factor Authentication for all admins" defaultChecked />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check type="checkbox" label="Auto-lock accounts after 5 failed login attempts" defaultChecked />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Session Timeout (minutes)</Form.Label>
                    <Form.Control type="number" defaultValue="30" />
                  </Form.Group>
                </Form>
              </Tab>
              <Tab eventKey="notifications" title="Notifications">
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Check type="checkbox" label="Email notifications for new requests" defaultChecked />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check type="checkbox" label="Email notifications for status changes" defaultChecked />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check type="checkbox" label="Email notifications for new support messages" defaultChecked />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check type="checkbox" label="System alerts for failed login attempts" defaultChecked />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Daily Summary Report Recipients</Form.Label>
                    <Form.Control type="text" defaultValue="admin@transportationportal.org, reports@transportationportal.org" />
                    <Form.Text className="text-muted">Comma-separated list of email addresses</Form.Text>
                  </Form.Group>
                </Form>
              </Tab>
              <Tab eventKey="backup" title="Backup & Maintenance">
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Database Backup Frequency</Form.Label>
                    <Form.Select defaultValue="daily">
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Backup Time</Form.Label>
                    <Form.Control type="time" defaultValue="03:00" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Backup Retention (days)</Form.Label>
                    <Form.Control type="number" defaultValue="30" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check type="checkbox" label="Enable automatic system updates" defaultChecked />
                  </Form.Group>
                </Form>
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfigModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setShowConfigModal(false)}>
              Save Configuration
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  )
}

export default AdminDashboard
