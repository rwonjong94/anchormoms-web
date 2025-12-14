# Mogo Frontend

> 초등학생을 위한 수학 모의고사 플랫폼 - Frontend Web Application

Next.js 15 (App Router) + React 19 + Tailwind CSS 4 기반 모바일 우선 반응형 웹앱

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Backend API server running (see mogo-backend repository)

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local and configure your backend URL

# Start development server
npm run dev
```

The app will start on `http://localhost:3000`

---

## 🏗️ Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **SWR** - Client-side data fetching & caching
- **NextAuth.js** - Authentication (Kakao, Google OAuth)
- **React Markdown** - Markdown rendering with KaTeX math support
- **PDF-lib** - PDF generation

---

## 📁 Project Structure

```
src/
├── app/                  # App Router pages
│   ├── api/             # API routes (proxy to backend)
│   ├── auth/            # Authentication pages
│   ├── exam/            # Exam pages
│   ├── nimda/           # Admin dashboard
│   └── mypage/          # User dashboard
├── components/          # Reusable components
│   ├── admin/          # Admin-specific components
│   ├── testing/        # Exam components
│   └── ui/             # UI primitives
├── contexts/           # React contexts (Auth, Toast)
├── hooks/              # Custom hooks
├── lib/                # Utility libraries
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

---

## 🔑 Key Features

### 1. Exam System
- Real-time timer with localStorage persistence
- Auto-save every 30 seconds
- Problem marking (right-click)
- Page leave protection with auto-submit
- Question navigation sidebar

### 2. Admin Dashboard (`/nimda`)
- **Exams**: Create, edit, upload exam problems
- **Lectures**: Video lecture management
- **Columns**: Article/blog system with markdown
- **Homework Videos**: Student homework tracking
- **STT**: Audio counseling with speech-to-text
- **Students**: Student/parent management
- **Scores**: Manual score entry & management

### 3. Authentication
- Kakao OAuth 2.0
- Google OAuth 2.0
- JWT-based sessions
- Role-based access (Parent/Student/Admin)

### 4. Markdown Editor
- KaTeX math rendering (`$...$`, `$$...$$`)
- Image upload (drag & drop, clipboard paste)
- Code syntax highlighting
- Responsive tables

---

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

```bash
# Backend API (internal)
BACKEND_URL=http://localhost:3001

# Public variables (browser-accessible)
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_KAKAO_CLIENT_ID=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...

# OAuth secrets (server-side only)
KAKAO_CLIENT_SECRET=...
GOOGLE_CLIENT_SECRET=...

# AI APIs (for OCR feature - server-side only)
GEMINI_API_KEY=...
GOOGLE_CLOUD_API_KEY=...
```

**⚠️ Security Note:**
- Frontend does NOT have direct database access
- All data operations go through Backend API
- Sensitive packages (`bcryptjs`, `jsonwebtoken`) removed

---

## 📚 API Communication

### Architecture Principle
```
Frontend → API Routes (Proxy) → Backend API → Database
```

All `/app/api/*` routes are **proxy routes** that forward requests to the backend:

```typescript
// Example: /app/api/exams/route.ts
export async function GET(request: NextRequest) {
  const response = await fetch(`${process.env.BACKEND_URL}/api/exams`, {
    headers: {
      'Authorization': request.headers.get('Authorization') || '',
    },
  });
  return NextResponse.json(await response.json());
}
```

### SWR Data Fetching
```typescript
import useSWR from 'swr';

// Fetch data with caching
const { data, error, mutate } = useSWR('/api/exams', fetcher);

// Update local cache
await mutate(updatedData, false);
```

---

## 🧪 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

---

## 🐳 Docker

```bash
# Build image
docker build -t mogo-frontend .

# Run container
docker run -p 3000:3000 mogo-frontend
```

---

## 🎨 Styling

### Tailwind CSS Utilities
```tsx
// Mobile-first responsive design
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-xl md:text-2xl lg:text-3xl">Title</h1>
</div>

// Common patterns
.btn-primary: bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded
.card: bg-white shadow-md rounded-lg p-6 border
```

---

## 📱 Performance

- **Image Optimization**: Next.js Image component with automatic WebP conversion
- **Code Splitting**: Dynamic imports for large components
- **Client-side Caching**: SWR with revalidation strategies
- **Lazy Loading**: Suspense boundaries for async components

---

## 🔒 Security

- ✅ No direct database access
- ✅ API routes as secure proxies
- ✅ Environment variables for sensitive data
- ✅ Removed unnecessary security packages
- ✅ XSS protection via React auto-escaping
- ✅ CORS handled by backend

---

## 📄 License

Private - All rights reserved

---

## 🤝 Contributing

This is a private repository. Contact the maintainer for access.

---

**For detailed documentation, see [CLAUDE.md](./CLAUDE.md)**
