import axios from 'axios';

// 1. TẠO "ĐƯỜNG DÂY NÓNG" (AXIOS INSTANCE)
// Thay vì mỗi lần gọi API phải gõ url dài, ta tạo sẵn một cục cấu hình mặc định.
const axiosClient = axios.create({
  // Địa chỉ gốc của Backend API Gateway
  baseURL: 'http://localhost:3000/api',

  // RẤT QUAN TRỌNG: Cho phép đính kèm Cookie vào mỗi Request gửi đi.
  // Nhờ cái này, Backend mới đọc được RefreshToken giấu trong Cookie.
  withCredentials: true,
});

// 2. KẺ ĐÁNH CHẶN TRƯỚC KHI GỬI ĐI (REQUEST INTERCEPTOR)
// Hàm này sẽ TỰ ĐỘNG chạy ngầm mỗi khi bạn dùng axiosClient để gửi bất cứ API nào.
axiosClient.interceptors.request.use(
  (config) => {
    // Bước 1: Mở két sắt (localStorage) lấy cái chìa khóa (accessToken) ra
    const token = localStorage.getItem('accessToken');

    // Bước 2: Nếu có chìa khóa, tự động đính kèm nó vào Header của Request
    // Cấu trúc chuẩn là: "Authorization: Bearer <token>"
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Bước 3: Cho phép Request tiếp tục bay tới Backend
    return config;
  },
  (error) => Promise.reject(error),
);

// 3. KẺ ĐÁNH CHẶN KHI NHẬN KẾT QUẢ VỀ (RESPONSE INTERCEPTOR)
// Hàm này TỰ ĐỘNG chạy ngầm mỗi khi Backend trả kết quả về cho Frontend.
axiosClient.interceptors.response.use(
  // Nếu Backend trả về thành công (200 OK) thì không làm gì cả, cứ trả kết quả về bình thường
  (response) => response,

  // Nếu Backend trả về LỖI (ví dụ: Hết hạn Token, Sai mật khẩu...)
  async (error) => {
    // Lấy lại thông tin của cái Request vừa bị lỗi
    const originalRequest = error.config;

    // NẾU lỗi là 401 (Unauthorized)
    // VÀ API đang gọi KHÔNG PHẢI là API đăng nhập (vì đăng nhập sai pass cũng trả về 401)
    // VÀ chưa từng thử xin lại token lần nào
    if (
      error.response?.status === 401 &&
      originalRequest.url !== '/auth/login' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Đánh dấu là "Đang thử xin lại token rồi nhé"

      try {
        // TỰ ĐỘNG GỌI API REFRESH:
        const res = await axios.post(
          'http://localhost:3000/api/auth/refresh',
          {},
          { withCredentials: true }, // Bắt buộc để trình duyệt gửi kèm Cookie refreshToken
        );

        // CHUẨN: Lấy đúng token từ res.data.data.accesstoken
        const newAccessToken =
          res.data?.data?.accesstoken || res.data?.accessToken;

        if (!newAccessToken) {
          throw new Error('Không nhận được token mới');
        }
        // Lưu token mới vào localStorage
        localStorage.setItem('accessToken', newAccessToken);

        // Đính kèm token mới vào request vừa bị lỗi
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Gửi lại request bị lỗi đó
        return axiosClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userFullname');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Nếu là các lỗi khác (ví dụ 400, 404, 500) thì cứ văng lỗi ra cho các trang UI tự xử lý
    return Promise.reject(error);
  },
);

// Bộc lộ đường dây nóng này ra để các trang khác (như Login, Dashboard) lấy ra xài
export default axiosClient;
