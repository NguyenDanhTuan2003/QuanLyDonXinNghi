import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import '../styles/UserDashboard.scss'; // Tái sử dụng style

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const getPaginationGroup = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
};

const renderStatusBadge = (status: string) => {
  const s = status?.toLowerCase() || 'pending';
  if (s === 'approved') return <span className="badge badge-success">Approved</span>;
  if (s === 'rejected') return <span className="badge badge-danger">Rejected</span>;
  if (s === 'cancelled') return <span className="badge badge-danger" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>Cancelled</span>;
  return <span className="badge badge-warning">Pending</span>;
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('desc');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterStartDateOp, setFilterStartDateOp] = useState('gte');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterEndDateOp, setFilterEndDateOp] = useState('lte');

  // Modal từ chối
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedReqId, setSelectedReqId] = useState('');
  const [processing, setProcessing] = useState(false);

  // Modal Profile
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isViewProfileModalOpen, setIsViewProfileModalOpen] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    fullname: '',
    phoneNumber: '',
    dateOfBirth: ''
  });

  // Modal Chi Tiết Đơn
  const [isRequestDetailOpen, setIsRequestDetailOpen] = useState(false);
  const [requestDetailData, setRequestDetailData] = useState<any>(null);
  const [loadingDetail] = useState(false);

  useEffect(() => {
    fetchAdminProfile();
    fetchAdminRequests(1, filterStatus, sortBy);
    fetchPendingApprovals();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const cachedName = localStorage.getItem('userFullname');
      const cachedRole = localStorage.getItem('userRole');
      if (cachedName && cachedRole) {
        setAdminProfile({ fullname: cachedName, role: cachedRole });
      }

      const response = await axiosClient.get('/users/profile');
      const userData = response.data?.data || response.data;
      if (userData) {
        setAdminProfile(userData);
        setEditProfileData({
          fullname: userData.fullname || '',
          phoneNumber: userData.phoneNumber || '',
          dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : ''
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải profile admin:", error);
    }
  };

  const fetchAdminRequests = async (
    page = currentPage, 
    status = filterStatus, 
    sort = sortBy,
    userId = filterUserId,
    startDate = filterStartDate,
    endDate = filterEndDate,
    startOp = filterStartDateOp,
    endOp = filterEndDateOp
  ) => {
    try {
      if (startDate && endDate && new Date(startDate).getTime() > new Date(endDate).getTime()) {
        alert('Ngày bắt đầu phải trước ngày kết thúc');
        return;
      }
      
      const params: any = { page, sortby: sort };
      if (status) params.status = status;
      if (userId) params.userId = userId;
      
      if (startDate) {
        if (startOp === 'eq') params.startDate = startDate;
        else params.startDate = JSON.stringify({ [startOp]: startDate });
      }
      
      if (endDate) {
        if (endOp === 'eq') params.endDate = endDate;
        else params.endDate = JSON.stringify({ [endOp]: endDate });
      }

      const response = await axiosClient.get('/leave-request/admin/getall', { params });
      const payload = response.data.data || response.data;
      
      if (payload && Array.isArray(payload.items)) {
        console.log("PAYLOAD HAS ITEMS:", payload);
        setRequests(payload.items);
        setTotalPages(payload.totalPages || 1);
      } else {
        console.log("PAYLOAD IS ARRAY DIRECTLY:", payload);
        setRequests(Array.isArray(payload) ? payload : []);
        setTotalPages(response.data.totalPages || 1);
      }
      
      setCurrentPage(page);
    } catch (error) {
      console.error("Lỗi khi tải danh sách đơn admin:", error);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const response = await axiosClient.get('/approval/getallapproval');
      const data = response.data.data || response.data;
      setApprovals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách approval:", error);
    }
  };

  const handleLogout = async () => {
    try {
      // Gọi xuống Backend để ném Token vào Blacklist
      await axiosClient.post('/auth/logout'); 
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    } finally {
      // Bất kể API gọi thành công hay thất bại thì vẫn xóa phiên ở Web và đẩy ra ngoài
      localStorage.clear();
      navigate('/login');
    }
  };


  const handleViewRequestDetail = (req: any) => {
    setRequestDetailData(req);
    setIsRequestDetailOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingProfile(true);
      await axiosClient.put('/users/profile', editProfileData);
      alert('Cập nhật thông tin thành công!');
      setIsProfileModalOpen(false);
      fetchAdminProfile(); // Tải lại data mới
      
      localStorage.setItem('userFullname', editProfileData.fullname);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Hàm mapping LeaveRequest ID sang Approval ID
  const getApprovalId = (leaveReqId: string) => {
    const approval = approvals.find(app => app.id_req === leaveReqId);
    return approval?._id;
  };

  const handleApprove = async (leaveReqId: string) => {
    const approvalId = getApprovalId(leaveReqId);
    if (!approvalId) {
      alert("Lỗi: Không tìm thấy ID duyệt của đơn này (Đơn có thể đã hết hạn hoặc được xử lý).");
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn duyệt đơn này?')) return;

    try {
      setProcessing(true);
      await axiosClient.patch(`/approval/${approvalId}/approved`, { status: 'APPROVED' });
      alert('Duyệt đơn thành công!');
      fetchAdminRequests(currentPage, filterStatus, sortBy);
      fetchPendingApprovals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi duyệt đơn.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClick = (leaveReqId: string) => {
    const approvalId = getApprovalId(leaveReqId);
    if (!approvalId) {
      alert("Lỗi: Không tìm thấy ID duyệt của đơn này.");
      return;
    }
    setSelectedReqId(approvalId);
    setIsRejectModalOpen(true);
    setRejectReason('');
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối.');
      return;
    }

    try {
      setProcessing(true);
      await axiosClient.patch(`/approval/${selectedReqId}/reject`, { 
        status: 'REJECTED', 
        rejectReason 
      });
      alert('Đã từ chối đơn!');
      setIsRejectModalOpen(false);
      fetchAdminRequests(currentPage, filterStatus, sortBy);
      fetchPendingApprovals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi từ chối đơn.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="user-profile">
          <img src="https://i.pravatar.cc/150?img=50" alt="Avatar" className="avatar" />
          <div className="user-info">
            <h3 className="name">{adminProfile?.fullname || 'Đang tải...'}</h3>
            <p className="role">Giám Đốc (Admin)</p>
            <span className="status"><span className="dot"></span>Online</span>
          </div>
        </div>

        <nav className="nav-menu">
          <a href="#" className="nav-item active">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Quản Lý Phê Duyệt
          </a>
          {/* Nút Xem Thông Tin */}
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); setIsViewProfileModalOpen(true); }}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            Xem thông tin
          </a>
          {/* Nút Sửa Thông Tin */}
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); setIsProfileModalOpen(true); }}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Sửa thông tin
          </a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Đăng xuất
          </a>
        </nav>
      </aside>

      {/* Nội dung chính */}
      <main className="main-content">
        <header className="top-header">
          <h1 className="page-title">Hệ Thống Phê Duyệt Đơn Nghỉ Phép</h1>
        </header>

        {/* Thống Kê Nhanh */}
        <div className="dashboard-stats">
          <div className="stat-card primary">
            <span className="stat-label">Tổng số đơn chờ duyệt</span>
            <h2 className="stat-value">{approvals.length} <span className="stat-sub">đơn</span></h2>
          </div>
          <div className="stat-card">
            <span className="stat-label">Tổng số đơn đã duyệt</span>
            <h2 className="stat-value">-</h2>
          </div>
          <div className="stat-card">
            <span className="stat-label">Tổng số nhân sự</span>
            <h2 className="stat-value">-</h2>
          </div>
        </div>

        {/* Bảng Dữ Liệu */}
        <section className="table-section">
          <div className="section-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Danh Sách Đơn Của Nhân Viên</h2>
            
            <div className="table-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div className="control-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500, whiteSpace: 'nowrap' }}>ID Nhân viên:</label>
                <input 
                  type="text"
                  placeholder="Nhập User ID..."
                  style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none', width: '150px' }}
                  value={filterUserId} 
                  onChange={(e) => setFilterUserId(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') fetchAdminRequests(1, filterStatus, sortBy, filterUserId, filterStartDate, filterEndDate);
                  }}
                />
              </div>
              <div className="control-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500, whiteSpace: 'nowrap' }}>Bắt đầu:</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <select 
                    style={{ padding: '0.5rem', borderRadius: '8px 0 0 8px', border: '1px solid #e5e7eb', borderRight: 'none', outline: 'none', background: '#f3f4f6', cursor: 'pointer' }}
                    value={filterStartDateOp}
                    onChange={(e) => setFilterStartDateOp(e.target.value)}
                  >
                    <option value="gte">&ge;</option>
                    <option value="lte">&le;</option>
                    <option value="eq">=</option>
                  </select>
                  <input 
                    type="date"
                    style={{ padding: '0.5rem', borderRadius: '0 8px 8px 0', border: '1px solid #e5e7eb', outline: 'none' }}
                    value={filterStartDate} 
                    onChange={(e) => setFilterStartDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="control-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500, whiteSpace: 'nowrap' }}>Kết thúc:</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <select 
                    style={{ padding: '0.5rem', borderRadius: '8px 0 0 8px', border: '1px solid #e5e7eb', borderRight: 'none', outline: 'none', background: '#f3f4f6', cursor: 'pointer' }}
                    value={filterEndDateOp}
                    onChange={(e) => setFilterEndDateOp(e.target.value)}
                  >
                    <option value="lte">&le;</option>
                    <option value="gte">&ge;</option>
                    <option value="eq">=</option>
                  </select>
                  <input 
                    type="date"
                    style={{ padding: '0.5rem', borderRadius: '0 8px 8px 0', border: '1px solid #e5e7eb', outline: 'none' }}
                    value={filterEndDate} 
                    onChange={(e) => setFilterEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="control-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500, whiteSpace: 'nowrap' }}>Trạng thái:</label>
                <select 
                  style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none' }}
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="control-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500, whiteSpace: 'nowrap' }}>Sắp xếp:</label>
                <select 
                  style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none' }}
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="desc">Mới nhất</option>
                  <option value="asc">Cũ nhất</option>
                </select>
              </div>
              <div className="control-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                <button 
                  onClick={() => {
                    setFilterUserId('');
                    setFilterStartDate('');
                    setFilterEndDate('');
                    setFilterStatus('');
                    setSortBy('desc');
                    fetchAdminRequests(1, '', 'desc', '', '', '');
                  }}
                  style={{ padding: '0.5rem 1rem', background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
                >Xóa lọc</button>
                <button 
                  onClick={() => fetchAdminRequests(1)}
                  style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
                >Áp dụng lọc</button>
              </div>
            </div>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Nhân Viên</th>
                  <th style={{ width: '15%' }}>Phòng Ban</th>
                  <th style={{ width: '18%' }}>TG Nghỉ</th>
                  <th style={{ width: '20%' }}>Lý Do</th>
                  <th style={{ width: '10%', whiteSpace: 'nowrap' }}>Trạng Thái</th>
                  <th style={{ width: '15%', whiteSpace: 'nowrap' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      Không có đơn nghỉ phép nào.
                    </td>
                  </tr>
                ) : (
                  requests.map((req, index) => (
                    <tr key={req._id || index}>
                      <td>
                        <div style={{ fontWeight: 500, color: '#111827' }}>{req.user?.fullname || 'N/A'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{req.user?.email}</div>
                        <div style={{ marginTop: '4px' }}>
                          <span 
                            style={{ 
                              fontSize: '0.7rem', 
                              color: '#6b7280', 
                              background: '#f3f4f6', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              border: '1px solid #e5e7eb',
                              fontFamily: 'monospace',
                              whiteSpace: 'nowrap',
                              cursor: 'pointer'
                            }}
                            title="Click để copy ID"
                            onClick={() => {
                              navigator.clipboard.writeText(req.userId);
                              alert('Đã copy ID: ' + req.userId);
                            }}
                          >
                            ID: {req.userId}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ color: '#374151' }}>{req.user?.department || 'N/A'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{req.user?.position}</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div>Từ: {formatDate(req.startDate)}</div>
                        <div>Đến: {formatDate(req.endDate)}</div>
                      </td>
                      <td>
                        <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'normal' }} title={req.reason}>
                          {req.reason}
                        </div>
                      </td>
                      <td>{renderStatusBadge(req.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => handleViewRequestDetail(req)} 
                            style={{ 
                              background: '#3b82f6', color: '#fff', border: 'none', 
                              padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer',
                              fontSize: '0.85rem', fontWeight: 500
                            }}
                            title="Xem chi tiết"
                          >
                            Chi tiết
                          </button>
                          
                          {req.status === 'PENDING' && (
                            <>
                              <button 
                                onClick={() => handleApprove(req._id)}
                                disabled={processing}
                                style={{ 
                                  background: '#10b981', color: '#fff', border: 'none', 
                                  padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer',
                                  fontSize: '0.85rem', fontWeight: 500
                                }}
                              >
                                Duyệt
                              </button>
                              <button 
                                onClick={() => handleRejectClick(req._id)}
                                disabled={processing}
                                style={{ 
                                  background: '#ef4444', color: '#fff', border: 'none', 
                                  padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer',
                                  fontSize: '0.85rem', fontWeight: 500
                                }}
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                        </div>
                        {req.status !== 'PENDING' && (
                          <span style={{ fontSize: '0.85rem', color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Phân trang */}
          {totalPages > 0 && (
            <div className="pagination">
              <button 
                className={`page-btn ${currentPage === 1 ? 'disabled' : ''}`}
                onClick={() => fetchAdminRequests(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &lt;
              </button>
              
              {getPaginationGroup(currentPage, totalPages).map((pageNum, index) => (
                <button
                  key={index}
                  className={`page-btn ${currentPage === pageNum ? 'active' : ''} ${pageNum === '...' ? 'dots' : ''}`}
                  onClick={() => {
                    if (pageNum !== '...') {
                      fetchAdminRequests(pageNum as number);
                    }
                  }}
                  disabled={pageNum === '...'}
                >
                  {pageNum}
                </button>
              ))}

              <button 
                className={`page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={() => fetchAdminRequests(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                &gt;
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Modal Nhập Lý Do Từ Chối */}
      {isRejectModalOpen && (
        <div className="modal-overlay" onClick={() => !processing && setIsRejectModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h2 className="modal-title">Từ chối đơn xin nghỉ</h2>
            <form onSubmit={handleRejectSubmit}>
              <div className="form-group">
                <label>Lý do từ chối <span style={{color: 'red'}}>*</span></label>
                <textarea 
                  required 
                  placeholder="Nhập lý do từ chối (VD: Dự án đang gấp...)"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-cancel" onClick={() => setIsRejectModalOpen(false)} disabled={processing}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit" style={{ background: '#ef4444' }} disabled={processing}>
                  {processing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sửa Thông Tin Cá Nhân */}
      {isProfileModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProfileModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Cập Nhật Thông Tin</h2>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Họ và Tên</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Nhập họ tên mới"
                  value={editProfileData.fullname}
                  onChange={e => setEditProfileData({...editProfileData, fullname: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input 
                  type="tel" 
                  placeholder="Ví dụ: 0987654321"
                  value={editProfileData.phoneNumber}
                  onChange={e => setEditProfileData({...editProfileData, phoneNumber: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Ngày sinh</label>
                <input 
                  type="date" 
                  value={editProfileData.dateOfBirth}
                  onChange={e => setEditProfileData({...editProfileData, dateOfBirth: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsProfileModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit" disabled={updatingProfile}>
                  {updatingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xem Thông Tin Chi Tiết */}
      {isViewProfileModalOpen && (
        <div className="modal-overlay" onClick={() => setIsViewProfileModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 className="modal-title">Thông Tin Cá Nhân</h2>
            
            <div className="profile-details" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                <strong style={{ width: '120px', color: '#6b7280' }}>Họ và tên:</strong>
                <span style={{ color: '#111827', fontWeight: 500 }}>{adminProfile?.fullname || 'Chưa cập nhật'}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                <strong style={{ width: '120px', color: '#6b7280' }}>Email:</strong>
                <span style={{ color: '#111827' }}>{adminProfile?.email || 'Chưa cập nhật'}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                <strong style={{ width: '120px', color: '#6b7280' }}>Vai trò:</strong>
                <span style={{ color: '#111827' }}>{adminProfile?.role === 'ADMIN' ? 'Quản trị viên' : adminProfile?.role}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                <strong style={{ width: '120px', color: '#6b7280' }}>Số điện thoại:</strong>
                <span style={{ color: '#111827' }}>{adminProfile?.phoneNumber || 'Chưa cập nhật'}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                <strong style={{ width: '120px', color: '#6b7280' }}>Ngày sinh:</strong>
                <span style={{ color: '#111827' }}>{formatDate(adminProfile?.dateOfBirth)}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                <strong style={{ width: '120px', color: '#6b7280' }}>Phòng ban:</strong>
                <span style={{ color: '#111827' }}>{adminProfile?.department || 'Chưa cập nhật'}</span>
              </div>
              <div style={{ display: 'flex', paddingBottom: '0.5rem' }}>
                <strong style={{ width: '120px', color: '#6b7280' }}>Chức vụ:</strong>
                <span style={{ color: '#111827' }}>{adminProfile?.position || 'Chưa cập nhật'}</span>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn-submit" onClick={() => setIsViewProfileModalOpen(false)} style={{ width: '100%' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi Tiết Đơn Xin Nghỉ */}
      {isRequestDetailOpen && (
        <div className="modal-overlay" onClick={() => setIsRequestDetailOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 className="modal-title">Chi Tiết Đơn Nghỉ Phép</h2>
            
            {loadingDetail ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Đang tải dữ liệu...</div>
            ) : requestDetailData ? (
              <div className="profile-details" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                  <strong style={{ width: '130px', color: '#6b7280' }}>Người tạo đơn:</strong>
                  <span style={{ color: '#111827', fontWeight: 500 }}>{requestDetailData.user?.fullname || 'Không rõ'}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                  <strong style={{ width: '130px', color: '#6b7280' }}>Phòng ban:</strong>
                  <span style={{ color: '#111827' }}>{requestDetailData.user?.department || 'Không rõ'}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                  <strong style={{ width: '130px', color: '#6b7280' }}>Ngày bắt đầu:</strong>
                  <span style={{ color: '#111827', fontWeight: 500 }}>{formatDate(requestDetailData.startDate)}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                  <strong style={{ width: '130px', color: '#6b7280' }}>Ngày kết thúc:</strong>
                  <span style={{ color: '#111827', fontWeight: 500 }}>{formatDate(requestDetailData.endDate)}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                  <strong style={{ width: '130px', color: '#6b7280' }}>Lý do xin nghỉ:</strong>
                  <span style={{ color: '#111827' }}>{requestDetailData.reason}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem', alignItems: 'center' }}>
                  <strong style={{ width: '130px', color: '#6b7280' }}>Trạng thái:</strong>
                  <span>{renderStatusBadge(requestDetailData.status)}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                  <strong style={{ width: '130px', color: '#6b7280' }}>Ngày tạo đơn:</strong>
                  <span style={{ color: '#111827' }}>{formatDate(requestDetailData.createdAt)}</span>
                </div>
                
                {requestDetailData.processedBy && (
                  <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                    <strong style={{ width: '130px', color: '#6b7280' }}>Người xử lý:</strong>
                    <span style={{ color: '#111827' }}>{requestDetailData.processedBy}</span>
                  </div>
                )}
                
                {requestDetailData.rejectReason && (
                  <div style={{ display: 'flex', paddingBottom: '0.5rem', color: '#ef4444' }}>
                    <strong style={{ width: '130px' }}>Lý do từ chối:</strong>
                    <span>{requestDetailData.rejectReason}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>Không có dữ liệu</div>
            )}

            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn-submit" onClick={() => setIsRequestDetailOpen(false)} style={{ width: '100%', background: '#6b7280' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
