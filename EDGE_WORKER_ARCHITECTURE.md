# Edge/Worker Architecture Design & Implementation Plan

## 🎯 **Architecture Overview**

This document outlines the design and implementation plan for splitting the ZeroCancer backend into an **Edge Runtime** (Cloudflare Workers) for lightweight operations and a **Node.js Worker** for heavy computational tasks.

## 🏗️ **Current State Analysis**

### **✅ What's Working Well**

- **Perfect Database Pattern**: Current `getDB(c)` pattern is ideal for this architecture
- **Service Layer Ready**: Analytics services already use dependency injection (`prisma: PrismaClient`)
- **Type Safety**: Shared schemas and types are well-structured
- **Clean Separation**: Services are already modular and testable

### **🔍 Current Database Usage Pattern**

```typescript
// apps/backend/src/lib/db.ts - PERFECT for edge/worker split
export const getDB = (c: { env: { DATABASE_URL: string } }) => {
  const adapter = new PrismaNeon({ connectionString: c.env.DATABASE_URL });
  return new PrismaClient({ adapter });
};

// Usage throughout codebase (50+ locations)
async (c) => {
  const db = getDB(c); // Context-dependent, no global state
  const data = await db.table.findMany();
};
```

## 🎯 **Target Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE RUNTIME                     │
│                   (apps/backend - Optimized)                   │
├─────────────────────────────────────────────────────────────────┤
│ ✅ EDGE-COMPATIBLE SERVICES:                                   │
│ • Authentication (JWT, cookies, basic auth)                    │
│ • CRUD Operations (users, appointments, centers)               │
│ • Simple queries and data validation                           │
│ • File uploads (basic processing)                              │
│ • Real-time notifications                                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP Requests
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NODE.JS WORKER                            │
│                   (apps/worker - New)                          │
├─────────────────────────────────────────────────────────────────┤
│ 🚀 HEAVY COMPUTATIONAL SERVICES:                               │
│ • Waitlist Matching Algorithm (complex database operations)    │
│ • Analytics & Reporting (data aggregation)                     │
│ • Email Services (nodemailer, templating)                      │
│ • PDF Generation (pdfkit, complex documents)                   │
│ • Image Processing (sharp, resizing)                           │
│ • Bulk Data Operations                                          │
│ • Scheduled Jobs & Background Tasks                             │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 **Service Classification**

### **🟢 EDGE-COMPATIBLE (Stay in apps/backend)**

| Service             | Reason                         | Current Status |
| ------------------- | ------------------------------ | -------------- |
| Authentication      | JWT signing, simple validation | ✅ Ready       |
| User Management     | Basic CRUD operations          | ✅ Ready       |
| Appointment CRUD    | Simple database operations     | ✅ Ready       |
| Center Management   | Basic data operations          | ✅ Ready       |
| Basic Notifications | Simple database inserts        | ✅ Ready       |

### **🔴 NODE.JS-REQUIRED (Move to apps/worker)**

| Service                | Reason                                  | Migration Effort |
| ---------------------- | --------------------------------------- | ---------------- |
| **Waitlist Matching**  | Complex algorithms, heavy DB operations | 🔴 High          |
| **Analytics Services** | Data aggregation, reporting             | 🟡 Medium        |
| **Email Services**     | Nodemailer dependency                   | 🟡 Medium        |
| **PDF Generation**     | PDFKit dependency                       | 🟡 Medium        |
| **Image Processing**   | Sharp dependency                        | 🟡 Medium        |

## 🗂️ **Schema Synchronization Strategy**

### **Problem**: Both apps need identical Prisma schemas but are separate deployments

### **Solution**: Automated Schema Duplication

```bash
# Script: scripts/sync-prisma-schemas.js
apps/backend/prisma/schema.prisma  → apps/worker/prisma/schema.prisma
```

**Benefits:**

- ✅ **Single Source of Truth**: Backend schema is master
- ✅ **Independent Deployments**: Each app has its own generated client
- ✅ **Type Safety**: Identical types across both applications
- ✅ **Version Control**: Changes tracked in both locations

## 🚀 **Implementation Plan**

### **Phase 1: Foundation Setup** ⏱️ 2-3 days

```bash
# 1. Create worker application structure
apps/worker/
  ├── src/
  │   ├── index.ts           # Hono app entry point
  │   ├── api/               # Service endpoints
  │   └── lib/
  │       └── db.ts          # Same getDB(c) pattern
  ├── prisma/
  │   └── schema.prisma      # Synced from backend
  ├── package.json
  ├── tsconfig.json
  └── wrangler.jsonc         # Node.js runtime config

# 2. Setup schema synchronization
scripts/sync-prisma-schemas.js  # Automated duplication

# 3. Package.json scripts
"scripts": {
  "sync-schemas": "node scripts/sync-prisma-schemas.js",
  "build:worker": "pnpm sync-schemas && pnpm --filter=worker build",
  "dev:worker": "pnpm --filter=worker dev"
}
```

### **Phase 2: Service Migration** ⏱️ 3-4 days

#### **2.1 Analytics Services** (Easiest - Already Perfect)

```typescript
// ✅ Current pattern is PERFECT for migration
// apps/backend/src/lib/analytics.service.ts
export async function getDashboardMetrics(prisma: PrismaClient); // 👈 Already uses DI

// ✅ Move to apps/worker/src/services/analytics.service.ts
// ✅ Create HTTP endpoints in apps/worker/src/api/analytics.ts
// ✅ Backend calls worker via HTTP
```

**Migration Steps:**

1. Copy `analytics.service.ts` to worker
2. Create HTTP endpoints in worker
3. Replace direct calls with HTTP requests in backend
4. Update type imports

#### **2.2 Waitlist Matching Algorithm**

```typescript
// Current: Complex inline code in admin.ts
// Target: Dedicated service in worker

// apps/worker/src/services/waitlist.service.ts
export async function executeWaitlistMatching(
  prisma: PrismaClient,
  params: WaitlistParams
);

// apps/backend calls via HTTP
const response = await fetch(`${WORKER_URL}/api/waitlist/match`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(params),
});
```

#### **2.3 Email & PDF Services**

```typescript
// Move nodemailer and pdfkit dependencies to worker
// Backend sends email/PDF requests via HTTP
```

### **Phase 3: Communication Layer** ⏱️ 1-2 days

#### **3.1 HTTP Client Setup**

```typescript
// apps/backend/src/lib/worker-client.ts
export class WorkerClient {
  constructor(private baseUrl: string) {}

  async executeWaitlistMatching(params: WaitlistParams) {
    return this.post("/api/waitlist/match", params);
  }

  async generateReport(type: string, params: any) {
    return this.post(`/api/analytics/${type}`, params);
  }
}
```

#### **3.2 Environment Configuration**

```bash
# apps/backend/.dev.vars
WORKER_SERVICE_URL=http://localhost:8788

# apps/worker/.dev.vars
DATABASE_URL=same_as_backend
JWT_TOKEN_SECRET=same_as_backend
```

### **Phase 4: Testing & Optimization** ⏱️ 2-3 days

#### **4.1 Integration Testing**

- Edge → Worker communication
- Schema synchronization
- Type safety validation
- Performance benchmarks

#### **4.2 Deployment Pipeline**

```bash
# Development
pnpm dev:backend  # Port 8787 (Edge)
pnpm dev:worker   # Port 8788 (Node.js)

# Production
pnpm deploy:backend  # Cloudflare Workers
pnpm deploy:worker   # Cloudflare Workers (Node.js runtime)
```

## 📋 **File Structure After Migration**

```
apps/
├── backend/                 # Edge Runtime (Cloudflare Workers)
│   ├── src/
│   │   ├── api/
│   │   │   ├── admin.ts     # Simplified (heavy operations → HTTP calls)
│   │   │   ├── auth.ts      # ✅ Stays (edge-compatible)
│   │   │   ├── users.ts     # ✅ Stays (simple CRUD)
│   │   │   └── appointments.ts # ✅ Stays (simple CRUD)
│   │   ├── lib/
│   │   │   ├── db.ts        # ✅ Keep same getDB(c) pattern
│   │   │   └── worker-client.ts # 🆕 HTTP client for worker
│   │   └── services/        # Only edge-compatible services
│   └── prisma/schema.prisma # Master schema
│
└── worker/                  # Node.js Runtime (Heavy operations)
    ├── src/
    │   ├── index.ts         # 🆕 Hono app entry
    │   ├── api/
    │   │   ├── analytics.ts # 🔄 Moved from backend
    │   │   ├── waitlist.ts  # 🔄 Extracted from admin.ts
    │   │   ├── email.ts     # 🔄 Email services
    │   │   └── pdf.ts       # 🔄 PDF generation
    │   ├── lib/
    │   │   └── db.ts        # 🔄 Same getDB(c) pattern
    │   └── services/
    │       ├── analytics.service.ts    # 🔄 Moved
    │       ├── waitlist.service.ts     # 🔄 Extracted
    │       ├── email.service.ts        # 🔄 Moved
    │       └── pdf.service.ts          # 🔄 Moved
    └── prisma/schema.prisma # 🔄 Auto-synced copy

scripts/
└── sync-prisma-schemas.js   # 🆕 Schema synchronization
```

## ⚡ **Performance Benefits**

### **Edge Runtime Advantages**

- **Global Distribution**: Sub-100ms response times worldwide
- **Auto-scaling**: Handle traffic spikes without configuration
- **Cost Efficiency**: Pay per request, not idle time
- **Zero Cold Start**: For lightweight operations

### **Node.js Worker Advantages**

- **Full Node.js API**: Access to all npm packages
- **Heavy Computations**: Complex algorithms without timeout limits
- **Background Jobs**: Long-running tasks and scheduled operations
- **Resource Intensive**: Memory and CPU for data processing

## 🔧 **Developer Experience**

### **Local Development**

```bash
# Terminal 1: Edge Runtime
cd apps/backend
pnpm dev  # Runs on :8787

# Terminal 2: Node.js Worker
cd apps/worker
pnpm dev  # Runs on :8788

# Auto-sync schemas on changes
pnpm sync-schemas
```

### **Type Safety Maintained**

- Shared types from `@zerocancer/shared`
- Identical Prisma schemas
- HTTP client with typed interfaces
- Full IntelliSense support

## 🚨 **Risk Mitigation**

### **Schema Drift Prevention**

- Automated schema sync in CI/CD
- Pre-commit hooks for validation
- Schema version checksums

### **Service Communication**

- Retry logic with exponential backoff
- Circuit breaker patterns
- Fallback responses for worker downtime

### **Deployment Safety**

- Blue-green deployments
- Health checks for both services
- Rollback procedures

## 📈 **Success Metrics**

### **Performance Targets**

- **Edge Response Time**: < 100ms for CRUD operations
- **Worker Response Time**: < 2s for analytics, < 5s for waitlist matching
- **Availability**: 99.9% uptime for both services

### **Developer Productivity**

- **Schema Sync**: < 5 seconds automated
- **Local Development**: Both services running with hot reload
- **Type Safety**: Zero type errors in production builds

---

## 🎯 **Implementation Summary Overview**

### **What Will Be Done:**

1. **✅ Keep Current Database Pattern** - Your `getDB(c)` is perfect
2. **📁 Create Worker Application** - New Node.js runtime app structure
3. **🔄 Setup Schema Synchronization** - Automated duplication script
4. **📦 Move Heavy Services** - Analytics, waitlist, email, PDF → worker
5. **🔗 Create HTTP Communication** - Edge calls worker for heavy operations
6. **🧪 Comprehensive Testing** - Integration tests and performance validation

### **Key Advantages:**

- **Zero Breaking Changes** to your current database patterns
- **Gradual Migration** - services moved one by one
- **Type Safety Maintained** throughout the process
- **Performance Boost** - edge distribution + specialized runtimes
- **Cost Optimization** - pay for what you use

### **Time Estimate:** 8-12 days total

- **Phase 1** (Foundation): 2-3 days
- **Phase 2** (Migration): 3-4 days
- **Phase 3** (Communication): 1-2 days
- **Phase 4** (Testing): 2-3 days

**Ready to proceed? The architecture leverages your existing patterns while unlocking the power of edge computing! 🚀**
