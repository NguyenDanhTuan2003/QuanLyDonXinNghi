import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import '../styles/Login.scss';

// Danh sách các câu quote tiếng Anh chạy tự động
const QUOTES = [
  {
    title: "Recharge. Reconnect. Relax.",
    subtitle: "Streamline your leave requests and manage your time off effortlessly with our intuitive portal."
  },
  {
    title: "Empower Your Work-Life Balance.",
    subtitle: "Take control of your schedule. Planning your next vacation has never been easier."
  },
  {
    title: "Transparent & Fast Approvals.",
    subtitle: "No more waiting in the dark. Track your requests in real-time and get notified instantly."
  }
];

const Login = () => {
  const [email, setEmail] = useState('john.doe@company.com');
  const [password, setPassword] = useState('123456');
  
  // State quản lý lỗi cục bộ dưới mỗi ô input
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // State quản lý lỗi chung trả về từ Backend (hiển thị trên cùng)
  const [serverError, setServerError] = useState('');
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // State cho hiệu ứng Carousel bên trái
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Tự động chuyển câu quote sau mỗi 5 giây
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Hàm kiểm tra định dạng dữ liệu (Validation)
  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setServerError('');

    if (!email) {
      setEmailError('Email là bắt buộc');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email không hợp lệ');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Mật khẩu là bắt buộc');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu phải từ 6 ký tự');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Nếu kiểm tra định dạng thất bại thì dừng luôn, không gọi Backend
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const response = await axiosClient.post('/auth/login', {
        email,
        password,
      });

      // API Backend trả về format: { success: true, data: { accesstoken: "..." } }
      const token = response.data?.data?.accesstoken;
      
      if (!token) throw new Error('Không nhận được token từ server');

      // Giải mã JWT Payload thủ công (lấy phần thứ 2 của token)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      
      const user = JSON.parse(jsonPayload);

      // Lưu trữ thông tin
      localStorage.setItem('accessToken', token);
      localStorage.setItem('userRole', user.role || 'USER');
      localStorage.setItem('userFullname', user.fullname || 'Unknown');

      // Chuyển trang
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      // Bắt lỗi từ Axios (Lỗi API) hoặc lỗi code (Try/Catch)
      const backendError = err.response?.data?.message;
      setServerError(backendError || err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-split">
        {/* Nửa bên trái - Graphic với Carousel tiếng Anh */}
        <div className="login-graphic">
          <div className="graphic-content">
            <h1 key={`title-${quoteIndex}`} className="fade-in-text">
              {QUOTES[quoteIndex].title}
            </h1>
            <p key={`sub-${quoteIndex}`} className="fade-in-text">
              {QUOTES[quoteIndex].subtitle}
            </p>
            
            {/* Dấu chấm để chỉ báo slide đang chạy */}
            <div className="carousel-indicators">
              {QUOTES.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`dot ${idx === quoteIndex ? 'active' : ''}`}
                  onClick={() => setQuoteIndex(idx)}
                ></span>
              ))}
            </div>
          </div>
        </div>

        {/* Nửa bên phải - Khu vực Form */}
        <div className="login-form-section">
          <div className="form-wrapper">
            <div className="logo-placeholder">⏱️ Hệ Thống QL Nghỉ Phép</div>
            
            <h2 className="welcome-text">Chào mừng trở lại</h2>
            <p className="subtitle">Vui lòng đăng nhập để truy cập hệ thống.</p>

            {/* Khối đỏ trên cùng CHỈ HIỆN KHI lỗi trả về từ server */}
            {serverError && <div className="error-message">{serverError}</div>}

            <form onSubmit={handleLogin} className="login-form" noValidate>
              <div className="form-group">
                <div className={`input-with-icon ${emailError ? 'input-error' : ''}`}>
                  <div className="icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(''); // Xóa lỗi ngay khi user sửa lại
                    }}
                    placeholder="Email"
                  />
                </div>
                {/* Báo lỗi đỏ NGAY DƯỚI ô input nếu nhập sai định dạng */}
                {emailError && <span className="inline-error-text">{emailError}</span>}
              </div>

              <div className="form-group">
                <div className={`input-with-icon ${passwordError ? 'input-error' : ''}`}>
                  <div className="icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Mật khẩu"
                  />
                </div>
                {passwordError && <span className="inline-error-text">{passwordError}</span>}
              </div>

              <div className="forgot-password">
                <a href="#">Quên mật khẩu?</a>
              </div>

              <button type="submit" className="btn-signin" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
