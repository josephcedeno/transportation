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
  Modal,
  Badge,
  Dropdown,
  Tabs,
  Tab,
  Alert,
  Spinner,
  OverlayTrigger,
  Tooltip,
  Pagination,
} from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import { doc, getDoc, getDocs, updateDoc, query, where, orderBy, limit } from "firebase/firestore"
import { auth, db, collectionGroup } from "../firebase"
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
} from "recharts"
import { signOut } from "firebase/auth"
import { addDoc, collection } from "firebase/firestore"
import "../theme.css"


const StatusDistribution = ({ data }) => {
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

const DistrictDashboard = () => {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState("")
  const [selectedSchool, setSelectedSchool] = useState("All")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [userDistrict, setUserDistrict] = useState("")
  const [showContact, setShowContact] = useState(false)
  const [showRequestDetails, setShowRequestDetails] = useState(false)
  const [showParentContact, setShowParentContact] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [newStatus, setNewStatus] = useState("")
  const [statusNote, setStatusNote] = useState("")
  const [parentInfo, setParentInfo] = useState(null)
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")
  const [isLoading, setIsLoading] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [activeTab, setActiveTab] = useState("all")
  const [recentActivity, setRecentActivity] = useState([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportFilters, setReportFilters] = useState({
    school: "All",
    status: "All",
    startDate: "",
    endDate: "",
  })
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [allActivity, setAllActivity] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [contactData, setContactData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  
  

  // Status options for the dropdown
  const statusOptions = [
    { value: "pending", label: "Pending Review", variant: "warning" },
    { value: "approved", label: "Approved", variant: "success" },
    { value: "rejected", label: "Rejected", variant: "danger" },
    { value: "on-hold", label: "On Hold", variant: "info" },
    { value: "completed", label: "Completed", variant: "primary" },
  ]

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login")
        return
      }
  
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (!userDoc.exists()) {
          navigate("/unauthorized")
          return
        }
  
        const userData = userDoc.data()
        if (userData.role !== "district") {
          navigate("/unauthorized")
          return
        }
  
        setUserDistrict(userData.district || "")
      } catch (error) {
        console.error("Error during auth init:", error)
        navigate("/unauthorized")
      }
    })
  
    return () => unsubscribe()
  }, [navigate])


  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])


 
  // Fetch recent activity
  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!userDistrict) return

      try {
        // This is a placeholder - in a real app, you'd have a dedicated collection for activity logs
        // For now, we'll just use the most recently updated requests
        const recentRequestsQuery = query(
          collectionGroup(db, "transportation_requests"),
          where("district", "==", userDistrict),
          orderBy("updatedAt", "desc"),
          limit(5),
        )

        const snapshot = await getDocs(recentRequestsQuery)

        const recentData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setRecentActivity(recentData)

        // Fetch all activity for the "View All" modal
        const allActivityQuery = query(
          collectionGroup(db, "transportation_requests"),
          where("district", "==", userDistrict),
          orderBy("updatedAt", "desc"),
        )

        const allActivitySnapshot = await getDocs(allActivityQuery)
        const allActivityData = allActivitySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setAllActivity(allActivityData)
      } catch (error) {
        console.error("Error fetching activity:", error)
      }
    }

    fetchRecentActivity()
  }, [userDistrict, requests])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true)
      try {
        const snapshot = await getDocs(collectionGroup(db, "transportation_requests"))
        const allRequests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          status: doc.data().status || "pending",
          adminNotes: doc.data().adminNotes || "",
          updatedAt: doc.data().updatedAt || doc.data().createdAt,
          userId: doc.ref.path.split("/")[1] || doc.data().userId || "",
        }))
        const districtFiltered = allRequests.filter((req) => req.district === userDistrict)
        setRequests(districtFiltered)
        setFiltered(districtFiltered)
      } catch (error) {
        console.error("Error fetching requests:", error)
        setNotification({
          type: "danger",
          message: "Failed to load transportation requests. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (userDistrict) fetchRequests()
  }, [userDistrict])

  const schools = useMemo(() => {
    const allSchools = requests.map((r) => r.school)
    return ["All", ...new Set(allSchools.filter(Boolean))]
  }, [requests])

  useEffect(() => {
    let data = [...requests]

    // Filter by school
    if (selectedSchool !== "All") {
      data = data.filter((r) => r.school === selectedSchool)
    }

    // Filter by status
    if (selectedStatus !== "All") {
      data = data.filter((r) => r.status === selectedStatus)
    }

    // Filter by active tab
    if (activeTab === "flagged") {
      data = data.filter((r) => r.dnr || r.needsAttended || r.nonVerbal)
    } else if (activeTab === "pending") {
      data = data.filter((r) => r.status === "pending")
    } else if (activeTab === "approved") {
      data = data.filter((r) => r.status === "approved")
    } else if (activeTab === "rejected") {
      data = data.filter((r) => r.status === "rejected")
    }

    // Filter by search
    if (search.trim()) {
      const query = search.toLowerCase()
      data = data.filter(
        (r) =>
          (r.studentFirstName + " " + r.studentLastName).toLowerCase().includes(query) ||
          r.studentId?.toLowerCase().includes(query) ||
          r.school?.toLowerCase().includes(query),
      )
    }

    // Apply sorting
    data.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime()
        const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime()
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB
      } else if (sortBy === "school") {
        return sortOrder === "desc" ? b.school.localeCompare(a.school) : a.school.localeCompare(b.school)
      } else if (sortBy === "student") {
        const nameA = `${a.studentLastName}, ${a.studentFirstName}`
        const nameB = `${b.studentLastName}, ${b.studentFirstName}`
        return sortOrder === "desc" ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB)
      } else if (sortBy === "status") {
        return sortOrder === "desc" ? b.status.localeCompare(a.status) : a.status.localeCompare(b.status)
      }
      return 0
    })

    setFiltered(data)
  }, [search, selectedSchool, selectedStatus, activeTab, requests, sortBy, sortOrder])

  // Calculate dashboard stats
  const totalRequests = requests.length
  const pendingRequests = requests.filter((r) => r.status === "pending").length
  const approvedRequests = requests.filter((r) => r.status === "approved").length
  const flaggedRequests = requests.filter((r) => r.dnr || r.needsAttended || r.nonVerbal).length

  // Chart data
  const schoolsStats = useMemo(() => {
    const counts = {}
    filtered.forEach((r) => {
      counts[r.school] = (counts[r.school] || 0) + 1
    })
    return Object.entries(counts)
      .map(([school, count]) => ({ school, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) 
  }, [filtered])

  const trendStats = useMemo(() => {
    const monthly = {}
    filtered.forEach((r) => {
      const month = new Date(r.createdAt).toLocaleString("default", { month: "short", year: "numeric" })
      monthly[month] = (monthly[month] || 0) + 1
    })
    return Object.entries(monthly)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA - dateB
      })
  }, [filtered])

  const statusStats = useMemo(() => {
    const counts = {}
    statusOptions.forEach((option) => {
      counts[option.label] = requests.filter((r) => r.status === option.value).length
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [requests, statusOptions])

  const COLORS = ["#4285F4", "#34A853", "#FBBC05", "#EA4335", "#8667D9"]

  const handleViewDetails = (request) => {
    setSelectedRequest(request)
    setShowRequestDetails(true)
  }

  const handleViewParentContact = async (request) => {
    setSelectedRequest(request)
    setShowParentContact(true)
    setParentInfo(null) 

    try {
      // Fetch parent information from the user who created the request
      if (request.userId) {
        const userDoc = await getDoc(doc(db, "users", request.userId))
        if (userDoc.exists()) {
          setParentInfo(userDoc.data())
        } else {
          setParentInfo({ error: "Parent information not found" })
        }
      } else {
        setParentInfo({ error: "No user ID associated with this request" })
      }
    } catch (error) {
      console.error("Error fetching parent info:", error)
      setParentInfo({ error: "Error fetching parent information" })
    }
  }

  const handleStatusChange = (request, status) => {
    setSelectedRequest(request)
    setNewStatus(status)
    setStatusNote("")
    setShowStatusModal(true)
  }

  const updateRequestStatus = async () => {
    if (!selectedRequest || !newStatus || !selectedRequest.userId) {
      console.error("Missing selectedRequest, newStatus, or userId:", selectedRequest)
      setNotification({
        type: "danger",
        message: "Cannot update request: missing user information.",
      })
      return
    }
  
    setUpdateLoading(true)
    try {
      const requestRef = doc(db, "users", selectedRequest.userId, "transportation_requests", selectedRequest.id)
  
      await updateDoc(requestRef, {
        status: newStatus,
        adminNotes: statusNote
          ? selectedRequest.adminNotes
            ? `${selectedRequest.adminNotes}\n\n${statusNote}`
            : statusNote
          : selectedRequest.adminNotes,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser.uid,
      })
  
      // Update local state
      const updatedRequests = requests.map((req) =>
        req.id === selectedRequest.id
          ? {
              ...req,
              status: newStatus,
              adminNotes: statusNote
                ? req.adminNotes
                  ? `${req.adminNotes}\n\n${statusNote}`
                  : statusNote
                : req.adminNotes,
              updatedAt: new Date().toISOString(),
              updatedBy: auth.currentUser.uid,
            }
          : req,
      )
  
      setRequests(updatedRequests)
  
      setNotification({
        type: "success",
        message: `Request status updated to ${statusOptions.find((opt) => opt.value === newStatus)?.label}`,
      })
  
      setShowStatusModal(false)
    } catch (error) {
      console.error("Error updating request status:", error)
      setNotification({
        type: "danger",
        message: "Failed to update request status. Please try again.",
      })
      setShowStatusModal(false)
    } finally {
      setUpdateLoading(false)
    }
  }  
  

  const handleSortChange = (field) => {
    if (sortBy === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // New field, default to descending
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const renderSortIcon = (field) => {
    if (sortBy !== field) return null
    return sortOrder === "asc" ? "↑" : "↓"
  }

  const renderFlagIcons = (request) => {
    return (
      <div className="d-flex flex-wrap gap-1">
        {request.dnr && (
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
        {request.needsAttended && (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Needs Attended: This student requires supervision during transportation</Tooltip>}
          >
            <Badge bg="warning" text="dark" className="flag-badge">
              Attended
            </Badge>
          </OverlayTrigger>
        )}
        {request.nonVerbal && (
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

  const getStatusBadge = (status) => {
    const statusOption = statusOptions.find((opt) => opt.value === status) || statusOptions[0]
    return (
      <Badge bg={statusOption.variant} className="status-badge">
        {statusOption.label}
      </Badge>
    )
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

  // Pagination for activity log
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = allActivity.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(allActivity.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Custom pie chart label
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

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
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="dashboard-title">District Dashboard</h2>
            <p className="text-muted">{userDistrict} School District Transportation Management</p>
          </Col>
        </Row>

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
                <div className="stat-icon-container bg-warning-light">
                  <i className="bi bi-hourglass-split stat-icon"></i>
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{pendingRequests}</h3>
                  <p className="stat-label">Pending Review</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3 mb-lg-0">
            <Card className="dashboard-stat-card">
              <Card.Body>
                <div className="stat-icon-container bg-success-light">
                  <i className="bi bi-check-circle stat-icon"></i>
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{approvedRequests}</h3>
                  <p className="stat-label">Approved</p>
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
                <h5 className="card-title">Requests Over Time</h5>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendStats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#666" />
                      <YAxis allowDecimals={false} stroke="#666" />
                      <RechartsTooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#2563eb"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>

            <Row>
              <Col md={6}>
                <Card className="dashboard-card mb-4">
                  <Card.Body>
                    <h5 className="card-title">Top Schools</h5>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={schoolsStats}
                          layout="vertical"
                          margin={{ top: 5, right: 20, bottom: 5, left: 80 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                          <XAxis
                            type="number"
                            stroke="#666"
                            domain={[0, Math.max(...schoolsStats.map((s) => s.count)) || 5]}
                            tickCount={Math.max(...schoolsStats.map((s) => s.count)) + 1 || 6}
                            allowDecimals={false}
                          />
                          <YAxis type="category" dataKey="school" stroke="#666" width={80} tick={{ fontSize: 12 }} />
                          <RechartsTooltip formatter={(value) => [`${value} requests`]} />
                          <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
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
                      {/* Replace the pie chart with our custom component */}
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
                <h5 className="card-title">Recent Activity</h5>
                <div className="activity-list">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div key={index} className="activity-item">
                        <div className="activity-icon">
                          {activity.status === "approved" && (
                            <i className="bi bi-check-circle activity-icon-approved"></i>
                          )}
                          {activity.status === "rejected" && <i className="bi bi-x-circle activity-icon-rejected"></i>}
                          {activity.status === "pending" && (
                            <i className="bi bi-hourglass-split activity-icon-pending"></i>
                          )}
                          {activity.status === "on-hold" && <i className="bi bi-pause-circle activity-icon-hold"></i>}
                          {activity.status === "completed" && (
                            <i className="bi bi-check-circle-fill activity-icon-completed"></i>
                          )}
                        </div>
                        <div className="activity-content">
                          <p className="activity-text">
                            <strong>
                              {activity.studentFirstName} {activity.studentLastName}'s
                            </strong>{" "}
                            request
                            {activity.status && ` was marked as ${activity.status}`}
                          </p>
                          <p className="activity-time">{getTimeSince(activity.updatedAt || activity.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted text-center py-3">No recent activity</p>
                  )}
                </div>
              </Card.Body>
              <Card.Footer className="text-center">
                <Button variant="outline-primary" size="sm" className="w-100" onClick={() => setShowAllActivity(true)}>
                  View All Activity
                </Button>
              </Card.Footer>
            </Card>

            <Card className="dashboard-card">
              <Card.Body>
                <h5 className="card-title">Quick Actions</h5>
                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    className="quick-action-btn"
                    onClick={() => {
                      setSearch("")
                      setSelectedSchool("All")
                      setSelectedStatus("All")
                      setActiveTab("pending")
                    }}
                  >
                    <i className="bi bi-inbox quick-action-icon"></i>
                    <span>Review Pending Requests</span>
                  </Button>

                  <Button
                    variant="outline-primary"
                    className="quick-action-btn"
                    onClick={() => setShowReportModal(true)}
                  >
                    <i className="bi bi-bar-chart quick-action-icon"></i>
                    <span>Generate Reports</span>
                  </Button>
                  <CSVLink
                    data={filtered}
                    filename={`${userDistrict}-transportation-requests.csv`}
                    className="btn btn-outline-success quick-action-btn"
                  >
                    <i className="bi bi-file-earmark-arrow-down quick-action-icon"></i>
                    <span>Export to CSV</span>
                  </CSVLink>
                  <Button variant="outline-secondary" className="quick-action-btn" onClick={() => window.print()}>
                    <i className="bi bi-printer quick-action-icon"></i>
                    <span>Print View</span>
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters and Tabs */}
        <Card className="dashboard-card mb-4">
          <Card.Body>
            <Row className="mb-3">
              <Col>
                <Nav variant="tabs" className="request-tabs">
                  <Nav.Item>
                    <Nav.Link className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
                      All Requests
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      className={activeTab === "pending" ? "active" : ""}
                      onClick={() => setActiveTab("pending")}
                    >
                      Pending
                      {pendingRequests > 0 && (
                        <Badge bg="warning" text="dark" className="ms-2">
                          {pendingRequests}
                        </Badge>
                      )}
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      className={activeTab === "approved" ? "active" : ""}
                      onClick={() => setActiveTab("approved")}
                    >
                      Approved
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      className={activeTab === "flagged" ? "active" : ""}
                      onClick={() => setActiveTab("flagged")}
                    >
                      Flagged
                      {flaggedRequests > 0 && (
                        <Badge bg="danger" className="ms-2">
                          {flaggedRequests}
                        </Badge>
                      )}
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      className={activeTab === "rejected" ? "active" : ""}
                      onClick={() => setActiveTab("rejected")}
                    >
                      Rejected
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Col>
            </Row>

            <Row>
              <Col md={4} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label className="filter-label">Search</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search by name, ID, or school..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                  />
                </Form.Group>
              </Col>
              <Col md={3} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label className="filter-label">School</Form.Label>
                  <Form.Select
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    className="filter-select"
                  >
                    {schools.map((school, index) => (
                      <option key={index} value={school}>
                        {school}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label className="filter-label">Status</Form.Label>
                  <Form.Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="filter-select"
                  >
                    <option value="All">All Statuses</option>
                    {statusOptions.map((option, index) => (
                      <option key={index} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button
                  variant="outline-secondary"
                  className="w-100"
                  onClick={() => {
                    setSearch("")
                    setSelectedSchool("All")
                    setSelectedStatus("All")
                    setActiveTab("all")
                  }}
                >
                  Reset Filters
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Requests Table */}
        <Card className="dashboard-card mb-4">
          <Card.Body>
            <div className="table-responsive">
              {isLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Loading transportation requests...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-5">
                  <div className="empty-state-icon">
                    <i className="bi bi-inbox"></i>
                  </div>
                  <h4>No Requests Found</h4>
                  <p className="text-muted">No transportation requests match your current filters.</p>
                  <Button
                    variant="outline-primary"
                    onClick={() => {
                      setSearch("")
                      setSelectedSchool("All")
                      setSelectedStatus("All")
                      setActiveTab("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <Table hover className="requests-table">
                  <thead>
                    <tr>
                      <th className="cursor-pointer" onClick={() => handleSortChange("student")}>
                        Student {renderSortIcon("student")}
                      </th>
                      <th className="cursor-pointer" onClick={() => handleSortChange("school")}>
                        School {renderSortIcon("school")}
                      </th>
                      <th>Grade</th>
                      <th>Flags</th>
                      <th className="cursor-pointer" onClick={() => handleSortChange("status")}>
                        Status {renderSortIcon("status")}
                      </th>
                      <th className="cursor-pointer" onClick={() => handleSortChange("date")}>
                        Submitted {renderSortIcon("date")}
                      </th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((request, index) => (
                      <tr key={index} className={request.status === "pending" ? "pending-row" : ""}>
                        <td>
                          <div className="student-name">
                            {request.studentLastName}, {request.studentFirstName}
                          </div>
                          {request.studentId && <div className="student-id">ID: {request.studentId}</div>}
                        </td>
                        <td>{request.school}</td>
                        <td>{request.grade}</td>
                        <td>{renderFlagIcons(request)}</td>
                        <td>{getStatusBadge(request.status)}</td>
                        <td>
                          <div>{formatDate(request.createdAt)}</div>
                          <div className="submission-time">{formatTime(request.createdAt)}</div>
                        </td>
                        <td>
                          <div className="d-flex justify-content-center gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                              className="action-btn"
                              title="View Details"
                            >
                              View
                            </Button>
                            <Dropdown>
                              <Dropdown.Toggle variant="outline-secondary" size="sm" className="action-btn">
                                Status
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                {statusOptions.map((option) => (
                                  <Dropdown.Item
                                    key={option.value}
                                    onClick={() => handleStatusChange(request, option.value)}
                                    active={request.status === option.value}
                                  >
                                    {option.label}
                                  </Dropdown.Item>
                                ))}
                              </Dropdown.Menu>
                            </Dropdown>
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleViewParentContact(request)}
                              className="action-btn"
                              title="View Parent Contact"
                            >
                              Contact
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Contact Support Modal - Unified Version */}
        <Modal show={showContact} onHide={() => setShowContact(false)} centered size="lg">
          <Modal.Header closeButton className="bg-light">
            <Modal.Title className="text-primary">Contact Support</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="contact-form-header">
              <h5>How can we help you?</h5>
              <p className="text-muted">Our support team will respond to your inquiry as soon as possible.</p>
            </div>

            <Form
              onSubmit={async (e) => {
                e.preventDefault()

                const user = auth.currentUser
                const supportMessage = {
                  ...contactData,
                  district: userDistrict || "N/A",
                  submittedAt: new Date().toISOString(),
                  userId: user?.uid || "anonymous",
                }

                try {
                  const user = auth.currentUser
                  await addDoc(collection(db, "users", user.uid, "contact_messages"), supportMessage)
                  alert("Your message has been sent successfully!")
                  setShowContact(false)
                  setContactData({
                    name: "",
                    email: "",
                    subject: "",
                    message: "",
                  })
                } catch (error) {
                  console.error("Error sending support message:", error.message)
                  alert("Failed to send message. Please try again.")
                }
              }}
            >

              <div className="contact-form-section">
                <h6 className="mb-3">Your Information</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={contactData.name}
                        onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={contactData.email}
                        onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              <div className="contact-form-section">
                <h6 className="mb-3">Message Details</h6>
                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    value={contactData.subject}
                    onChange={(e) => setContactData({ ...contactData, subject: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="message"
                    value={contactData.message}
                    onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                    required
                  />
                </Form.Group>
              </div>

              <div className="contact-form-footer d-flex justify-content-end gap-2">
                <Button variant="outline-secondary" onClick={() => setShowContact(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Send Message
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Request Details Modal */}
        <Modal show={showRequestDetails} onHide={() => setShowRequestDetails(false)} size="lg" centered>
          <Modal.Header closeButton className="request-detail-header">
            <Modal.Title className="d-flex align-items-center">
              Transportation Request Details
              {selectedRequest && <span className="ms-3">{getStatusBadge(selectedRequest.status)}</span>}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-4">
            {selectedRequest && (
              <Tabs defaultActiveKey="student" className="mb-4 detail-tabs">
                <Tab eventKey="student" title="Student Information">
                  <Row className="mb-4">
                    <Col md={6}>
                      <div className="detail-section">
                        <h5 className="detail-section-title">Student Details</h5>
                        <div className="detail-item">
                          <span className="detail-label">Name:</span>
                          <span className="detail-value">
                            {selectedRequest.studentFirstName} {selectedRequest.studentLastName}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Student ID:</span>
                          <span className="detail-value">{selectedRequest.studentId || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Grade:</span>
                          <span className="detail-value">{selectedRequest.grade}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">School:</span>
                          <span className="detail-value">{selectedRequest.school}</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="detail-section">
                        <h5 className="detail-section-title">Request Information</h5>
                        <div className="detail-item">
                          <span className="detail-label">Request ID:</span>
                          <span className="detail-value">{selectedRequest.id}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Submitted:</span>
                          <span className="detail-value">
                            {formatDate(selectedRequest.createdAt)} at {formatTime(selectedRequest.createdAt)}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Status:</span>
                          <span className="detail-value">{getStatusBadge(selectedRequest.status)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">District:</span>
                          <span className="detail-value">{selectedRequest.district}</span>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div className="detail-section">
                    <h5 className="detail-section-title">Special Considerations</h5>
                    <div className="special-flags mb-3">
                      {renderFlagIcons(selectedRequest)}
                      {!selectedRequest.dnr && !selectedRequest.needsAttended && !selectedRequest.nonVerbal && (
                        <span className="text-muted">No special flags</span>
                      )}
                    </div>
                  </div>
                </Tab>

                <Tab eventKey="transportation" title="Transportation Details">
                  <Row>
                    <Col md={6}>
                      <div className="detail-section pickup-section">
                        <h5 className="detail-section-title">
                          <i className="bi bi-house location-icon pickup-icon"></i> Pick-up Information
                        </h5>
                        <div className="detail-item">
                          <span className="detail-label">Location:</span>
                          <span className="detail-value">{selectedRequest.pickupLocation}</span>
                        </div>
                        {selectedRequest.pickupAddress && (
                          <div className="detail-item">
                            <span className="detail-label">Address:</span>
                            <span className="detail-value">{selectedRequest.pickupAddress}</span>
                          </div>
                        )}
                        {selectedRequest.pickupTime && (
                          <div className="detail-item">
                            <span className="detail-label">Time:</span>
                            <span className="detail-value">{selectedRequest.pickupTime}</span>
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="detail-section dropoff-section">
                        <h5 className="detail-section-title">
                          <i className="bi bi-building location-icon dropoff-icon"></i> Drop-off Information
                        </h5>
                        <div className="detail-item">
                          <span className="detail-label">Location:</span>
                          <span className="detail-value">{selectedRequest.dropOffLocation}</span>
                        </div>
                        {selectedRequest.dropOffAddress && (
                          <div className="detail-item">
                            <span className="detail-label">Address:</span>
                            <span className="detail-value">{selectedRequest.dropOffAddress}</span>
                          </div>
                        )}
                        {selectedRequest.dropOffTime && (
                          <div className="detail-item">
                            <span className="detail-label">Time:</span>
                            <span className="detail-value">{selectedRequest.dropOffTime}</span>
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="notes" title="Admin Notes">
                  <div className="detail-section">
                    <h5 className="detail-section-title">Administrative Notes</h5>
                    {selectedRequest.adminNotes ? (
                      <div className="admin-notes">
                        {selectedRequest.adminNotes.split("\n").map((note, i) => (
                          <p key={i}>{note}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No administrative notes have been added to this request.</p>
                    )}

                    <Form className="mt-4">
                      <Form.Group>
                        <Form.Label>Add Note</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          placeholder="Add a new administrative note..."
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                        />
                      </Form.Group>
                      <div className="d-flex justify-content-end mt-3">
                        <Button
                          variant="primary"
                          onClick={() => {
                            setNewStatus(selectedRequest.status)
                            updateRequestStatus()
                          }}
                          disabled={!statusNote.trim()}
                        >
                          Save Note
                        </Button>
                      </div>
                    </Form>
                  </div>
                </Tab>
              </Tabs>
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="d-flex justify-content-between w-100">
              <Button
                variant="outline-primary"
                onClick={() => {
                  setShowRequestDetails(false)
                  handleViewParentContact(selectedRequest)
                }}
              >
                View Parent Contact
              </Button>
              <div className="d-flex">
                <Button variant="secondary" onClick={() => setShowRequestDetails(false)} className="me-3">
                  Close
                </Button>
                <Dropdown as={Button.Group}>
                  <Button variant="primary">Update Status</Button>
                  <Dropdown.Toggle split variant="primary" />
                  <Dropdown.Menu>
                    {statusOptions.map((option) => (
                      <Dropdown.Item
                        key={option.value}
                        onClick={() => {
                          setShowRequestDetails(false)
                          handleStatusChange(selectedRequest, option.value)
                        }}
                        active={selectedRequest && selectedRequest.status === option.value}
                      >
                        {option.label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </Modal.Footer>
        </Modal>

        {/* Parent Contact Modal */}
        <Modal show={showParentContact} onHide={() => setShowParentContact(false)} centered>
          <Modal.Header closeButton className="parent-contact-header">
            <Modal.Title>Parent/Guardian Information</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {!parentInfo ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading parent information...</p>
              </div>
            ) : parentInfo.error ? (
              <Alert variant="warning">
                <Alert.Heading>Information Unavailable</Alert.Heading>
                <p>{parentInfo.error}</p>
              </Alert>
            ) : (
              <div className="parent-info">
                <div className="parent-avatar">
                  <div className="parent-avatar-placeholder">
                    {parentInfo.firstName && parentInfo.lastName ? (
                      `${parentInfo.firstName.charAt(0)}${parentInfo.lastName.charAt(0)}`
                    ) : (
                      <i className="bi bi-person"></i>
                    )}
                  </div>
                </div>

                <div className="parent-details">
                  <h5 className="parent-name">
                    {parentInfo.firstName} {parentInfo.lastName}
                  </h5>
                  {parentInfo.relationship && <p className="parent-relationship">{parentInfo.relationship}</p>}

                  <div className="contact-methods">
                    {parentInfo.email && (
                      <div className="contact-method">
                        <i className="bi bi-envelope contact-icon"></i>
                        <a href={`mailto:${parentInfo.email}`} className="contact-link">
                          {parentInfo.email}
                        </a>
                      </div>
                    )}

                    {parentInfo.phone && (
                      <div className="contact-method">
                        <i className="bi bi-telephone contact-icon"></i>
                        <a href={`tel:${parentInfo.phone}`} className="contact-link">
                          {parentInfo.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {selectedRequest && (
                    <div className="student-reference mt-4">
                      <h6>Student Information</h6>
                      <p>
                        <strong>
                          {selectedRequest.studentFirstName} {selectedRequest.studentLastName}
                        </strong>
                        <br />
                        Grade: {selectedRequest.grade}
                        <br />
                        School: {selectedRequest.school}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowParentContact(false)}>
              Close
            </Button>
            {parentInfo && !parentInfo.error && parentInfo.email && (
              <Button variant="primary" as="a" href={`mailto:${parentInfo.email}`}>
                Send Email
              </Button>
            )}
          </Modal.Footer>
        </Modal>

        {/* Status Change Modal */}
        <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Update Request Status</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedRequest && (
              <>
                <p>
                  You are changing the status for{" "}
                  <strong>
                    {selectedRequest.studentFirstName} {selectedRequest.studentLastName}'s
                  </strong>{" "}
                  transportation request to:
                </p>

                <div className="text-center my-4">
                  <h4>{statusOptions.find((opt) => opt.value === newStatus)?.label}</h4>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Add a note (optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Add a note about this status change..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    This note will be added to the administrative notes for this request.
                  </Form.Text>
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={updateRequestStatus} disabled={updateLoading}>
              {updateLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  Updating...
                </>
              ) : (
                "Confirm Status Change"
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Report Generation Modal */}
        <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Generate Report</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>School</Form.Label>
                <Form.Select
                  value={reportFilters.school}
                  onChange={(e) => setReportFilters({ ...reportFilters, school: e.target.value })}
                >
                  {schools.map((school, i) => (
                    <option key={i} value={school}>
                      {school}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={reportFilters.status}
                  onChange={(e) => setReportFilters({ ...reportFilters, status: e.target.value })}
                >
                  <option value="All">All</option>
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Row>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={reportFilters.startDate}
                      onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={reportFilters.endDate}
                      onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReportModal(false)}>
              Cancel
            </Button>
            <CSVLink
              filename={`transportation-report-${Date.now()}.csv`}
              data={filtered.filter((r) => {
                const matchesSchool = reportFilters.school === "All" || r.school === reportFilters.school
                const matchesStatus = reportFilters.status === "All" || r.status === reportFilters.status
                const date = new Date(r.createdAt)
                const matchesDate =
                  (!reportFilters.startDate || date >= new Date(reportFilters.startDate)) &&
                  (!reportFilters.endDate || date <= new Date(reportFilters.endDate))
                return matchesSchool && matchesStatus && matchesDate
              })}
              className="btn btn-primary"
              onClick={() => setShowReportModal(false)}
            >
              Download Report
            </CSVLink>
          </Modal.Footer>
        </Modal>

        {/* All Activity Modal */}
        <Modal show={showAllActivity} onHide={() => setShowAllActivity(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Activity Log</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="activity-log-container">
              <Table hover responsive className="activity-table">
                <thead>
                  <tr>
                    <th>Date/Time</th>
                    <th>Student</th>
                    <th>School</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((activity, index) => (
                    <tr key={index}>
                      <td>
                        <div>{formatDate(activity.updatedAt || activity.createdAt)}</div>
                        <small className="text-muted">{formatTime(activity.updatedAt || activity.createdAt)}</small>
                      </td>
                      <td>
                        {activity.studentFirstName} {activity.studentLastName}
                      </td>
                      <td>{activity.school}</td>
                      <td>{getStatusBadge(activity.status)}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setShowAllActivity(false)
                            handleViewDetails(activity)
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {allActivity.length > itemsPerPage && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />

                    {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                      let pageNumber
                      if (totalPages <= 5) {
                        pageNumber = index + 1
                      } else if (currentPage <= 3) {
                        pageNumber = index + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + index
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

                    <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
                  </Pagination>
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAllActivity(false)}>
              Close
            </Button>
            <CSVLink data={allActivity} filename={`activity-log-${Date.now()}.csv`} className="btn btn-primary">
              Export Activity Log
            </CSVLink>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  )
}

export default DistrictDashboard