![Node.js](https://img.shields.io/badge/Node.js-20.x-brightgreen?style=flat&logo=node.js) ![Jest](https://img.shields.io/badge/Jest-100%25_Test_Coverage-success?style=flat&logo=jest)

# Netflix-NestJS-Server

---

> **NestJS**를 활용해 넷플릭스 서버의 주요 기능을 구현한 프로젝트입니다.  
> 인증, 실시간 채팅, 캐싱, Task 스케쥴링, CI/CD 파이프라인 등을 포함한 NestJS의 주요 개념과 자주 쓰이는 외부 라이브러리를 학습하기 위해 설계되었습니다.

---

## 주요 기능 (Key Features)

1. **인증 및 권한 관리**

   - JWT 기반 토큰 인증 및 세션 인증 지원
   - Role-Based Access Control(관리자, 사용자 등)

2. **영화(영상) 업로드 & 인코딩**

   - 대용량 파일 업로드를 위한 Presigned URL 활용
   - Bull/BullMQ 등 큐(Queue) 기반 인코딩 처리로 서버 부하 최소화

3. **실시간 채팅**

   - WebSocket (Socket.IO)을 사용한 실시간 채팅 기능
   - 고객지원 및 사용자 간 채팅을 빠르고 안정적으로 제공

4. **캐싱**

   - Redis를 통한 인기 동영상 목록 등 자주 조회되는 데이터 캐싱
   - API 성능 최적화 및 DB 부하 감소

5. **스케줄링 & 태스크**

   - 일정 주기로 실행되는 Cron 작업
   - Queue를 통한 비동기 태스크 처리 (인코딩, 알림 등)

6. **로그 관리 & 모니터링**

   - Winston, Pino 등을 사용한 통합 로깅
   - 중요 이벤트, 에러 모니터링 및 알림 설정(예: Slack, Email 등)

7. **CI/CD & 배포**

   - GitHub Actions로 CI/CD 파이프라인 구성
   - Docker 기반 컨테이너 이미지 빌드/배포
   - AWS(ECS, ECR, S3 등)을 활용한 클라우드 환경 배포

8. **테스트 코드 & 문서화**
   - Jest를 통한 단위/통합 테스트
   - Swagger 등을 활용한 API 문서화

---

## 기술 스택 (Tech Stack)

| 분야                   | 상세 내용                                                        |
| ---------------------- | ---------------------------------------------------------------- |
| **Framework**          | [NestJS](https://nestjs.com/)                                    |
| **Language**           | TypeScript                                                       |
| **Database**           | PostgreSQL (TypeORM & Prisma), MongoDB (Mongoose)                |
| **ORM**                | TypeORM 또는 Prisma                                              |
| **Caching & Queue**    | [Redis](https://redis.io/) + Bull/BullMQ (큐 처리)               |
| **File Storage**       | AWS S3 (using Presigned URLs)                                    |
| **Logging**            | [Winston](https://github.com/winstonjs/winston), Pino            |
| **Testing**            | [Jest](https://jestjs.io/) (Unit, Integration, E2E), SuperTest   |
| **Deployment & CI/CD** | AWS (EC2, S3, RDS, Elastic Beanstalk), Docker, GitHub Actions 등 |
| **Real-Time**          | WebSocket (Socket.IO)                                            |

---

## 프로젝트 구조 (Project Structure)

```plaintext
Netflix-NestJS-Server
├── src
│   ├── auth          # 인증/인가 관련 모듈 (JWT, 세션, RBAC 등)
│   ├── movies        # 영화/영상 관련 모듈 (인코딩, 업로드, 큐 처리 등)
│   ├── chats         # 실시간 채팅 모듈 (WebSocket/Socket.IO)
│   ├── caching       # Redis 캐싱 로직
│   ├── tasks         # 스케줄링 및 태스크 처리 (Bull/BullMQ)
│   ├── logs          # 로그 설정 관련 (Winston, Pino)
│   ├── common        # 공통 유틸, 인터셉터, 필터, 데코레이터 등
│   ├── app.module.ts # 메인 애플리케이션 모듈
│   └── main.ts       # 엔트리 포인트
├── test              # 테스트 코드 (Jest)
├── scripts           # 배포, 마이그레이션 스크립트
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

---

## AWS 아키텍처 (AWS Architecture)

![Image](https://github.com/user-attachments/assets/1818d294-08d5-4f65-9f4f-8ae544162940)

### 설명

1. **Route 53**: 도메인 관리 및 로드 밸런싱
2. **Elastic Load Balancer (ELB)**: 트래픽 분산 처리
3. **Elastic Beanstalk**: 애플리케이션 배포 및 관리
4. **EC2 Autoscaling**: 동적 인스턴스 확장
5. **S3**: 정적 파일 저장 (영상, 이미지 등)
6. **Redis**: 데이터 캐싱
7. **RDS**: PostgreSQL 데이터베이스 관리
8. **CloudWatch**: 로깅 및 모니터링

---

## 설치 및 실행 (Installation & Usage)

### Requirements

- **Node.js** (v20+)
- **PostgreSQL** & **Redis**
- **AWS CLI**

### Steps

1. **프로젝트 클론**

   ```bash
   git clone https://github.com/yooseungmo/netflix-nestjs-server.git
   cd netflix-nestjs-server
   ```

2. **의존성 설치 및 서버 실행**

   ```bash
   npm install # 패키지 설치
   docker-compose up -d # Redis 및 PostgreSQL 실행
   npm run start:dev # 개발 서버 실행
   ```

3. **테스트 실행**
   ```bash
   npm run test # 단위 테스트
   npm run test:e2e # 통합 테스트
   npm run test:cov # 테스트 커버리지 확인
   ```

---

## 테스트 (Testing)

프로젝트는 **Jest**를 활용하여 **유닛(Unit), 통합(Integration), E2E(End-to-End) 테스트**를 진행하였으며,  
**모든 테스트의 커버리지가 100% 달성**되었습니다.

- **API 응답 검증**: `supertest` 활용
- **테스트 데이터 초기화 및 정리**: `typeorm` 활용

### Commands

```bash
# Unit tests
npm run test

# Integation tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

| File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |
| ---------------------- | ------- | -------- | ------- | ------- | ----------------- |
| All files              | 100.00  | 100.00   | 100.00  | 100.00  |
| auth                   | 100.00  | 100.00   | 100.00  | 100.00  |
| auth.controller.ts     | 100.00  | 100.00   | 100.00  | 100.00  |
| auth.service.ts        | 100.00  | 100.00   | 100.00  | 100.00  |
| director               | 100.00  | 100.00   | 100.00  | 100.00  |
| director.controller.ts | 100.00  | 100.00   | 100.00  | 100.00  |
| director.service.ts    | 100.00  | 100.00   | 100.00  | 100.00  |
| genre                  | 100.00  | 100.00   | 100.00  | 100.00  |
| genre.controller.ts    | 100.00  | 100.00   | 100.00  | 100.00  |
| genre.service.ts       | 100.00  | 100.00   | 100.00  | 100.00  |
| movie                  | 100.00  | 100.00   | 100.00  | 100.00  |
| movie.controller.ts    | 100.00  | 100.00   | 100.00  | 100.00  |
| movie.service.ts       | 100.00  | 100.00   | 100.00  | 100.00  |
| user                   | 100.00  | 100.00   | 100.00  | 100.00  |
| user.controller.ts     | 100.00  | 100.00   | 100.00  | 100.00  |
| user.service.ts        | 100.00  | 100.00   | 100.00  | 100.00  |

![Test Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen?style=flat&logo=jest) ![Tests Passed](https://img.shields.io/badge/Tests-130%20Passed-success?style=flat) ![Test Duration](https://img.shields.io/badge/Duration-17.495s-blue?style=flat)

---

## 라이선스 (License)

이 프로젝트는 [MIT License](./LICENSE)에 따라 자유롭게 사용 가능합니다.

---
