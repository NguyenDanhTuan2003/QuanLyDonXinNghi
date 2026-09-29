# =========================================================================================
# 📚 TỪ ĐIỂN CÁC TỪ KHÓA CẤU HÌNH TRONG DOCKERFILE (CHEAT SHEET)
# =========================================================================================
# 1. FROM       : Chọn "Máy tính / HĐH" gốc để cài đặt. Đánh dấu sự BẮT ĐẦU của một Stage (Giai đoạn).
# 2. WORKDIR    : Tạo một thư mục bên trong Máy ảo và "cd" (nhảy) vào đó. (Nên dùng /app).
# 3. COPY       : Chép đồ đạc (file/code) từ máy tính của bạn vào trong Máy ảo.
#                 * Mẹo: Luôn COPY package.json trước, RUN npm install, rồi mới COPY code. Để tận dụng Cache.
# 4. RUN        : Gõ lệnh Terminal trong lúc ĐANG BUILD (Vd: cài đặt thư viện, build code).
# 5. ARG        : Khai báo biến ảo chỉ dùng trong lúc build (Sẽ bay màu khi build xong). 
#                 Rất hữu ích để nhận biến APP_NAME từ docker-compose truyền vào.
# 6. ENV        : Khai báo Biến môi trường. Sống vĩnh viễn trong Máy ảo khi đang chạy.
# 7. EXPOSE     : Ghi chú cho Dev biết app mở cổng nào. (Vô thưởng vô phạt, không có tác dụng thật).
# 8. CMD        : Lệnh "Bóp cò". Chỉ chạy duy nhất 1 lần khi Máy ảo khởi động lên.
# =========================================================================================

# Stage 1 : chạy các file cấu hình phục vụ cho việc chỉ móc những file cần thiết ở stage 2 cho nó nhẹ 
FROM node:25-alpine AS builder
ARG APP_NAME 
#biến này sẽ chạy từ dockercompose.yml
#cái này gọi là image hay còn gọi là máy ảo
WORKDIR /app
#cái này dùng để build build xong k cần nữa nên step 2 k dùng đến vì đã lấy được hết các biến và sever đang chạy
COPY package*.json ./
#chạy lệnh npm install để cài thư viện
RUN npm install

COPY . .
# chỉ chạy đúng service đang được gọi
RUN npm run build ${APP_NAME}

# Stage 2 : lấy những mục cần thiết từ stage 1 về để tạo ra các container 
FROM node:25-alpine
ARG APP_NAME 
ENV MAIN_FILE=dist/apps/${APP_NAME}/main.js
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

CMD node ${MAIN_FILE}


