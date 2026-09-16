<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

sequenceDiagram

actor User as 👤 Người dùng
participant FE as 🖥️ Frontend (React/Vue)
participant BE as ⚙️ Backend (Nestjs)
participant DB as 🗄️ Database (MongoDB)
participant Redis as 🔴 Redis

    User->>FE:  Nhập Email & Mật khẩu -> Nhấn "Đăng nhập"
    activate FE
    FE->>BE:  POST /api/auth/login (email, password)
    activate BE
    alt lỗi validate nhập email và pass rác
    BE-->>FE: Trả về lỗi Validation (400 Bad Request)
    FE-->>User: Hiển thị thông báo lỗi Validate
    else Validate hợp lệ
    BE->>DB:  findOne({ email })
    activate DB
    DB-->>BE: Trả về thông tin User (gồm password đã hash)
    deactivate DB
        alt Không tìm thấy User HOẶC Mật khẩu sai (bcrypt.compare)
        BE-->>FE: Trả về lỗi 401 (Unauthorized)
        FE-->>User:  Hiển thị thông báo "Email hoặc mật khẩu không đúng"
        else email và pass chính xác
        BE->>BE: tạo chuỗi token
        BE->>Redis: rftoken
        activate Redis
        Redis-->>BE: Lưu thành công
        deactivate Redis
        BE-->>FE: Trả về 200 OK (AccessToken + Set-Cookie RefreshToken)
        FE-->>User: thông báo đăng nhập thành công chuyển về trang chủ
        end
    end
    deactivate BE
    deactivate FE

## Luồng đăng ký hệ thống

sequenceDiagram
actor User as 👤 Người dùng
participant FE as 🖥️ Frontend (React/Vue)
participant BE as ⚙️ Backend (NestJS)
participant DB as 🗄️ Database (MongoDB)

    User->>FE: Nhập fullname, email, password, phoneNumber, dateOfBirth, department, position -> Nhấn "Đăng ký"
    activate FE
    FE->>BE: POST /api/auth/register (payload dữ liệu + role="user")
    activate BE

    alt Validate dữ liệu thất bại (thiếu trường, email/pass sai định dạng)
        BE-->>FE: Trả về lỗi Validation (400 Bad Request)
        FE-->>User: Hiển thị thông báo lỗi Validate
    else Validate hợp lệ
        BE->>DB: findOne({ email })
        activate DB
        DB-->>BE: Kết quả tìm kiếm
        deactivate DB

        alt Email đã tồn tại
            BE-->>FE: Trả về lỗi 409 Conflict
            FE-->>User: Hiển thị thông báo "Email đã tồn tại"
        else Email chưa tồn tại
            BE->>DB: save({ fullname, email: lowercase, password: hash, ... })
            activate DB
            DB-->>BE: Lưu thành công, trả về thông tin User
            deactivate DB

            BE-->>FE: Trả về 201 Created / 200 OK
            FE-->>User: Chuyển hướng sang màn hình Dashboard
        end
    end

    deactivate BE
    deactivate FE

## luồng sửa profile

sequenceDiagram
autonumber
actor User as 👤 Người dùng
participant FE as 🖥️ Frontend (React/Vue)
participant BE as ⚙️ Backend (Nestjs)
participant DB as 🗄️ Database (MongoDB)

    User->>FE: 1. Nhập thông tin & Nhấn "Cập nhật Profile"
    activate FE
    FE->>BE: 2. PUT /api/users/profile (Header: Bearer JWT Token)
    activate BE

    %% 1. Tầng Guard & Auth có check blacklist trong guard
    BE->>BE: 3. @UseGuards(AccessToken) & @Roles('admin', 'user')

    alt Token hết hạn / Không hợp lệ (401 Unauthorized)
        BE-->>FE: 4a. Trả về 401 (Phiên đăng nhập hết hạn)
        FE-->>User: 4b. Thông báo hết hạn & Điều hướng về Login
    else Token hợp lệ
        %% 2. Tầng DTO / Validation
        BE->>BE: 5. Validate DTO (fullName, phoneNumber, dateOfBirth)

        alt DTO sai định dạng / Chuỗi rỗng / Lỗi Validate (400 Bad Request)
            BE-->>FE: 6a. Trả về lỗi 400 (Dữ liệu không hợp lệ)
            FE-->>User: 6b. Hiển thị lỗi form cho người dùng
        else DTO hợp lệ (Pass Validation)
            %% 3. Tầng Database Processing
            BE->>DB: 7. findOneAndUpdate(id, dataUpdate)
            activate DB
            DB-->>BE: 8. Trả về thông tin User đã cập nhật
            deactivate DB

            BE-->>FE: 9. Trả về 200 OK + User Info mới
            FE-->>User: 10. Hiển thị thông báo thành công & Cập nhật UI Profile
        end
    end
    deactivate BE
    deactivate FE

## Luồng logout

sequenceDiagram
actor User as 👤 Người dùng
participant FE as 🖥️ Frontend (React/Vue)
participant BE as ⚙️ Backend (NestJS)
participant Redis as 🔴 Redis

    User->>FE: gửi yêu cầu logout
    activate FE
    FE->>BE: POST /api/auth/logout
    activate BE

%% 1. tầng Guard check
alt accesstoken và refreshtoken hết hạn hoặc sai accesstoken
BE-->>FE: thông báo lỗi 401
FE-->>User: thông báo đăng nhập đi rồi cả đăng xuất
else accesstoken còn hạn
BE->>Redis: ném 2 token vào blacklist
activate Redis
Redis-->>BE: lưu thành công
BE-->>FE: logout thành công
deactivate BE
FE-->User: chuyển về trang login
end
deactivate FE

## Luồng xem thông tin user

sequenceDiagram
autonumber
actor User as 👤 Người dùng
participant FE as 🖥️ Frontend (React/Vue)
participant BE as ⚙️ Backend (Nestjs)
participant DB as 🗄️ Database (MongoDB)

    User->>FE: 1. Nhấn "xem profile"
    activate FE
    FE->>BE: 2. GET /api/users/profile (Header: Bearer JWT Token)
    activate BE

    %% 1. Tầng Guard & Auth có check blacklist trong guard
    BE->>BE: 3. @UseGuards(AccessToken) & @Roles('admin', 'user')

    alt Token hết hạn / Không hợp lệ (401 Unauthorized)
        BE-->>FE: 4a. Trả về 401 (Phiên đăng nhập hết hạn)
        FE-->>User: 4b. Thông báo hết hạn & Điều hướng về Login
    else Token hợp lệ
        BE->>DB: findOne({email})
        activate DB
        DB-->BE: thông tin user
        deactivate DB
        BE-->FE: trả về 200 và thông tin user
        FE-->User: trang cá nhân

    end
    deactivate BE
    deactivate FE

## luồng sửa thông tin user

sequenceDiagram
autonumber
actor User as 👤 Người dùng
participant FE as 🖥️ Frontend
participant GW as 🚪 API Gateway
participant NATS as 📨 NATS Broker
participant US as ⚙️ User Service
participant DB as 🗄️ MongoDB

    User->>FE: Nhập thông tin & Nhấn "Sửa"
    activate FE
    FE->>GW: PUT /api/users/profile (Body + JWT Token)
    activate GW

    %% Tầng Validation tại Gateway
    GW->>GW: 1. ValidationPipe (Check updateProfileDto)
    alt DTO sai (chuỗi rỗng, sai format)
        GW-->>FE: 400 Bad Request (Lỗi Validation)
        FE-->>User: Hiển thị lỗi form
    else DTO hợp chuẩn

        %% Tầng Auth tại Gateway
        GW->>GW: 2. AccessTokenGuard (Check JWT)
        alt Token hết hạn / Không hợp lệ
            GW-->>FE: 401 Unauthorized
            FE-->>User: Yêu cầu đăng nhập lại
        else Token hợp lệ

            %% Gọi sang Microservice qua NATS
            GW->>NATS: 3. send('users.updateprofile', { body, user })
            activate NATS
            NATS->>US: Forward event
            deactivate NATS
            activate US

            %% Xử lý logic tại Service
            US->>DB: 4. findByIdAndUpdate(_id, { $set: dto })
            activate DB
            DB-->>US: Trả về data (hoặc null)
            deactivate DB

            alt !data (Không tìm thấy user)
                US-->>NATS: RpcError (USER_NOT_FOUND)
                NATS-->>GW: Forward Error
                GW->>GW: Exception Filter bắt lỗi
                GW-->>FE: 404 Not Found ("Người dùng không tồn tại")
                FE-->>User: Thông báo lỗi
            else data có tồn tại
                US-->>NATS: { success: true, message: 'Cập nhật thành công' }
                NATS-->>GW: Forward Response
                GW-->>FE: 200 OK + Data
                FE-->>User: Thông báo thành công & Load lại UI
            end
            deactivate US

        end
    end
    deactivate GW
    deactivate FE

## Luồng tạo đơn xin nghỉ (Create Leave Request)

sequenceDiagram
autonumber
actor User as 👤 Người dùng
participant FE as 🖥️ Frontend
participant GW as 🚪 API Gateway
participant NATS as 📨 NATS Broker
participant LRS as ⚙️ Leave Request Service
participant AS as ⚙️ Approval Service
participant DB as 🗄️ MongoDB

    User->>FE: Điền form tạo đơn & Nhấn "Tạo"
    activate FE
    FE->>GW: POST /api/leave-request/create (Body + JWT)
    activate GW

    %% Tầng Validation & Auth tại Gateway
    GW->>GW: 1. ValidationPipe (Check CreateLeaveRequestDto)
    alt Lỗi Validate
        GW-->>FE: 400 Bad Request
        FE-->>User: Báo lỗi nhập liệu
    else DTO hợp lệ
        GW->>GW: 2. AccessTokenGuard (Check JWT)
        alt Token không hợp lệ
            GW-->>FE: 401 Unauthorized
        else Token hợp lệ
            %% Gọi sang Leave Request Service
            GW->>NATS: 3. send('leave_request.create', {body, user})
            activate NATS
            NATS->>LRS: Forward event
            deactivate NATS
            activate LRS

            %% Xử lý tại Leave Request Service
            LRS->>DB: 4. findOne (Kiểm tra trùng lặp thời gian nghỉ)
            activate DB
            DB-->>LRS: Trả về kết quả
            deactivate DB

            alt Trùng thời gian nghỉ (Xung đột)
                LRS-->>NATS: RpcError(LEAVE_REQUEST_CONFLICT)
                NATS-->>GW: Forward Error
                GW->>GW: Exception Filter
                GW-->>FE: 409 Conflict ("Đã có đơn nghỉ phép trong khoảng thời gian này")
                FE-->>User: Thông báo lỗi xung đột
            else Không trùng lặp
                LRS->>DB: 5. leaveRequest.save() (Lưu đơn vào DB)
                activate DB
                DB-->>LRS: Trả về Object đơn mới
                deactivate DB

                %% Gửi sang Approval Service để quản lý duyệt
                LRS->>NATS: 6. send('approval.user.response', payload)
                activate NATS
                NATS->>AS: Nhận sự kiện tạo đơn duyệt
                deactivate NATS
                activate AS

                AS->>DB: 7. approvalRequestModel.create(savedb)
                activate DB
                DB-->>AS: Lưu yêu cầu duyệt thành công
                deactivate DB

                AS-->>LRS: { message: 'Đang chờ phê duyệt' } qua NATS
                deactivate AS

                LRS-->>GW: Trả về dữ liệu đơn mới qua NATS
                deactivate LRS

                GW-->>FE: 201 Created / 200 OK
                FE-->>User: Thông báo tạo đơn thành công
            end
        end
    end
    deactivate GW
    deactivate FE

## Luồng xem danh sách đơn xin nghỉ (của User)

sequenceDiagram
autonumber
actor User as 👤 Người dùng
participant FE as 🖥️ Frontend
participant GW as 🚪 API Gateway
participant NATS as 📨 NATS Broker
participant LRS as ⚙️ Leave Request Service
participant DB as 🗄️ MongoDB

    User->>FE: Chọn "Lịch sử nghỉ phép"
    activate FE
    FE->>GW: GET /api/leave-request/getall?page=1... (Header: JWT)
    activate GW

    %% Tầng Auth tại Gateway
    GW->>GW: 1. AccessTokenGuard (Check JWT)
    alt Token không hợp lệ
        GW-->>FE: 401 Unauthorized
        FE-->>User: Yêu cầu đăng nhập lại
    else Token hợp lệ
        %% Gọi sang Leave Request Service
        GW->>NATS: 2. send('leave_request.getall', {userId, page, status...})
        activate NATS
        NATS->>LRS: Forward event
        deactivate NATS
        activate LRS

        %% Xử lý tại Leave Request Service
        LRS->>DB: 3. find({userId, status}).sort().skip().limit()
        activate DB
        DB-->>LRS: Trả về danh sách đơn (data)
        deactivate DB

        LRS-->>NATS: Trả về Array Data (có thể rỗng [])
        NATS-->>GW: Forward Response
        GW-->>FE: 200 OK + Data
        FE-->>User: Hiển thị danh sách đơn lên màn hình (hoặc báo trống)
        deactivate LRS
    end
    deactivate GW
    deactivate FE

## Luồng Admin xem tất cả đơn xin nghỉ (Có map dữ liệu từ User Service)

sequenceDiagram
autonumber
actor Admin as 👤 Admin
participant FE as 🖥️ Frontend
participant GW as 🚪 API Gateway
participant NATS as 📨 NATS Broker
participant LRS as ⚙️ Leave Request Service
participant US as ⚙️ User Service
participant DB as 🗄️ MongoDB

    Admin->>FE: Xem "Quản lý đơn từ"
    activate FE
    FE->>GW: GET /api/leave-request/admin/getall... (Header: JWT)
    activate GW

    %% Auth & Role
    GW->>GW: 1. AccessTokenGuard & RoleGuard(ADMIN)
    alt Không phải Admin
        GW-->>FE: 403 Forbidden
        FE-->>Admin: "Bạn không có quyền"
    else Hợp lệ
        GW->>NATS: 2. send('admin_leave_request.getall', queryParams)
        activate NATS
        NATS->>LRS: Forward event
        deactivate NATS
        activate LRS

        %% Lấy đơn từ DB
        LRS->>DB: 3. find(options).sort().skip().limit()
        activate DB
        DB-->>LRS: Danh sách đơn (data)
        deactivate DB

        alt data rỗng
            LRS-->>NATS: Trả về []
            NATS-->>GW: []
            GW-->>FE: 200 OK + []
        else data có phần tử
            %% Map ID
            LRS->>LRS: 4. Trích xuất uniqueUserIds bằng Set()

            %% Gọi User Service lấy thông tin User hàng loạt (Batch)
            LRS->>NATS: 5. send('users.get_batch', { userIds })
            activate NATS
            NATS->>US: Forward event
            deactivate NATS
            activate US
            US->>DB: 6. find({ _id: { $in: userIds } })
            activate DB
            DB-->>US: Danh sách Users
            deactivate DB
            US-->>LRS: Trả về danh sách User (qua NATS)
            deactivate US

            %% Map Data
            LRS->>LRS: 7. Ghép nối dữ liệu User vào từng Leave Request (Dùng Map)
            LRS-->>NATS: Trả về Array Data đã map
            NATS-->>GW: Forward Response
            GW-->>FE: 200 OK + Data
            FE-->>Admin: Hiển thị bảng danh sách đầy đủ
        end
        deactivate LRS
    end
    deactivate GW
    deactivate FE

## Luồng Hủy đơn xin nghỉ (Cancel Leave Request)

sequenceDiagram
autonumber
actor User as 👤 Người dùng
participant FE as 🖥️ Frontend
participant GW as 🚪 API Gateway
participant NATS as 📨 NATS Broker
participant LRS as ⚙️ Leave Request Service
participant AS as ⚙️ Approval Service
participant DB as 🗄️ MongoDB

    User->>FE: Bấm "Hủy đơn"
    activate FE
    FE->>GW: PATCH /api/leave-request/:id/cancel
    activate GW

    GW->>GW: 1. AccessTokenGuard (Check JWT)
    GW->>NATS: 2. send('leave_request.cancel', { id_cancel, user })
    activate NATS
    NATS->>LRS: Forward event
    deactivate NATS
    activate LRS

    %% Xử lý tại Leave Request Service
    LRS->>DB: 3. findOneAndUpdate({ _id, userId, status: PENDING }, { status: CANCELLED })
    activate DB
    DB-->>LRS: Trả về data (hoặc null)
    deactivate DB

    alt !data (Đơn không tồn tại hoặc đã xử lý)
        LRS-->>NATS: RpcError(LEAVE_REQUEST_ALREADY_PROCESSED)
        NATS-->>GW: Forward Error
        GW-->>FE: 400 Bad Request ("Đơn đã được xử lý hoặc không hợp lệ")
        FE-->>User: Hiển thị thông báo
    else Hủy thành công (Bước 1)
        %% Gửi sự kiện sang Approval Service (Sync)
        LRS->>NATS: 4. send(CANCEL_APPROVAL_MESSAGE, { id_req, user, reason })
        activate NATS
        NATS->>AS: Forward event
        deactivate NATS
        activate AS

        AS->>DB: 5. findOneAndUpdate(id_req, { status: CANCELLED })
        activate DB
        DB-->>AS: Trả về kết quả
        deactivate DB

        alt Lỗi tại Approval Service
            AS-->>NATS: RpcError / Timeout
            NATS-->>LRS: Throw Error
            %% Saga Pattern: Rollback
            LRS->>DB: 6. Rollback (findOneAndUpdate trả về PENDING)
            LRS-->>NATS: RpcError(INTERNAL_SERVER_ERROR)
            NATS-->>GW: Forward Error
            GW-->>FE: 500 Internal Server Error
            FE-->>User: "Hủy đơn thất bại, vui lòng thử lại"
        else Approval hủy thành công
            AS-->>NATS: { success, message }
            NATS-->>LRS: Nhận Response thành công
            deactivate AS

            LRS-->>NATS: Trả về { success, message }
            NATS-->>GW: Forward Response
            GW-->>FE: 200 OK + Message
            FE-->>User: "Đã hủy đơn thành công!"
        end
    end
    deactivate LRS
    deactivate GW
    deactivate FE

## Luồng xem chi tiết đơn xin nghỉ (User/Admin)

sequenceDiagram
autonumber
actor User as 👤 Người dùng (hoặc Admin)
participant FE as 🖥️ Frontend
participant GW as 🚪 API Gateway
participant NATS as 📨 NATS Broker
participant LRS as ⚙️ Leave Request Service
participant DB as 🗄️ MongoDB

    User->>FE: Bấm xem chi tiết 1 đơn
    activate FE
    FE->>GW: GET /api/leave-request/:id (Header: JWT)
    activate GW

    %% Tầng Auth tại Gateway
    GW->>GW: 1. AccessTokenGuard (Check JWT)
    alt Token không hợp lệ
        GW-->>FE: 401 Unauthorized
        FE-->>User: Yêu cầu đăng nhập lại
    else Token hợp lệ
        %% Gọi sang Leave Request Service
        GW->>NATS: 2. send('leave_request.detail', { _id, role, requestid })
        activate NATS
        NATS->>LRS: Forward event
        deactivate NATS
        activate LRS

        %% Logic giới hạn quyền truy cập
        LRS->>LRS: 3. Kiểm tra Role. Nếu là USER -> Chỉ tìm đơn của chính mình (userId: _id)

        %% Xử lý tại Leave Request Service
        LRS->>DB: 4. findOne({ _id: requestid, [userId] })
        activate DB
        DB-->>LRS: Trả về chi tiết đơn (data) hoặc null
        deactivate DB

        alt Không tìm thấy đơn (!data)
            LRS-->>NATS: RpcError(LEAVE_REQUEST_NOT_FOUND)
            NATS-->>GW: Forward Error
            GW->>GW: Exception Filter
            GW-->>FE: 404 Not Found
            FE-->>User: Thông báo "Đơn không tồn tại hoặc bạn không có quyền xem"
        else data tồn tại
            LRS-->>NATS: Trả về Object Data
            NATS-->>GW: Forward Response
            GW-->>FE: 200 OK + Data
            FE-->>User: Hiển thị giao diện chi tiết đơn
        end
        deactivate LRS
    end
    deactivate GW
    deactivate FE

## Luồng Admin Duyệt Đơn (Approve Request)

sequenceDiagram
autonumber
actor Admin as 👤 Admin
participant FE as 🖥️ Frontend
participant GW as 🚪 API Gateway
participant NATS as 📨 NATS Broker
participant AS as ⚙️ Approval Service
participant Redis as 🔴 BullMQ (Redis)
participant DB as 🗄️ MongoDB

    Admin->>FE: Bấm "Phê duyệt"
    activate FE
    FE->>GW: PATCH /api/approval/:id/approved
    activate GW

    %% Tầng Auth tại Gateway
    GW->>GW: 1. AccessTokenGuard & RoleGuard(ADMIN)
    GW->>NATS: 2. send('admin.approve.request', { id, status, user })
    activate NATS
    NATS->>AS: Forward event
    deactivate NATS
    activate AS

    %% Xử lý tại Approval Service
    AS->>DB: 3. findById(id)
    activate DB
    DB-->>AS: Thông tin đơn duyệt (existingRequest)
    deactivate DB

    alt Đơn không PENDING
        AS-->>NATS: RpcError(APPROVAL_ALREADY_PROCESSED)
        NATS-->>GW: Forward Error
        GW-->>FE: 400 Bad Request
        FE-->>Admin: "Đơn này đã được xử lý từ trước"
    else Đơn hợp lệ (PENDING)
        AS->>AS: 4. Kiểm tra Hạn duyệt (expiresAt)

        alt Hết hạn (delay <= 0)
            AS->>DB: 5. findByIdAndUpdate(status: CANCELLED, reason: 'Đơn hết hạn xác nhận')
            AS->>NATS: 6. emit(data.messageName, update_data) (Bắn sự kiện CANCELLED về Service gốc)
            AS-->>NATS: Trả về { message: 'Đơn duyệt này đã hết hạn... admin không được duyệt nữa' }
            NATS-->>GW: Forward Response
            GW-->>FE: 200 OK
        else Còn hạn (delay > 0)
            AS->>DB: 5. findByIdAndUpdate(status: APPROVED, processedBy: Admin)
            %% Gửi Job vào Hàng đợi (BullMQ) để chờ Hết hạn (Expiration Queue)
            AS->>Redis: 6. approvalQueue.add('process-expiration', data, { delay })
            activate Redis
            Redis-->>AS: Job ID
            deactivate Redis
            AS-->>NATS: Trả về { message: 'Đã duyệt thành công và gửi yêu cầu sửa tới service...' }
            NATS-->>GW: Forward Response
            GW-->>FE: 200 OK
            FE-->>Admin: "Duyệt đơn thành công!"
        end
    end
    deactivate AS
    deactivate GW
    deactivate FE

## Luồng Admin Từ chối Đơn (Reject Request)

sequenceDiagram
autonumber
actor Admin as 👤 Admin
participant FE as 🖥️ Frontend
participant GW as 🚪 API Gateway
participant NATS as 📨 NATS Broker
participant AS as ⚙️ Approval Service
participant DB as 🗄️ MongoDB

    Admin->>FE: Bấm "Từ chối" & Nhập lý do
    activate FE
    FE->>GW: PATCH /api/approval/:id/reject (Body: { rejectReason })
    activate GW

    GW->>GW: 1. AccessTokenGuard & RoleGuard(ADMIN)
    GW->>NATS: 2. send('admin.reject.request', { id, rejectReason, user })
    activate NATS
    NATS->>AS: Forward event
    deactivate NATS
    activate AS

    %% Xử lý tại Approval Service
    AS->>DB: 3. findById(id)
    activate DB
    DB-->>AS: Thông tin đơn
    deactivate DB

    alt Đơn không PENDING
        AS-->>NATS: RpcError(APPROVAL_ALREADY_PROCESSED)
        NATS-->>GW: Forward Error
        GW-->>FE: 400 Bad Request
    else Đơn hợp lệ
        AS->>DB: 4. findByIdAndUpdate(status: REJECTED, rejectReason)
        activate DB
        DB-->>AS: Trả về kết quả
        deactivate DB

        AS->>AS: 5. Kiểm tra Hạn duyệt (expiresAt)
        alt Hết hạn (delay <= 0)
            AS->>DB: 6. findByIdAndUpdate(status: CANCELLED, reason: 'Đơn hết hạn xác nhận')
            AS->>NATS: 7. emit(data.messageName, update_data) (Bắn sự kiện CANCELLED về Service gốc)
            AS-->>NATS: Trả về { message: 'Đơn này hết hạn rồi admin không duyệt nữa' }
        else Còn hạn hoặc Không có hạn
            AS-->>NATS: Trả về { message: 'Đã từ chối đơn thành công' }
        end
        NATS-->>GW: Forward Response
        GW-->>FE: 200 OK + Message
        FE-->>Admin: Hiển thị thông báo kết quả
    end
    deactivate AS
    deactivate GW
    deactivate FE

## Luồng tự động hủy đơn quá hạn (Auto Cancel CronJob)

sequenceDiagram
autonumber
participant CRON as ⏰ CronJob (Leave Request Service)
participant LRS as ⚙️ Leave Request Service
participant AS as ⚙️ Approval Service
participant NATS as 📨 NATS Broker
participant DB as 🗄️ MongoDB

    CRON->>LRS: Kích hoạt lúc 00:00 mỗi ngày
    activate LRS

    LRS->>DB: 1. find({ status: PENDING, startDate: { $lt: now } })
    activate DB
    DB-->>LRS: Trả về danh sách đơn (expiredRequests)
    deactivate DB

    alt Không có đơn nào quá hạn
        LRS->>LRS: Ghi log "Không có đơn quá hạn"
    else Có đơn quá hạn
        loop Từng đơn trong expiredRequests
            LRS->>DB: 2. Cập nhật status = CANCELLED
            LRS->>NATS: 3. send(CANCEL_APPROVAL_MESSAGE, { id_req, user: system@local })
            activate NATS
            NATS->>AS: Forward event
            deactivate NATS
            activate AS
            
            AS->>DB: 4. Cập nhật status = CANCELLED bên bảng Approval
            AS-->>NATS: Success
            deactivate AS
            
            NATS-->>LRS: Nhận Response
        end
        LRS->>LRS: 5. Ghi log hoàn tất hủy tự động
    end
    deactivate LRS

## Lưu ý về Pagination và TransformInterceptor

Trong hệ thống, `TransformInterceptor` tự động bóc tách các payload có trường `data` để chuẩn hóa response format (vd: `{ traceId, success, data }`).
Tuy nhiên, đối với tính năng **Phân trang (Pagination)**, backend cần trả về cấu trúc `{ data: [...], totalPages: N }`. Nếu sử dụng key `data`, interceptor sẽ ghi đè và làm mất trường `totalPages`.
**Giải pháp hiện tại**: Đổi key trả về từ `data` thành `items` (ví dụ: `{ items: [...], totalPages: N }`) để bypass cơ chế bóc tách mặc định của Interceptor. Backend & Frontend đều đã được đồng bộ để sử dụng key `items`.

## Admin Dashboard - Chỉnh sửa thông tin cá nhân

Giao diện Admin (`AdminDashboard.tsx`) đã được cập nhật để cho phép Admin tự xem và chỉnh sửa thông tin cá nhân của mình tương tự như nhân viên:
1. **Xem thông tin (View Profile Modal)**: Hiển thị Read-only thông tin chi tiết của Admin (Tên, Email, Vai trò, Chức vụ...).
2. **Sửa thông tin (Edit Profile Modal)**: Gọi API `PUT /api/users/profile` để cập nhật họ tên, sđt, ngày sinh và làm mới giao diện ngay lập tức.
