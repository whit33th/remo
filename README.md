# Content Creator Assistant

A powerful content management platform with advanced email notification system built for creators who manage content across multiple social media platforms.

## Live Demo

**🌐 Try the app:** [WEB](https://tretch.vercel.app/)

## Email System - Core Feature

### Smart Email Notifications

The platform uses **Resend Convex Component** to deliver intelligent email notifications:

**Notification Types:**

- **Deadline alerts** - reminders about upcoming posts
- **Scheduled reminders** - automatic notifications for planned content
- **Overdue content** - alerts for missed deadlines
- **Published confirmations** - success notifications
- **Daily reports** - content summary for the day

**Email Features:**

- **Personalized templates** with user's name and content preview
- **Platform-specific icons** (Instagram, X, YouTube, Telegram)
- **Dark theme design** matching the app's aesthetic
- **Responsive layout** for all devices
- **Real-time delivery tracking** via webhooks

### Email Analytics

Track email performance with webhook events:

- **Delivered** - successful delivery
- **Bounced** - failed delivery
- **Opened** - email opened by recipient
- **Clicked** - link clicks
- **Complained** - spam reports

## Content Management

**Multi-Platform Support:**

- Instagram, X (Twitter), YouTube, Telegram
- Unified content creation interface
- Platform-specific formatting

**Content Planning:**

- Calendar-based scheduling
- Hashtag and mention management
- Media file uploads
- Draft and idea storage

**Automation:**

- Automatic deadline reminders
- Email notifications for important events
- Content analytics across platforms
- Recurring post scheduling

## Collaboration Features

**Team Work:**

- Share posts via email
- Team access to content
- Collaborative reports
- Content approval workflows

## Technical Stack

**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
**Backend:** Convex (reactive database)
**Email:** Resend with Convex integration
**Auth:** Convex Auth

## Quick Start

1. **Install dependencies:**

```bash
npm install
```

2. **Environment setup:**

```bash
# .env.local
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key
AUTH_DOMAIN=your-domain.com
RESEND_TOKEN=your-resend-token
```

3. **DNS setup for email:**

- Add domain to Resend Dashboard
- Configure SPF and DKIM records
- Wait for domain verification (5-30 minutes)

4. **Run development:**

```bash
npm run dev
```

## Email Configuration

**Webhook URL:** `https://your-deployment.convex.cloud/api/resend`

**Required Events:** `email.delivered`, `email.bounced`, `email.complained`

**Email Templates:**

- Modern dark theme design
- Gradient headers
- Platform-specific styling
- Personalized content blocks

## Deployment

## Hackathon Project

Built for **Convex & Resend Hackathon** demonstrating:

- Complete Resend Convex Component integration
- Creative email functionality implementation
- Quality full-stack application
- Modern development practices
