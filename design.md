# UTAGE × L-STEP 統合マーケティング自動化システム 設計書

## 1. システムアーキテクチャ

### 1.1 全体構成図

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Client Layer                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Web Browser   │  │   LINE App      │  │   Mobile App    │             │
│  │   (React 19)    │  │   (Webhook)     │  │   (Future)      │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
└───────────┼─────────────────────┼─────────────────────┼─────────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Edge Layer                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Cloudflare CDN / WAF                            │   │
│  │   - 静的アセット配信                                                  │   │
│  │   - DDoS保護                                                         │   │
│  │   - SSL終端                                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Application Layer                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Google Cloud Run                                  │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                  Next.js 15 Application                      │   │   │
│  │  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │   │   │
│  │  │  │ App Router    │  │ Server        │  │ API Routes    │   │   │   │
│  │  │  │ (RSC/RCC)     │  │ Actions       │  │ (Webhook)     │   │   │   │
│  │  │  └───────────────┘  └───────────────┘  └───────────────┘   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Data Layer                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Cloud SQL   │  │   Upstash    │  │  Cloudflare  │  │  Cloudflare  │   │
│  │  PostgreSQL  │  │   Redis      │  │  R2          │  │  Stream      │   │
│  │  (Primary)   │  │  (Cache)     │  │  (Storage)   │  │  (Video)     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Background Jobs Layer                              │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐│
│  │        Cloud Tasks               │  │      Cloud Scheduler             ││
│  │  ┌────────┐  ┌────────┐         │  │  ┌────────────────────────────┐ ││
│  │  │ Email  │  │ LINE   │         │  │  │ Cron Jobs                  │ ││
│  │  │ Queue  │  │ Queue  │         │  │  │ - 定期レポート生成          │ ││
│  │  └────────┘  └────────┘         │  │  │ - サブスク更新チェック      │ ││
│  │  ┌────────┐  ┌────────┐         │  │  │ - データクリーンアップ      │ ││
│  │  │ SMS    │  │Webhook │         │  │  └────────────────────────────┘ ││
│  │  │ Queue  │  │ Queue  │         │  │                                  ││
│  │  └────────┘  └────────┘         │  │                                  ││
│  └──────────────────────────────────┘  └──────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          External Services Layer                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │  LINE  │ │SendGrid│ │ Stripe │ │ Zoom   │ │ Google │ │ Twilio │        │
│  │  API   │ │  API   │ │  API   │ │  API   │ │Calendar│ │  API   │        │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
│  ┌────────┐ ┌────────┐ ┌────────┐                                          │
│  │ Clerk  │ │ Pusher │ │ Claude │                                          │
│  │ (Auth) │ │ (WS)   │ │  API   │                                          │
│  └────────┘ └────────┘ └────────┘                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 レイヤー別責務

| レイヤー | 責務 | 技術 |
|----------|------|------|
| Client | UI表示、ユーザーインタラクション | React 19, Next.js App Router |
| Edge | CDN、WAF、SSL終端 | Cloudflare |
| Application | ビジネスロジック、API処理 | Next.js 15, Server Actions |
| Data | データ永続化、キャッシュ | PostgreSQL, Redis, R2 |
| Background | 非同期処理、定期実行 | Cloud Tasks, Cloud Scheduler |
| External | 外部サービス連携 | LINE, SendGrid, Stripe等 |

---

## 2. データベース設計

### 2.1 ER図（主要エンティティ）

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Tenant      │       │      User       │       │     Contact     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │       │ id (PK)         │
│ name            │  │    │ tenantId (FK)   │──┐    │ tenantId (FK)   │──┐
│ subdomain       │  │    │ email           │  │    │ email           │  │
│ plan            │  │    │ role            │  │    │ lineUserId      │  │
│ stripeCustomerId│  │    │ clerkUserId     │  │    │ phone           │  │
│ createdAt       │  │    │ createdAt       │  │    │ name            │  │
│ updatedAt       │  └────│                 │  │    │ score           │  │
└─────────────────┘       └─────────────────┘  │    │ customFields    │  │
        │                                       │    │ createdAt       │  │
        │                                       │    └─────────────────┘  │
        │                                       │            │            │
        ▼                                       │            ▼            │
┌─────────────────┐                            │    ┌─────────────────┐  │
│    Campaign     │                            │    │   ContactTag    │  │
├─────────────────┤                            │    ├─────────────────┤  │
│ id (PK)         │                            │    │ contactId (FK)  │──┘
│ tenantId (FK)   │────────────────────────────┘    │ tagId (FK)      │───┐
│ name            │                                  └─────────────────┘   │
│ type            │                                          │             │
│ status          │                                          ▼             │
│ createdAt       │                                  ┌─────────────────┐   │
└─────────────────┘                                  │       Tag       │   │
        │                                            ├─────────────────┤   │
        │                                            │ id (PK)         │◄──┘
        ▼                                            │ tenantId (FK)   │
┌─────────────────┐                                  │ name            │
│  CampaignStep   │                                  │ color           │
├─────────────────┤                                  └─────────────────┘
│ id (PK)         │
│ campaignId (FK) │       ┌─────────────────┐       ┌─────────────────┐
│ order           │       │     Funnel      │       │   FunnelPage    │
│ type            │       ├─────────────────┤       ├─────────────────┤
│ delayDays       │       │ id (PK)         │       │ id (PK)         │
│ delayTime       │       │ tenantId (FK)   │──┐    │ funnelId (FK)   │──┐
│ content         │       │ name            │  │    │ name            │  │
│ conditions      │       │ domain          │  │    │ slug            │  │
└─────────────────┘       │ status          │  │    │ content         │  │
                          └─────────────────┘  │    │ order           │  │
                                  │            │    └─────────────────┘  │
                                  │            │            │            │
                                  ▼            │            ▼            │
                          ┌─────────────────┐  │    ┌─────────────────┐  │
                          │     Product     │  │    │  FunnelAction   │  │
                          ├─────────────────┤  │    ├─────────────────┤  │
                          │ id (PK)         │  │    │ id (PK)         │  │
                          │ tenantId (FK)   │──┘    │ pageId (FK)     │──┘
                          │ name            │       │ type            │
                          │ price           │       │ config          │
                          │ stripeProductId │       └─────────────────┘
                          │ stripePriceId   │
                          └─────────────────┘
                                  │
                                  ▼
                          ┌─────────────────┐       ┌─────────────────┐
                          │     Order       │       │   Subscription  │
                          ├─────────────────┤       ├─────────────────┤
                          │ id (PK)         │       │ id (PK)         │
                          │ tenantId (FK)   │       │ tenantId (FK)   │
                          │ contactId (FK)  │       │ contactId (FK)  │
                          │ productId (FK)  │       │ productId (FK)  │
                          │ amount          │       │ stripeSubId     │
                          │ status          │       │ status          │
                          │ stripePaymentId │       │ currentPeriodEnd│
                          └─────────────────┘       └─────────────────┘
```

### 2.2 Prismaスキーマ

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== テナント ====================

model Tenant {
  id               String   @id @default(cuid())
  name             String
  subdomain        String   @unique
  plan             Plan     @default(STARTER)
  stripeCustomerId String?

  // 設定
  settings         Json     @default("{}")

  // タイムスタンプ
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // リレーション
  users            User[]
  contacts         Contact[]
  tags             Tag[]
  campaigns        Campaign[]
  funnels          Funnel[]
  products         Product[]
  orders           Order[]
  subscriptions    Subscription[]
  courses          Course[]
  events           Event[]
  partners         Partner[]

  @@index([subdomain])
}

enum Plan {
  STARTER
  STANDARD
  PRO
  ENTERPRISE
}

// ==================== ユーザー（管理者） ====================

model User {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  email       String
  name        String?
  role        UserRole @default(MEMBER)
  clerkUserId String   @unique

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, email])
  @@index([tenantId])
  @@index([clerkUserId])
}

enum UserRole {
  OWNER
  ADMIN
  MEMBER
  OPERATOR
}

// ==================== コンタクト（顧客） ====================

model Contact {
  id            String   @id @default(cuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // 識別情報
  email         String?
  lineUserId    String?
  phone         String?

  // 基本情報
  name          String?
  firstName     String?
  lastName      String?

  // スコアリング
  score         Int      @default(0)

  // カスタムフィールド（最大100項目）
  customFields  Json     @default("{}")

  // 流入経路
  source        String?
  sourceDetail  Json?

  // メール配信設定
  emailOptIn    Boolean  @default(true)
  emailOptInAt  DateTime?

  // LINE配信設定
  lineOptIn     Boolean  @default(true)
  lineOptInAt   DateTime?

  // タイムスタンプ
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // リレーション
  tags          ContactTag[]
  campaignContacts CampaignContact[]
  orders        Order[]
  subscriptions Subscription[]
  courseEnrollments CourseEnrollment[]
  eventRegistrations EventRegistration[]
  messageHistories MessageHistory[]

  @@unique([tenantId, email])
  @@unique([tenantId, lineUserId])
  @@index([tenantId])
  @@index([tenantId, email])
  @@index([tenantId, lineUserId])
}

// ==================== タグ ====================

model Tag {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name      String
  color     String   @default("#6366f1")

  createdAt DateTime @default(now())

  contacts  ContactTag[]

  @@unique([tenantId, name])
  @@index([tenantId])
}

model ContactTag {
  id        String   @id @default(cuid())
  contactId String
  contact   Contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)
  tagId     String
  tag       Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([contactId, tagId])
  @@index([contactId])
  @@index([tagId])
}

// ==================== キャンペーン（配信） ====================

model Campaign {
  id        String         @id @default(cuid())
  tenantId  String
  tenant    Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name      String
  type      CampaignType
  status    CampaignStatus @default(DRAFT)

  // 設定
  settings  Json           @default("{}")

  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  steps     CampaignStep[]
  contacts  CampaignContact[]

  @@index([tenantId])
  @@index([tenantId, status])
}

enum CampaignType {
  EMAIL_STEP
  EMAIL_BROADCAST
  LINE_STEP
  LINE_BROADCAST
  LINE_SEGMENT
  SMS
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}

model CampaignStep {
  id          String   @id @default(cuid())
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  order       Int
  type        StepType

  // タイミング
  delayDays   Int      @default(0)
  delayHours  Int      @default(0)
  delayMinutes Int     @default(0)
  sendTime    String?  // HH:mm形式

  // コンテンツ
  subject     String?  // メール件名
  content     Json     // メッセージ内容

  // 条件分岐
  conditions  Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([campaignId])
  @@index([campaignId, order])
}

enum StepType {
  MESSAGE
  WAIT
  CONDITION
  ACTION
}

model CampaignContact {
  id          String   @id @default(cuid())
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  contactId   String
  contact     Contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)

  currentStep Int      @default(0)
  status      CampaignContactStatus @default(ACTIVE)

  startedAt   DateTime @default(now())
  completedAt DateTime?

  @@unique([campaignId, contactId])
  @@index([campaignId])
  @@index([contactId])
}

enum CampaignContactStatus {
  ACTIVE
  PAUSED
  COMPLETED
  UNSUBSCRIBED
}

// ==================== メッセージ履歴 ====================

model MessageHistory {
  id          String        @id @default(cuid())
  tenantId    String
  contactId   String
  contact     Contact       @relation(fields: [contactId], references: [id], onDelete: Cascade)

  channel     MessageChannel
  direction   MessageDirection
  content     Json

  // ステータス
  status      MessageStatus @default(PENDING)
  sentAt      DateTime?
  deliveredAt DateTime?
  openedAt    DateTime?
  clickedAt   DateTime?
  errorMessage String?

  // メタデータ
  metadata    Json?

  createdAt   DateTime      @default(now())

  @@index([tenantId])
  @@index([contactId])
  @@index([tenantId, channel])
}

enum MessageChannel {
  EMAIL
  LINE
  SMS
}

enum MessageDirection {
  OUTBOUND
  INBOUND
}

enum MessageStatus {
  PENDING
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  FAILED
}

// ==================== ファネル ====================

model Funnel {
  id        String       @id @default(cuid())
  tenantId  String
  tenant    Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name      String
  domain    String?
  status    FunnelStatus @default(DRAFT)

  settings  Json         @default("{}")

  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  pages     FunnelPage[]

  @@index([tenantId])
}

enum FunnelStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model FunnelPage {
  id        String   @id @default(cuid())
  funnelId  String
  funnel    Funnel   @relation(fields: [funnelId], references: [id], onDelete: Cascade)

  name      String
  slug      String

  // ページコンテンツ（JSON形式でブロック構造を保存）
  content   Json     @default("[]")

  // 設定
  seoTitle       String?
  seoDescription String?
  ogImage        String?

  // A/Bテスト
  isVariant      Boolean @default(false)
  variantWeight  Int     @default(50)

  order     Int      @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  actions   FunnelAction[]

  @@unique([funnelId, slug])
  @@index([funnelId])
}

model FunnelAction {
  id        String   @id @default(cuid())
  pageId    String
  page      FunnelPage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  type      ActionType
  trigger   String   // click, submit, exit等
  config    Json

  createdAt DateTime @default(now())

  @@index([pageId])
}

enum ActionType {
  ADD_TAG
  REMOVE_TAG
  START_CAMPAIGN
  REDIRECT
  POPUP
  WEBHOOK
  GOOGLE_SHEETS
}

// ==================== 商品・決済 ====================

model Product {
  id              String      @id @default(cuid())
  tenantId        String
  tenant          Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name            String
  description     String?

  // 価格
  price           Int
  currency        String      @default("JPY")

  // Stripe連携
  stripeProductId String?
  stripePriceId   String?

  // 商品タイプ
  type            ProductType @default(ONE_TIME)

  // サブスク設定
  recurringInterval RecurringInterval?

  // 関連コース
  courseId        String?
  course          Course?     @relation(fields: [courseId], references: [id])

  // ステータス
  isActive        Boolean     @default(true)

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  orders          Order[]
  subscriptions   Subscription[]

  @@index([tenantId])
}

enum ProductType {
  ONE_TIME
  SUBSCRIPTION
  PAYMENT_PLAN
}

enum RecurringInterval {
  MONTH
  YEAR
}

model Order {
  id              String      @id @default(cuid())
  tenantId        String
  tenant          Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  contactId       String
  contact         Contact     @relation(fields: [contactId], references: [id])
  productId       String
  product         Product     @relation(fields: [productId], references: [id])

  amount          Int
  currency        String      @default("JPY")
  status          OrderStatus @default(PENDING)

  // Stripe連携
  stripePaymentIntentId String?
  stripeChargeId        String?

  // メタデータ
  metadata        Json?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([tenantId])
  @@index([contactId])
}

enum OrderStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

model Subscription {
  id                  String             @id @default(cuid())
  tenantId            String
  tenant              Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  contactId           String
  contact             Contact            @relation(fields: [contactId], references: [id])
  productId           String
  product             Product            @relation(fields: [productId], references: [id])

  // Stripe連携
  stripeSubscriptionId String?

  status              SubscriptionStatus @default(ACTIVE)

  currentPeriodStart  DateTime
  currentPeriodEnd    DateTime
  canceledAt          DateTime?

  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  @@index([tenantId])
  @@index([contactId])
  @@index([stripeSubscriptionId])
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
  PAUSED
}

// ==================== 会員サイト ====================

model Course {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name        String
  description String?
  thumbnail   String?

  isPublished Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  lessons     Lesson[]
  products    Product[]
  enrollments CourseEnrollment[]

  @@index([tenantId])
}

model Lesson {
  id          String     @id @default(cuid())
  courseId    String
  course      Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)

  name        String
  description String?

  // コンテンツ
  content     Json       @default("{}")
  videoUrl    String?
  videoType   VideoType?
  duration    Int?       // 秒

  // 公開設定
  isPublished Boolean    @default(false)
  releaseDelay Int       @default(0) // 入会日からの日数

  order       Int        @default(0)

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  progress    LessonProgress[]

  @@index([courseId])
  @@index([courseId, order])
}

enum VideoType {
  UTAGE
  YOUTUBE
  VIMEO
}

model CourseEnrollment {
  id          String   @id @default(cuid())
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  contactId   String
  contact     Contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)

  enrolledAt  DateTime @default(now())
  expiresAt   DateTime?

  @@unique([courseId, contactId])
  @@index([courseId])
  @@index([contactId])
}

model LessonProgress {
  id          String   @id @default(cuid())
  lessonId    String
  lesson      Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  contactId   String

  isCompleted Boolean  @default(false)
  completedAt DateTime?

  // 動画視聴進捗
  watchedSeconds Int   @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([lessonId, contactId])
  @@index([lessonId])
  @@index([contactId])
}

// ==================== 予約・イベント ====================

model Event {
  id          String      @id @default(cuid())
  tenantId    String
  tenant      Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name        String
  description String?
  type        EventType

  // 日時
  startAt     DateTime
  endAt       DateTime
  timezone    String      @default("Asia/Tokyo")

  // 場所
  location    String?
  isOnline    Boolean     @default(true)
  meetingUrl  String?

  // 定員
  capacity    Int?

  // ステータス
  status      EventStatus @default(SCHEDULED)

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  registrations EventRegistration[]

  @@index([tenantId])
  @@index([tenantId, startAt])
}

enum EventType {
  SEMINAR
  CONSULTATION
  WEBINAR
}

enum EventStatus {
  DRAFT
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELED
}

model EventRegistration {
  id          String                    @id @default(cuid())
  eventId     String
  event       Event                     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  contactId   String
  contact     Contact                   @relation(fields: [contactId], references: [id], onDelete: Cascade)

  status      EventRegistrationStatus   @default(REGISTERED)

  registeredAt DateTime                 @default(now())
  attendedAt   DateTime?
  canceledAt   DateTime?

  @@unique([eventId, contactId])
  @@index([eventId])
  @@index([contactId])
}

enum EventRegistrationStatus {
  REGISTERED
  CONFIRMED
  ATTENDED
  NO_SHOW
  CANCELED
}

// ==================== アフィリエイト ====================

model Partner {
  id          String        @id @default(cuid())
  tenantId    String
  tenant      Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  email       String
  name        String

  // アフィリエイトコード
  code        String        @unique

  // 報酬設定
  commissionRate Int        @default(30) // パーセント

  status      PartnerStatus @default(PENDING)

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  referrals   Referral[]

  @@unique([tenantId, email])
  @@index([tenantId])
  @@index([code])
}

enum PartnerStatus {
  PENDING
  ACTIVE
  SUSPENDED
}

model Referral {
  id          String         @id @default(cuid())
  partnerId   String
  partner     Partner        @relation(fields: [partnerId], references: [id], onDelete: Cascade)

  type        ReferralType
  referenceId String         // contactId or orderId

  // 報酬
  amount      Int
  status      ReferralStatus @default(PENDING)

  approvedAt  DateTime?
  paidAt      DateTime?

  createdAt   DateTime       @default(now())

  @@index([partnerId])
}

enum ReferralType {
  REGISTRATION
  PURCHASE
}

enum ReferralStatus {
  PENDING
  APPROVED
  REJECTED
  PAID
}

// ==================== LINE設定 ====================

model LineRichMenu {
  id          String   @id @default(cuid())
  tenantId    String

  name        String
  lineRichMenuId String?

  // メニュー設定
  size        Json
  areas       Json
  imageUrl    String?

  // セグメント条件（nullの場合はデフォルト）
  conditions  Json?

  isDefault   Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
}

// ==================== 監査ログ ====================

model AuditLog {
  id          String   @id @default(cuid())
  tenantId    String
  userId      String?

  action      String
  entityType  String
  entityId    String?

  oldValue    Json?
  newValue    Json?

  ipAddress   String?
  userAgent   String?

  createdAt   DateTime @default(now())

  @@index([tenantId])
  @@index([tenantId, entityType])
  @@index([createdAt])
}
```

---

## 3. API設計

### 3.1 API方針

- **Server Actions**: フォーム送信、データ変更操作
- **API Routes**: Webhook受信、外部サービス連携

### 3.2 主要API一覧

#### 3.2.1 認証・テナント

| メソッド | パス | 説明 |
|----------|------|------|
| GET | /api/auth/[...clerk] | Clerk認証 |
| GET | /api/tenant | テナント情報取得 |
| PUT | /api/tenant | テナント設定更新 |

#### 3.2.2 コンタクト

| メソッド | パス | 説明 |
|----------|------|------|
| GET | /api/contacts | コンタクト一覧 |
| POST | /api/contacts | コンタクト作成 |
| GET | /api/contacts/:id | コンタクト詳細 |
| PUT | /api/contacts/:id | コンタクト更新 |
| DELETE | /api/contacts/:id | コンタクト削除 |
| POST | /api/contacts/:id/tags | タグ追加 |
| DELETE | /api/contacts/:id/tags/:tagId | タグ削除 |
| POST | /api/contacts/import | CSVインポート |
| GET | /api/contacts/export | CSVエクスポート |

#### 3.2.3 キャンペーン（配信）

| メソッド | パス | 説明 |
|----------|------|------|
| GET | /api/campaigns | キャンペーン一覧 |
| POST | /api/campaigns | キャンペーン作成 |
| GET | /api/campaigns/:id | キャンペーン詳細 |
| PUT | /api/campaigns/:id | キャンペーン更新 |
| DELETE | /api/campaigns/:id | キャンペーン削除 |
| POST | /api/campaigns/:id/activate | キャンペーン有効化 |
| POST | /api/campaigns/:id/pause | キャンペーン一時停止 |
| GET | /api/campaigns/:id/stats | 配信統計 |

#### 3.2.4 ファネル

| メソッド | パス | 説明 |
|----------|------|------|
| GET | /api/funnels | ファネル一覧 |
| POST | /api/funnels | ファネル作成 |
| GET | /api/funnels/:id | ファネル詳細 |
| PUT | /api/funnels/:id | ファネル更新 |
| DELETE | /api/funnels/:id | ファネル削除 |
| POST | /api/funnels/:id/publish | ファネル公開 |
| GET | /api/funnels/:id/pages | ページ一覧 |
| POST | /api/funnels/:id/pages | ページ作成 |

#### 3.2.5 Webhook受信

| メソッド | パス | 説明 |
|----------|------|------|
| POST | /api/webhooks/line | LINE Webhook |
| POST | /api/webhooks/stripe | Stripe Webhook |
| POST | /api/webhooks/sendgrid | SendGrid Webhook |

### 3.3 Webhook設計

#### 3.3.1 LINE Webhook

```typescript
// app/api/webhooks/line/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { validateLineSignature } from '@/lib/line';
import { handleLineEvent } from '@/lib/line/handlers';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-line-signature');

  // 署名検証
  if (!validateLineSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const { events } = JSON.parse(body);

  // 非同期でイベント処理（即座にレスポンス返却）
  for (const event of events) {
    // Cloud Tasksにキューイング
    await queueLineEventHandler(event);
  }

  return NextResponse.json({ success: true });
}
```

#### 3.3.2 Stripe Webhook

```typescript
// app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## 4. 画面設計

### 4.1 画面一覧

| カテゴリ | 画面名 | パス | 説明 |
|----------|--------|------|------|
| 認証 | ログイン | /login | Clerk認証 |
| 認証 | サインアップ | /signup | 新規登録 |
| ダッシュボード | ホーム | /dashboard | 概要表示 |
| コンタクト | 一覧 | /contacts | 顧客一覧 |
| コンタクト | 詳細 | /contacts/:id | 顧客詳細 |
| キャンペーン | 一覧 | /campaigns | 配信一覧 |
| キャンペーン | 作成・編集 | /campaigns/:id | 配信設定 |
| ファネル | 一覧 | /funnels | ファネル一覧 |
| ファネル | ビルダー | /funnels/:id/builder | ページビルダー |
| 会員サイト | コース一覧 | /courses | コース管理 |
| 会員サイト | レッスン編集 | /courses/:id/lessons | レッスン編集 |
| 決済 | 商品一覧 | /products | 商品管理 |
| 決済 | 売上 | /orders | 売上一覧 |
| 予約 | イベント一覧 | /events | イベント管理 |
| 分析 | ダッシュボード | /analytics | 分析画面 |
| 設定 | 一般 | /settings | 一般設定 |
| 設定 | LINE連携 | /settings/line | LINE設定 |
| 設定 | 決済連携 | /settings/payments | 決済設定 |

### 4.2 画面ワイヤーフレーム

#### 4.2.1 ダッシュボード

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo]  Dashboard  Contacts  Campaigns  Funnels  Courses  Settings    [👤] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │   Total Contacts │ │  Active Campaigns│ │   Monthly Revenue│            │
│  │     12,345       │ │        8         │ │    ¥1,234,567    │            │
│  │    ↑ 12.5%       │ │     ↑ 2          │ │     ↑ 23.4%      │            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│                                                                             │
│  ┌────────────────────────────────────┐ ┌────────────────────────────────┐ │
│  │         Funnel Performance         │ │       Recent Activity          │ │
│  │                                    │ │                                │ │
│  │  [ファネルチャート]                 │ │  • 田中太郎 がLINE登録         │ │
│  │                                    │ │  • 鈴木花子 が商品購入          │ │
│  │                                    │ │  • 佐藤一郎 が予約              │ │
│  │                                    │ │                                │ │
│  └────────────────────────────────────┘ └────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 ファネルビルダー

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Funnels    [ファネル名]    [Preview]  [Save]  [Publish]          │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────┐                                                                 │
│ │ Pages   │  ┌─────────────────────────────────────────────────────────┐   │
│ │ ──────  │  │                                                         │   │
│ │ □ LP    │  │  ┌─────────────────────────────────────────────────┐   │   │
│ │ □ Thanks│  │  │              [ドラッグ可能な要素]               │   │   │
│ │         │  │  │                                                 │   │   │
│ │ [+Page] │  │  │  ┌───────────────────────────────────────────┐ │   │   │
│ ├─────────┤  │  │  │           ヘッドライン                    │ │   │   │
│ │Elements │  │  │  └───────────────────────────────────────────┘ │   │   │
│ │ ──────  │  │  │                                                 │   │   │
│ │ T Text  │  │  │  ┌───────────────────────────────────────────┐ │   │   │
│ │ □ Image │  │  │  │              画像                         │ │   │   │
│ │ ▶ Video │  │  │  └───────────────────────────────────────────┘ │   │   │
│ │ □ Form  │  │  │                                                 │   │   │
│ │ ■ Button│  │  │  ┌───────────────────────────────────────────┐ │   │   │
│ │ ⏱ Timer │  │  │  │      [登録フォーム]                       │ │   │   │
│ │ ...     │  │  │  │      名前: [____________]                 │ │   │   │
│ │         │  │  │  │      メール: [____________]               │ │   │   │
│ │         │  │  │  │          [登録する]                       │ │   │   │
│ │         │  │  │  └───────────────────────────────────────────┘ │   │   │
│ │         │  │  │                                                 │   │   │
│ │         │  │  └─────────────────────────────────────────────────┘   │   │
│ │         │  │                                                         │   │
│ └─────────┘  └─────────────────────────────────────────────────────────┘   │
│              ┌─────────────────────────────────────────────────────────┐   │
│              │  Properties                                             │   │
│              │  ─────────────────                                      │   │
│              │  Text: [____________]                                   │   │
│              │  Font Size: [16px ▼]                                    │   │
│              │  Color: [■ #333333]                                     │   │
│              └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 4.2.3 キャンペーン（ステップ配信）エディタ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Back    [キャンペーン名]                    [Test]  [Save]  [Activate]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        ステップフロー                                │   │
│  │                                                                     │   │
│  │      ┌─────────────┐                                                │   │
│  │      │  登録直後   │                                                │   │
│  │      │  ウェルカム │                                                │   │
│  │      │  メッセージ │                                                │   │
│  │      └──────┬──────┘                                                │   │
│  │             │                                                       │   │
│  │             ▼                                                       │   │
│  │      ┌─────────────┐                                                │   │
│  │      │   1日後     │                                                │   │
│  │      │  教育①     │                                                │   │
│  │      └──────┬──────┘                                                │   │
│  │             │                                                       │   │
│  │             ▼                                                       │   │
│  │      ┌─────────────┐                                                │   │
│  │      │   3日後     │                                                │   │
│  │      │  教育②     │                                                │   │
│  │      └──────┬──────┘                                                │   │
│  │             │                                                       │   │
│  │        [+ ステップ追加]                                             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Step Editor: 登録直後                                              │   │
│  │  ────────────────────────────────────────────────                   │   │
│  │  配信タイミング: [登録直後 ▼]                                       │   │
│  │                                                                     │   │
│  │  配信チャネル: ○ LINE  ○ メール  ○ 両方                            │   │
│  │                                                                     │   │
│  │  メッセージ:                                                        │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │ {{name}}さん、ご登録ありがとうございます！                    │ │   │
│  │  │                                                               │ │   │
│  │  │ これから7日間にわたって、...                                  │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  [🤖 AIで生成]  [プレビュー]                                        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. 外部連携設計

### 5.1 LINE Messaging API

#### 5.1.1 認証フロー

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │     │   System    │     │  LINE API   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ LINE設定ページ    │                   │
       ├──────────────────►│                   │
       │                   │                   │
       │                   │ Channel ID/Secret │
       │                   │ 保存              │
       │                   ├──────────────────►│
       │                   │                   │
       │                   │◄──────────────────┤
       │                   │ Access Token取得   │
       │                   │                   │
       │                   │ Webhook URL設定   │
       │                   ├──────────────────►│
       │                   │                   │
       │◄──────────────────┤                   │
       │  設定完了          │                   │
```

#### 5.1.2 メッセージ配信フロー

```typescript
// lib/line/client.ts

import { Client, TextMessage, FlexMessage } from '@line/bot-sdk';

export class LineClient {
  private client: Client;

  constructor(channelAccessToken: string) {
    this.client = new Client({ channelAccessToken });
  }

  async pushMessage(userId: string, messages: Message[]) {
    return this.client.pushMessage(userId, messages);
  }

  async multicast(userIds: string[], messages: Message[]) {
    // 500件ずつ分割
    const chunks = chunk(userIds, 500);

    for (const chunk of chunks) {
      await this.client.multicast(chunk, messages);
      await sleep(100); // レート制限対策
    }
  }

  async broadcast(messages: Message[]) {
    return this.client.broadcast(messages);
  }
}
```

### 5.2 Stripe

#### 5.2.1 決済フロー

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │     │   System    │     │  Stripe     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 購入ボタン        │                   │
       ├──────────────────►│                   │
       │                   │                   │
       │                   │ Checkout Session  │
       │                   │ 作成              │
       │                   ├──────────────────►│
       │                   │                   │
       │                   │◄──────────────────┤
       │                   │ Session URL       │
       │                   │                   │
       │◄──────────────────┤                   │
       │ Stripeページへ    │                   │
       │ リダイレクト      │                   │
       │                   │                   │
       │ カード情報入力    │                   │
       ├───────────────────┼──────────────────►│
       │                   │                   │
       │                   │                   │
       │                   │ Webhook           │
       │                   │ (payment_intent   │
       │                   │  .succeeded)      │
       │                   │◄──────────────────┤
       │                   │                   │
       │                   │ 注文完了処理      │
       │                   │ 会員サイト権限付与│
       │                   │ サンクスメール送信│
       │                   │                   │
       │◄──────────────────┤                   │
       │ サンクスページ    │                   │
```

#### 5.2.2 サブスクリプションフロー

```typescript
// lib/stripe/subscription.ts

import Stripe from 'stripe';
import { stripe } from './client';

export async function createSubscription(
  customerId: string,
  priceId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
  });

  return subscription;
}

export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  });
}
```

### 5.3 SendGrid

#### 5.3.1 メール配信

```typescript
// lib/sendgrid/client.ts

import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  listUnsubscribe?: string;
}

export async function sendEmail(params: EmailParams) {
  const msg = {
    to: params.to,
    from: params.from || process.env.SENDGRID_FROM_EMAIL!,
    subject: params.subject,
    html: params.html,
    headers: {
      'List-Unsubscribe': params.listUnsubscribe,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };

  return sgMail.send(msg);
}

export async function sendBulkEmail(messages: EmailParams[]) {
  // 1000件ずつバッチ処理
  const chunks = chunk(messages, 1000);

  for (const chunk of chunks) {
    await sgMail.send(chunk.map(m => ({
      to: m.to,
      from: m.from || process.env.SENDGRID_FROM_EMAIL!,
      subject: m.subject,
      html: m.html,
    })));
  }
}
```

---

## 6. セキュリティ設計

### 6.1 認証・認可

#### 6.1.1 認証フロー（Clerk）

```typescript
// middleware.ts

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/signup(.*)',
  '/api/webhooks/(.*)',
  '/p/(.*)', // 公開ファネルページ
  '/m/(.*)', // 会員サイト公開ページ
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

#### 6.1.2 テナント分離

```typescript
// lib/auth/tenant.ts

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function getCurrentTenant() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { tenant: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user.tenant;
}

// すべてのDB操作でtenantIdを強制
export function withTenant<T>(tenantId: string, query: T): T {
  return {
    ...query,
    where: {
      ...(query as any).where,
      tenantId,
    },
  } as T;
}
```

### 6.2 入力検証

```typescript
// lib/validation/schemas.ts

import { z } from 'zod';

export const contactSchema = z.object({
  email: z.string().email().optional(),
  lineUserId: z.string().optional(),
  phone: z.string().regex(/^[0-9-+]+$/).optional(),
  name: z.string().max(100).optional(),
  customFields: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.email || data.lineUserId || data.phone,
  { message: 'At least one identifier is required' }
);

export const campaignSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['EMAIL_STEP', 'EMAIL_BROADCAST', 'LINE_STEP', 'LINE_BROADCAST', 'LINE_SEGMENT', 'SMS']),
  steps: z.array(z.object({
    order: z.number().int().min(0),
    type: z.enum(['MESSAGE', 'WAIT', 'CONDITION', 'ACTION']),
    delayDays: z.number().int().min(0).default(0),
    content: z.unknown(),
  })),
});
```

### 6.3 CSRF対策

```typescript
// Server Actionsは自動的にCSRF保護される
// API Routesには追加対策

// middleware.ts（部分）
import { csrf } from '@/lib/security/csrf';

// API Routesに対してCSRFトークン検証
if (req.nextUrl.pathname.startsWith('/api/') &&
    !req.nextUrl.pathname.startsWith('/api/webhooks/')) {
  const csrfValid = await csrf.verify(req);
  if (!csrfValid) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }
}
```

### 6.4 レート制限

```typescript
// lib/ratelimit.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100リクエスト/分
});

// API Routeでの使用
export async function POST(req: NextRequest) {
  const ip = req.ip ?? '127.0.0.1';
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        }
      }
    );
  }

  // 通常の処理
}
```

---

## 7. インフラ設計

### 7.1 Google Cloud構成

```yaml
# terraform/main.tf（概念）

# Cloud Run
resource "google_cloud_run_service" "app" {
  name     = "marketing-hub"
  location = "asia-northeast1"

  template {
    spec {
      containers {
        image = "gcr.io/${PROJECT_ID}/marketing-hub:${IMAGE_TAG}"

        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
        }

        env {
          name  = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = "database-url"
              key  = "latest"
            }
          }
        }
      }

      container_concurrency = 80
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "1"
        "autoscaling.knative.dev/maxScale" = "100"
      }
    }
  }
}

# Cloud SQL
resource "google_sql_database_instance" "main" {
  name             = "marketing-hub-db"
  database_version = "POSTGRES_15"
  region           = "asia-northeast1"

  settings {
    tier = "db-custom-4-16384"

    availability_type = "REGIONAL"

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main.id
    }
  }
}

# Cloud Tasks
resource "google_cloud_tasks_queue" "email" {
  name     = "email-queue"
  location = "asia-northeast1"

  rate_limits {
    max_dispatches_per_second = 100
  }

  retry_config {
    max_attempts = 5
    min_backoff  = "10s"
    max_backoff  = "300s"
  }
}

resource "google_cloud_tasks_queue" "line" {
  name     = "line-queue"
  location = "asia-northeast1"

  rate_limits {
    max_dispatches_per_second = 50
  }
}
```

### 7.2 CI/CD

```yaml
# .github/workflows/deploy.yml

name: Deploy to Cloud Run

on:
  push:
    branches: [main, staging]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  SERVICE: marketing-hub
  REGION: asia-northeast1

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_CREDENTIALS }}

      - uses: google-github-actions/setup-gcloud@v2

      - name: Build and Push
        run: |
          gcloud builds submit \
            --tag gcr.io/$PROJECT_ID/$SERVICE:${{ github.sha }}

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $SERVICE \
            --image gcr.io/$PROJECT_ID/$SERVICE:${{ github.sha }} \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated
```

### 7.3 監視・アラート

```yaml
# Google Cloud Monitoring アラートポリシー

# レイテンシアラート
- name: "High Latency Alert"
  conditions:
    - conditionThreshold:
        filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_latencies"'
        comparison: COMPARISON_GT
        thresholdValue: 2000  # 2秒
        duration: 300s        # 5分間
        aggregations:
          - alignmentPeriod: 60s
            perSeriesAligner: ALIGN_PERCENTILE_95
  notificationChannels:
    - slack

# エラーレートアラート
- name: "High Error Rate Alert"
  conditions:
    - conditionThreshold:
        filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count" AND metric.label.response_code_class!="2xx"'
        comparison: COMPARISON_GT
        thresholdValue: 5  # 5%
        duration: 300s
  notificationChannels:
    - slack
    - email
```

---

## 8. 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2025-01-31 | 初版作成 | - |
