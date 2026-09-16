import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import '../styles/UserDashboard.scss';

// Định dạng ngày hiển thị (VD: 25/12/2026)
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

const UserDashboard = () => {
  const navigate = useNavigate();
  
  // State lưu trữ dữ liệu người dùng
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // State cho Filter & Sort
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('desc');
  
  // State cho Modal Tạo Đơn
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Lấy dữ liệu ngay khi vừa vào trang
  useEffect(() => {
    fetchUserProfile();
    fetchLeaveRequests(1, filterStatus, sortBy);
  }, []);

  // State cho Modal Sửa Thông Tin Cá Nhân
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isViewProfileModalOpen, setIsViewProfileModalOpen] = useState(false); // Modal Xem Thông Tin
  const [editProfileData, setEditProfileData] = useState({ 
    fullname: '',
    phoneNumber: '',
    dateOfBirth: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // State cho Modal Xem Chi Tiết Đơn
  const [isRequestDetailOpen, setIsRequestDetailOpen] = useState(false);
  const [requestDetailData, setRequestDetailData] = useState<any>(null);
  const [loadingDetail] = useState(false);

  const fetchUserProfile = async () => {
    const cachedName = localStorage.getItem('userFullname');
    const cachedRole = localStorage.getItem('userRole');
    
    if (cachedName && cachedRole) {
      setUserProfile((prev: any) => ({ ...prev, fullname: cachedName, role: cachedRole }));
    }

    try {
      const response = await axiosClient.get('/users/profile');
      const userData = response.data?.data || response.data;
      if (userData) {
        setUserProfile(userData);
        // Format lại ngày sinh để hiển thị đúng trong ô input type="date" (YYYY-MM-DD)
        let formattedDob = '';
        if (userData.dateOfBirth) {
          formattedDob = new Date(userData.dateOfBirth).toISOString().split('T')[0];
        }
        
        setEditProfileData({ 
          fullname: userData.fullname || '',
          phoneNumber: userData.phoneNumber || '',
          dateOfBirth: formattedDob
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải profile:", error);
    }
  };

  const fetchLeaveRequests = async (page: number, status = filterStatus, sort = sortBy) => {
    try {
      const params: any = { page, sortby: sort };
      if (status) params.status = status;

      const response = await axiosClient.get('/leave-request/getall', { params });
      const payload = response.data.data || response.data;
      
      if (payload && Array.isArray(payload.items)) {
        setLeaveRequests(payload.items);
        setTotalPages(payload.totalPages || 1);
      } else {
        setLeaveRequests(Array.isArray(payload) ? payload : []);
        setTotalPages(response.data.totalPages || 1);
      }
      setCurrentPage(page);
    } catch (error) {
      console.error("Lỗi khi tải danh sách đơn:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosClient.post('/leave-request/create', newRequest);
      setIsModalOpen(false);
      setNewRequest({ startDate: '', endDate: '', reason: '' });
      fetchLeaveRequests(1);
      alert("Tạo đơn nghỉ phép thành công!");
    } catch (error: any) {
      alert("Lỗi tạo đơn: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      // Chỉ gửi những trường có dữ liệu
      const payload: any = { fullname: editProfileData.fullname };
      if (editProfileData.phoneNumber) payload.phoneNumber = editProfileData.phoneNumber;
      if (editProfileData.dateOfBirth) payload.dateOfBirth = editProfileData.dateOfBirth;

      await axiosClient.put('/users/profile', payload);
      setIsProfileModalOpen(false);
      
      setUserProfile({ 
        ...userProfile, 
        fullname: editProfileData.fullname,
        phoneNumber: editProfileData.phoneNumber,
        dateOfBirth: editProfileData.dateOfBirth
      });
      localStorage.setItem('userFullname', editProfileData.fullname);
      alert("Cập nhật thông tin thành công!");
    } catch (error: any) {
      alert("Cập nhật thất bại: " + (error.response?.data?.message || error.message));
    } finally {
      setUpdatingProfile(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || 'pending';
    if (s === 'approved') return <span className="badge badge-success">Approved</span>;
    if (s === 'rejected') return <span className="badge badge-danger">Rejected</span>;
    if (s === 'cancelled') return <span className="badge badge-danger" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>Cancelled</span>;
    return <span className="badge badge-warning">Pending</span>;
  };

  const handleCancelRequest = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn này?')) return;
    try {
      await axiosClient.patch(`/leave-request/${id}/cancel`, { status: 'CANCELLED' });
      alert('Hủy đơn thành công!');
      fetchLeaveRequests(currentPage, filterStatus, sortBy); // Load lại danh sách
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn.');
    }
  };

  const handleViewRequestDetail = (req: any) => {
    setRequestDetailData(req);
    setIsRequestDetailOpen(true);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Bảng Điều Khiển */}
      <aside className="sidebar">
        <div className="user-profile">
          <img src="https://i.pravatar.cc/150?img=47" alt="Avatar" className="avatar" />
          <div className="user-info">
            <h3 className="name">{userProfile?.fullname || 'Đang tải...'}</h3>
            <p className="role">{userProfile?.role === 'USER' ? 'Nhân viên' : userProfile?.role}</p>
            <span className="status"><span className="dot"></span>Đang hoạt động</span>
          </div>
        </div>

        <nav className="nav-menu">
          <a href="#" className="nav-item active">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Tổng quan (Dashboard)
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
          <h1 className="page-title">Quản Lý Đơn Nghỉ Phép</h1>
        </header>

        {/* Các thẻ Thống Kê */}
        <div className="dashboard-stats">
          <div className="stat-card primary">
            <span className="stat-label">Tiêu chuẩn phép năm</span>
            <h2 className="stat-value">12 Ngày <span className="stat-sub">/ năm</span></h2>
          </div>
          <div className="stat-card">
            <span className="stat-label">Số phép đã sử dụng</span>
            <h2 className="stat-value">0 Ngày</h2>
          </div>
          
          <button className="btn-create" onClick={() => setIsModalOpen(true)}>
            <span className="btn-subtitle">Tạo Đơn Nghỉ Phép</span>
            <span className="btn-title">+ TẠO ĐƠN MỚI</span>
          </button>
        </div>

        {/* Bảng dữ liệu */}
        <section className="table-section">
          <div className="section-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Lịch Sử Xin Nghỉ</h2>
            <div className="table-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <div className="control-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500, whiteSpace: 'nowrap' }}>Trạng thái:</label>
                <select 
                  style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none' }}
                  value={filterStatus} 
                  onChange={(e) => { 
                    setFilterStatus(e.target.value); 
                    fetchLeaveRequests(1, e.target.value, sortBy); 
                  }}
                >
                  <option value="">Tất cả</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="control-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500, whiteSpace: 'nowrap' }}>Sắp xếp:</label>
                <select 
                  style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none' }}
                  value={sortBy} 
                  onChange={(e) => { 
                    setSortBy(e.target.value); 
                    fetchLeaveRequests(1, filterStatus, e.target.value); 
                  }}
                >
                  <option value="desc">Mới nhất</option>
                  <option value="asc">Cũ nhất</option>
                </select>
              </div>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngày Bắt Đầu</th>
                  <th>Ngày Kết Thúc</th>
                  <th>Lý Do</th>
                  <th>Trạng Thái</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      Chưa có đơn nghỉ phép nào.
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((req, index) => (
                    <tr key={req._id || index}>
                      <td>{formatDate(req.startDate)}</td>
                      <td>{formatDate(req.endDate)}</td>
                      <td>{req.reason}</td>
                      <td>{renderStatusBadge(req.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleViewRequestDetail(req)} 
                            style={{ color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500 }}
                            title="Xem chi tiết"
                          >
                            Chi tiết
                          </button>
                          {req.status === 'PENDING' && (
                            <button 
                              onClick={() => handleCancelRequest(req._id)} 
                              style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500 }}
                              title="Hủy đơn này"
                            >
                              Hủy đơn
                            </button>
                          )}
                        </div>
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
                onClick={() => fetchLeaveRequests(currentPage - 1)}
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
                      fetchLeaveRequests(pageNum as number);
                    }
                  }}
                  disabled={pageNum === '...'}
                >
                  {pageNum}
                </button>
              ))}

              <button 
                className={`page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={() => fetchLeaveRequests(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                &gt;
              </button>
            </div>
          )}
        </section>
      </main>

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
                <span style={{ color: '#111827', fontWeight: 500 }}>{userProfile?.fullname || 'Chưa cập nhật'}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                <strong style={{ width: '120px', color: '#6b7280' }}>Email:</strong>
                <span style={{ color: '#111827' }}>{userProfile?.email || 'Chưa cập nhật'}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                <strong style={{ width: '120px', color: '#6b7280' }}>Vai trò:</strong>
                <span style={{ color: '#111827' }}>{userProfile?.role === 'USER' ? 'Nhân viên' : userProfile?.role}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                <strong style={{ width: '120px', color: '#6b7280' }}>Số điện thoại:</strong>
                <span style={{ color: '#111827' }}>{userProfile?.phoneNumber || 'Chưa cập nhật'}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                <strong style={{ width: '120px', color: '#6b7280' }}>Ngày sinh:</strong>
                <span style={{ color: '#111827' }}>{formatDate(userProfile?.dateOfBirth)}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                <strong style={{ width: '120px', color: '#6b7280' }}>Phòng ban:</strong>
                <span style={{ color: '#111827' }}>{userProfile?.department || 'Chưa cập nhật'}</span>
              </div>
              <div style={{ display: 'flex', paddingBottom: '0.5rem' }}>
                <strong style={{ width: '120px', color: '#6b7280' }}>Chức vụ:</strong>
                <span style={{ color: '#111827' }}>{userProfile?.position || 'Chưa cập nhật'}</span>
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

      {/* Modal Tạo Đơn */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Tạo Đơn Xin Nghỉ Phép</h2>
            <form onSubmit={handleCreateRequest}>
              <div className="form-group">
                <label>Ngày bắt đầu</label>
                <input 
                  type="date" 
                  required 
                  value={newRequest.startDate}
                  onChange={e => setNewRequest({...newRequest, startDate: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Ngày kết thúc</label>
                <input 
                  type="date" 
                  required 
                  value={newRequest.endDate}
                  onChange={e => setNewRequest({...newRequest, endDate: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Lý do xin nghỉ</label>
                <textarea 
                  rows={3} 
                  required 
                  placeholder="Nhập lý do nghỉ phép của bạn..."
                  value={newRequest.reason}
                  onChange={e => setNewRequest({...newRequest, reason: e.target.value})}
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Đang gửi...' : 'Gửi Đơn'}
                </button>
              </div>
            </form>
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

export default UserDashboard;
