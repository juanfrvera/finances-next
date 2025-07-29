# Next.js Finance Dashboard

A comprehensive financial management application built with Next.js, featuring debt tracking, payment management, multi-currency support, and automatic AWS deployment.

## ✨ Key Features

### 💰 Financial Management
- **Multi-Currency Accounts**: Track balances across different currencies with automatic totals
- **Debt Management**: Create, track, and manage debts with payment status tracking
- **Transaction History**: Record and view payment history with detailed notes
- **Service Tracking**: Monitor recurring services and subscriptions

### 🎯 Advanced Debt Features
- **Payment Status Tracking**: Automatic calculation of paid/unpaid/partially paid status
- **Debt Grouping**: Group related debts by person and payment direction
- **Custom Details**: Add detailed notes and context to each debt
- **Real-time Updates**: Payment status updates instantly when transactions are recorded

### 🎨 User Experience
- **Dark/Light Mode**: Full theme support with system preference detection
- **Custom Ordering**: Drag and rearrange items with persistent custom ordering
- **Archive System**: Archive/unarchive items to keep workspace organized
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices

### 📊 Data Visualization
- **Interactive Charts**: Pie charts and evolution charts for currency breakdowns
- **Payment Progress**: Visual indicators for debt payment progress
- **Account Summaries**: Clear overview of financial status across currencies

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication system
- **HTTP-Only Cookies**: Secure cookie storage with configurable expiration
- **Protected Routes**: Server-side authentication validation
- **Session Management**: Automatic token refresh and logout handling

## 🛠️ Technologies

### Frontend
- **Next.js 14**: React framework with App Router and Server Components
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety across the application
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Shadcn/ui**: High-quality accessible UI components
- **Lucide React**: Beautiful SVG icons

### Backend & Database
- **MongoDB**: NoSQL database for flexible data storage
- **Server Actions**: Next.js server-side data mutations
- **JWT**: JSON Web Tokens for secure authentication
- **Bcrypt**: Password hashing and security

### Development & Tooling
- **ESLint**: Code linting and quality assurance
- **PostCSS**: CSS processing and optimization
- **Vercel**: Development and preview deployments
- **Git**: Version control with GitHub integration

## 🏗️ Architecture

### Application Structure
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │   Next.js API   │    │    MongoDB      │
│                 │    │                 │    │                 │
│ • Dashboard     │◄──►│ • Server Actions│◄──►│ • Users         │
│ • Components    │    │ • Auth Routes   │    │ • Items         │
│ • State Mgmt    │    │ • JWT Validation│    │ • Transactions  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Authentication Flow
1. **Login/Signup**: User credentials validated against MongoDB
2. **JWT Generation**: Server creates signed JWT with user data
3. **Cookie Storage**: JWT stored in HTTP-only cookie with configurable expiration
4. **Route Protection**: Server middleware validates JWT on protected routes
5. **Automatic Refresh**: Token validation and refresh on each request

### Data Flow
1. **Client Interaction**: User performs action in React components
2. **Server Actions**: Next.js server actions handle business logic
3. **Database Operations**: MongoDB operations for data persistence
4. **Real-time Updates**: Optimistic updates with server validation
5. **State Synchronization**: Client state updated with server response

### Deployment Architecture
```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐
│   GitHub    │    │ GitHub Actions  │    │   AWS Lambda    │    │ CloudFront  │
│ Repository  │───►│   CI/CD         │───►│   Next.js App   │───►│   CDN       │
└─────────────┘    └─────────────────┘    └─────────────────┘    └─────────────┘
                            │                       │
                            ▼                       ▼
                   ┌─────────────────┐    ┌─────────────────┐
                   │ CloudFormation  │    │  API Gateway    │
                   │ Infrastructure  │    │  HTTP Routes    │
                   └─────────────────┘    └─────────────────┘
```

## 🚀 Deployment Process

### Continuous Integration with GitHub Actions
Our deployment pipeline automatically handles the entire build and deploy process:

1. **Trigger**: Push to main branch or manual workflow dispatch
2. **Build Process**: 
   - Install dependencies and build Next.js application
   - Optimize for Lambda runtime environment
   - Generate deployment artifacts

3. **AWS Deployment**:
   - **CloudFormation**: Infrastructure as Code for consistent deployments
   - **Lambda Functions**: Serverless execution of Next.js application
   - **API Gateway**: HTTP routing and request handling
   - **CloudFront**: Global CDN for fast content delivery

### AWS Lambda Benefits
- **Cost Effective**: Pay only for actual usage (~$5-15/month)
- **Auto Scaling**: Automatic scaling based on traffic
- **Zero Maintenance**: No server management required
- **Global Distribution**: CloudFront CDN for worldwide performance

### Environment Management
- **Development**: Local development with hot reload
- **Staging**: Automatic preview deployments on pull requests
- **Production**: Automatic deployment to AWS Lambda on main branch
- **Configuration**: Environment variables managed through GitHub secrets

## 🚀 Quick Start

**Local Development:**
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

## 📁 Project Structure

```
├── src/app/                 # Next.js app directory
├── src/components/          # React components
├── deploy/                  # AWS deployment files
│   ├── AWS_SETUP_GUIDE.md   # Complete deployment guide
│   └── aws-cloudformation/  # CloudFormation templates
├── .github/workflows/       # GitHub Actions (auto-deploy)
└── package.json
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# View AWS deployment status
npm run aws:status
npm run aws:outputs
npm run aws:logs
```

## 📝 Environment Configuration

**Local Development (`.env.local`):**
```env
# Database
DB_URL=mongodb://localhost:27017
DB_NAME=finances-dev

# Authentication
JWT_SECRET=your-long-random-secret-key-here
AUTH_COOKIE_EXPIRES_SECONDS=604800  # 7 days
AUTH_EXTEND_ON_ACTIVITY=false
```

**Production:** Environment variables are automatically configured via GitHub secrets and AWS Parameter Store.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Push to main → automatic deployment

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
