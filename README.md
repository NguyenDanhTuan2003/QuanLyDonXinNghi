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
participant BE as ⚙️ Backend (Nestjs)
participant Redis as 🔴 Redis

    User->>BE: POST /api/auth/login (email, password)
    activate BE
    alt lỗi validate nhập email và pass rác
        BE-->>User: Trả về lỗi Validation (400 Bad Request)
    else Validate hợp lệ
        BE->>BE: Tìm User trong DB & Check Password
        alt Không tìm thấy User HOẶC Mật khẩu sai
            BE-->>User: Trả về lỗi 401 (Unauthorized)
        else email và pass chính xác
            BE->>BE: tạo chuỗi token
            BE->>Redis: rftoken
            activate Redis
            Redis-->>BE: Lưu thành công
            deactivate Redis
            BE-->>User: Trả về 200 OK (AccessToken + Set-Cookie RefreshToken)
        end
    end
    deactivate BE

## Luồng đăng ký hệ thống

sequenceDiagram
actor User as 👤 Người dùng
participant BE as ⚙️ Backend (NestJS)

    User->>BE: POST /api/auth/register (payload)
    activate BE
    alt Validate dữ liệu thất bại
        BE-->>User: Trả về lỗi Validation (400 Bad Request)
    else Validate hợp lệ
        BE->>BE: Kiểm tra email
        alt Email đã tồn tại
            BE-->>User: Trả về lỗi 409 Conflict
        else Email chưa tồn tại
            BE->>BE: Lưu thông tin User mới
            BE-->>User: Trả về 201 Created / 200 OK
        end
    end
    deactivate BE

## luồng sửa profile

sequenceDiagram
autonumber
actor User as 👤 Người dùng
participant BE as ⚙️ Backend (Nestjs)

    User->>BE: PUT /api/users/profile (Header: Bearer JWT)
    activate BE
    BE->>BE: 1. @UseGuards(AccessToken)
    alt Token hết hạn / Không hợp lệ
        BE-->>User: 2a. Trả về 401 (Unauthorized)
    else Token hợp lệ
        BE->>BE: 3. Validate DTO
        alt DTO sai định dạng
            BE-->>User: 4a. Trả về lỗi 400 (Bad Request)
        else DTO hợp lệ
            BE->>BE: 5. Cập nhật thông tin User
            BE-->>User: 6. Trả về 200 OK + User Info mới
        end
    end
    deactivate BE

## Luồng logout

sequenceDiagram
actor User as 👤 Người dùng
participant BE as ⚙️ Backend (NestJS)
participant Redis as 🔴 Redis

    User->>BE: POST /api/auth/logout
    activate BE
    alt Token hết hạn hoặc sai
        BE-->>User: thông báo lỗi 401
    else Token còn hạn
        BE->>Redis: ném 2 token vào blacklist
        activate Redis
        Redis-->>BE: lưu thành công
        deactivate Redis
        BE-->>User: logout thành công
    end
    deactivate BE

## Luồng xem thông tin user

sequenceDiagram
autonumber
actor User as 👤 Người dùng
participant BE as ⚙️ Backend (Nestjs)

    User->>BE: GET /api/users/profile
    activate BE
    BE->>BE: 1. @UseGuards(AccessToken)
    alt Token hết hạn / Không hợp lệ
        BE-->>User: 2a. Trả về 401 (Unauthorized)
    else Token hợp lệ
        BE->>BE: 3. Tìm thông tin user
        BE-->>User: 4. Trả về 200 và thông tin user
    end
    deactivate BE

## luồng sửa thông tin user

sequenceDiagram
autonumber
actor User as 👤 Người dùng
participant GW as 🚪 API Gateway
participant US as ⚙️ User Service

    User->>GW: PUT /api/users/profile (Body + JWT)
    activate GW
    GW->>GW: 1. ValidationPipe & AccessTokenGuard
    alt Lỗi Validate / Token sai
        GW-->>User: 400 Bad Request / 401 Unauthorized
    else Hợp lệ
        GW->>US: 2. Forward Request
        activate US
        US->>US: 3. Cập nhật thông tin user
        alt Không tìm thấy user
            US-->>GW: RpcError(NOT_FOUND)
            GW-->>User: 404 Not Found
        else Thành công
            US-->>GW: Response
            GW-->>User: 200 OK + Data
        end
        deactivate US
    end
    deactivate GW

## Luồng tạo đơn xin nghỉ (Create Leave Request)

sequenceDiagram
autonumber
actor User as 👤 Người dùng
participant GW as 🚪 API Gateway
participant LRS as ⚙️ Leave Request Service
participant AS as ⚙️ Approval Service

    User->>GW: POST /api/leave-request/create (Body + JWT)
    activate GW
    GW->>GW: 1. ValidationPipe & AccessTokenGuard
    alt Lỗi Validate / Token sai
        GW-->>User: 400 Bad Request / 401 Unauthorized
    else Hợp lệ
        GW->>LRS: 2. Forward Request
        activate LRS
        LRS->>LRS: 3. Kiểm tra trùng lặp thời gian nghỉ
        alt Trùng thời gian nghỉ
            LRS-->>GW: RpcError(CONFLICT)
            GW-->>User: 409 Conflict
        else Không trùng lặp
            LRS->>LRS: 4. Lưu đơn vào DB
            LRS->>AS: 5. Gửi sự kiện tạo đơn duyệt
            activate AS
            AS->>AS: 6. Lưu yêu cầu duyệt
            AS-->>LRS: Thành công
            deactivate AS
            LRS-->>GW: Trả về dữ liệu đơn mới
            GW-->>User: 201 Created / 200 OK
        end
        deactivate LRS
    end
    deactivate GW

## Luồng xem danh sách đơn xin nghỉ (của User)

sequenceDiagram
autonumber
actor User as 👤 Người dùng
participant GW as 🚪 API Gateway
participant LRS as ⚙️ Leave Request Service

    User->>GW: GET /api/leave-request/getall?page=1...
    activate GW
    GW->>GW: 1. AccessTokenGuard
    alt Token không hợp lệ
        GW-->>User: 401 Unauthorized
    else Token hợp lệ
        GW->>LRS: 2. Forward Request
        activate LRS
        LRS->>LRS: 3. Tìm danh sách đơn của User
        LRS-->>GW: Trả về Array Data
        deactivate LRS
        GW-->>User: 200 OK + Data
    end
    deactivate GW

## Luồng Admin xem tất cả đơn xin nghỉ (Có luồng lọc nâng cao & Tối ưu map dữ liệu)

sequenceDiagram
autonumber
actor Admin as 👤 Admin
participant GW as 🚪 API Gateway
participant LRS as ⚙️ Leave Request Service
participant US as ⚙️ User Service

    Admin->>GW: Lọc & Xem "Quản lý đơn từ" (Kèm bộ lọc Date, Status...)
    activate GW
    GW->>GW: 1. AccessTokenGuard & RoleGuard(ADMIN)
    alt Không phải Admin
        GW-->>Admin: 403 Forbidden
    else Hợp lệ
        GW->>LRS: 2. Forward Request
        activate LRS
        LRS->>LRS: 3. formatMongoOperators() & applyDateFilters()
        LRS->>LRS: 4. Tìm danh sách đơn
        alt data rỗng
            LRS-->>GW: { items: [], totalPages: 0 }
            GW-->>Admin: 200 OK + []
        else data có phần tử
            LRS->>LRS: 5. Lọc uniqueUserIds
            LRS->>US: 6. Lấy thông tin User hàng loạt (Batch)
            activate US
            US->>US: 7. Tìm danh sách Users
            US-->>LRS: Trả về danh sách User
            deactivate US
            LRS->>LRS: 8. Ghép nối dữ liệu User vào Leave Request
            LRS-->>GW: Trả về { items: newData, totalPages }
            GW-->>Admin: 200 OK + Data
        end
        deactivate LRS
    end
    deactivate GW

## Luồng Hủy đơn xin nghỉ (Cancel Leave Request)

sequenceDiagram
autonumber
actor User as 👤 Người dùng
participant GW as 🚪 API Gateway
participant LRS as ⚙️ Leave Request Service
participant AS as ⚙️ Approval Service

    User->>GW: PATCH /api/leave-request/:id/cancel
    activate GW
    GW->>GW: 1. AccessTokenGuard
    GW->>LRS: 2. Forward Request
    activate LRS
    LRS->>LRS: 3. Cập nhật status = CANCELLED
    alt Đơn không tồn tại / Đã xử lý
        LRS-->>GW: RpcError
        GW-->>User: 400 Bad Request
    else Hủy thành công (Bước 1)
        LRS->>AS: 4. Gửi sự kiện Hủy sang Approval Service
        activate AS
        AS->>AS: 5. Cập nhật status = CANCELLED
        alt Lỗi tại Approval Service
            AS-->>LRS: Error
            LRS->>LRS: 6. Rollback (status = PENDING)
            LRS-->>GW: Error
            GW-->>User: 500 Internal Server Error
        else Approval hủy thành công
            AS-->>LRS: Success
            deactivate AS
            LRS-->>GW: Success
            GW-->>User: 200 OK + Message
        end
    end
    deactivate LRS
    deactivate GW

## Luồng xem chi tiết đơn xin nghỉ (User/Admin)

sequenceDiagram
autonumber
actor User as 👤 Người dùng (hoặc Admin)
participant GW as 🚪 API Gateway
participant LRS as ⚙️ Leave Request Service

    User->>GW: GET /api/leave-request/:id
    activate GW
    GW->>GW: 1. AccessTokenGuard
    alt Token không hợp lệ
        GW-->>User: 401 Unauthorized
    else Token hợp lệ
        GW->>LRS: 2. Forward Request
        activate LRS
        LRS->>LRS: 3. Kiểm tra Role
        LRS->>LRS: 4. Tìm chi tiết đơn
        alt Không tìm thấy đơn
            LRS-->>GW: RpcError
            GW-->>User: 404 Not Found
        else data tồn tại
            LRS-->>GW: Object Data
            GW-->>User: 200 OK + Data
        end
        deactivate LRS
    end
    deactivate GW

## Luồng Admin Duyệt Đơn (Approve Request)

sequenceDiagram
autonumber
actor Admin as 👤 Admin
participant GW as 🚪 API Gateway
participant AS as ⚙️ Approval Service
participant Redis as 🔴 BullMQ (Redis)

    Admin->>GW: PATCH /api/approval/:id/approved
    activate GW
    GW->>GW: 1. AccessTokenGuard & RoleGuard(ADMIN)
    GW->>AS: 2. Forward Request
    activate AS
    AS->>AS: 3. Lấy thông tin đơn duyệt
    alt Đơn không PENDING
        AS-->>GW: Error
        GW-->>Admin: 400 Bad Request
    else Đơn hợp lệ (PENDING)
        AS->>AS: 4. Kiểm tra Hạn duyệt (expiresAt)
        alt Hết hạn (delay <= 0)
            AS->>AS: 5. Cập nhật CANCELLED & Bắn sự kiện về Service gốc
            AS-->>GW: Trả về thông báo hết hạn
            GW-->>Admin: 200 OK
        else Còn hạn (delay > 0)
            AS->>AS: 5. Cập nhật APPROVED
            AS->>Redis: 6. Gửi Job chờ Hết hạn vào Hàng đợi
            activate Redis
            Redis-->>AS: Job ID
            deactivate Redis
            AS-->>GW: Thành công
            GW-->>Admin: 200 OK
        end
    end
    deactivate AS
    deactivate GW

## Luồng Admin Từ chối Đơn (Reject Request)

sequenceDiagram
autonumber
actor Admin as 👤 Admin
participant GW as 🚪 API Gateway
participant AS as ⚙️ Approval Service

    Admin->>GW: PATCH /api/approval/:id/reject
    activate GW
    GW->>GW: 1. AccessTokenGuard & RoleGuard(ADMIN)
    GW->>AS: 2. Forward Request
    activate AS
    AS->>AS: 3. Lấy thông tin đơn
    alt Đơn không PENDING
        AS-->>GW: Error
        GW-->>Admin: 400 Bad Request
    else Đơn hợp lệ
        AS->>AS: 4. Cập nhật REJECTED
        AS->>AS: 5. Kiểm tra Hạn duyệt
        alt Hết hạn (delay <= 0)
            AS->>AS: 6. Cập nhật CANCELLED & Bắn sự kiện về Service gốc
            AS-->>GW: Trả về thông báo hết hạn
        else Còn hạn hoặc Không có hạn
            AS-->>GW: Trả về thành công
        end
        GW-->>Admin: 200 OK + Message
    end
    deactivate AS
    deactivate GW

## Luồng tự động hủy đơn quá hạn (Auto Cancel CronJob)

sequenceDiagram
autonumber
participant CRON as ⏰ CronJob (Leave Request Service)
participant LRS as ⚙️ Leave Request Service
participant AS as ⚙️ Approval Service

    CRON->>LRS: Kích hoạt lúc 00:00 mỗi ngày
    activate LRS
    LRS->>LRS: 1. Lấy danh sách đơn PENDING quá hạn
    alt Không có đơn nào quá hạn
        LRS->>LRS: Ghi log
    else Có đơn quá hạn
        loop Từng đơn
            LRS->>LRS: 2. Cập nhật status = CANCELLED
            LRS->>AS: 3. Gửi lệnh Hủy sang Approval Service
            activate AS
            AS->>AS: 4. Cập nhật status = CANCELLED
            AS-->>LRS: Success
            deactivate AS
        end
        LRS->>LRS: 5. Ghi log hoàn tất
    end
    deactivate LRS


