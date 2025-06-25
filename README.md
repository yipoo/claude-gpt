# Claude GPT - AI Chat Application

A modern AI chat application built with React Native (frontend) and Node.js (backend), featuring a complete ChatGPT-like experience with subscription management, data export, and cloud synchronization.

## 🚀 Features

### ✨ Core Features
- **AI-Powered Chat**: Real-time conversations with AI assistant
- **Multi-language Support**: English and Chinese localization
- **Cross-Platform**: iOS and Android support via React Native
- **Cloud Sync**: Real-time data synchronization across devices
- **Subscription Management**: Freemium model with Stripe integration

### 🔧 Advanced Features
- **Data Export**: Export conversations in JSON, TXT, Markdown, CSV formats
- **Smart Search**: Full-text search with relevance scoring and auto-suggestions
- **Offline Support**: Graceful offline mode with sync queue
- **Performance Optimized**: Virtualized lists for handling large datasets
- **Modern UI**: iOS-style design with dark/light theme support

## 📁 Project Structure

This is a **monorepo** containing both frontend and backend applications:

```
claude-gpt/
├── frontend/          # React Native + Expo app
├── backend/           # Node.js + Express API
├── docs/             # Documentation
├── UI/               # Design assets
└── scripts/          # Development scripts
```

## 🛠️ Technology Stack

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **Zustand** for state management
- **React Navigation** for routing
- **i18next** for internationalization
- **React Query** for API state management

### Backend  
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma** ORM with PostgreSQL
- **Stripe** for payment processing
- **JWT** for authentication
- **Winston** for logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm 8+
- PostgreSQL database
- Expo CLI (for mobile development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yipoo/claude-gpt.git
   cd claude-gpt
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment variables**
   
   **Backend** (`.env` in `/backend`):
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/claudegpt"
   JWT_SECRET="your-jwt-secret"
   OPENAI_API_KEY="your-openai-api-key"
   STRIPE_SECRET_KEY="your-stripe-secret-key"
   ```

   **Frontend** (`.env` in `/frontend`):
   ```env
   EXPO_PUBLIC_API_URL="http://localhost:3000/api/v1"
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
   ```

4. **Setup database**
   ```bash
   pnpm run db:setup
   ```

5. **Start development servers**
   ```bash
   pnpm run dev
   ```

This will start both the backend API (port 3000) and frontend development server.

## 📱 Development

### Available Scripts

```bash
# Development
pnpm run dev              # Start both frontend and backend
pnpm run dev:frontend     # Start only frontend
pnpm run dev:backend      # Start only backend

# Building
pnpm run build            # Build both apps
pnpm run build:frontend   # Build frontend
pnpm run build:backend    # Build backend

# Testing
pnpm run test             # Run all tests
pnpm run test:frontend    # Run frontend tests
pnpm run test:backend     # Run backend tests

# Code Quality
pnpm run lint             # Lint all code
pnpm run type-check       # TypeScript type checking

# Database
pnpm run db:migrate       # Run database migrations
pnpm run db:studio        # Open Prisma Studio
```

### Frontend Development

The frontend is built with React Native and Expo:

```bash
cd frontend
pnpm run start           # Start Expo development server
pnpm run ios             # Run on iOS simulator
pnpm run android         # Run on Android emulator
```

### Backend Development

The backend API runs on Express with TypeScript:

```bash
cd backend
pnpm run dev             # Start with nodemon
pnpm run build           # Build TypeScript
pnpm run start           # Start production server
```

## 🏗️ Architecture

### Frontend Architecture
- **Component-based**: Reusable UI components
- **Service Layer**: Business logic separation
- **Store Management**: Zustand for state
- **Navigation**: React Navigation with drawer + stack
- **Internationalization**: i18next with async loading

### Backend Architecture
- **MVC Pattern**: Controllers, Services, Routes
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: JWT-based auth system
- **API Design**: RESTful endpoints
- **Error Handling**: Centralized error middleware

## 📊 Key Features Implementation

### 🌍 Internationalization
Complete i18n support with:
- Dynamic language switching
- Persistent language preferences
- Device language detection
- 100+ translation keys

### ⚡ Performance Optimizations
- **Virtualized Lists**: Handle 1000+ messages smoothly
- **Lazy Loading**: On-demand component loading
- **Memory Management**: Efficient cleanup
- **Network Optimization**: Request batching and caching

### ☁️ Data Synchronization
- **Real-time Sync**: Cross-device data consistency
- **Conflict Resolution**: Smart merge algorithms
- **Offline Queue**: Delayed sync when offline
- **Incremental Updates**: Timestamp-based sync

### 🔍 Advanced Search
- **Full-text Search**: Messages and conversation titles
- **Relevance Scoring**: TF-IDF algorithm implementation
- **Auto-suggestions**: Smart completion and history
- **Filtering**: Date range, conversation, and type filters

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
pnpm run test           # Jest + React Native Testing Library
```

### Backend Testing  
```bash
cd backend
pnpm run test           # Jest + Supertest for API testing
```

## 📦 Deployment

### Frontend Deployment
```bash
cd frontend
pnpm run build         # Create production build
expo build:ios          # Build for iOS App Store
expo build:android      # Build for Google Play Store
```

### Backend Deployment
```bash
cd backend
pnpm run build         # Compile TypeScript
pnpm run start         # Start production server
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the ChatGPT API
- Expo team for the amazing React Native framework
- All open source contributors

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the [documentation](./docs/)
- Contact: GitHub Issues

---

**Built with ❤️ using React Native and Node.js**