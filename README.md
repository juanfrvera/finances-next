# Next.js Finance Dashboard

A modern finance dashboard built with Next.js, deployed automatically to AWS Lambda.

## 🚀 Quick Start

**For AWS deployment:** See [`deploy/AWS_SETUP_GUIDE.md`](deploy/AWS_SETUP_GUIDE.md)

**For local development:**
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

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

## 🔧 Features

- ✅ **Automatic AWS deployment** on push to main
- ✅ **MongoDB integration** for data storage
- ✅ **Authentication** with NextAuth.js
- ✅ **Responsive design** with Tailwind CSS
- ✅ **TypeScript** for type safety

## 🌐 Deployment

**Zero-setup deployment to AWS Lambda:**

1. Follow [`deploy/AWS_SETUP_GUIDE.md`](deploy/AWS_SETUP_GUIDE.md)
2. Push to main branch
3. Your app is live! (~3-5 minutes)

**Cost:** ~$5-15/month for typical usage

## 📊 Architecture

```
GitHub → GitHub Actions → AWS CloudFormation → Lambda + API Gateway + CloudFront
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

## 📝 Environment Variables

Create `.env.local` for local development:

```env
DB_URL=mongodb://localhost:27017
DB_NAME=your-database-name
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

For production, these are automatically configured via GitHub secrets.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Push to main → automatic deployment

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
