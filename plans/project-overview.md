# Head TA Directory - Project Overview

## Vision
A simple, elegant directory system for CS department Head TAs that prioritizes speed, usability, and clean design. Built with Next.js 15 and optimized for performance using Vercel's infrastructure.

## Core Functionality
- **Directory Management**: Track Head TAs across semesters and courses
- **Course Organization**: Visualize course family trees and professor assignments
- **Profile Management**: Individual TA profiles with comprehensive information
- **Invitation System**: Secure onboarding through email invitations
- **Professor Views**: Faculty can view their TAs and course assignments

## Design Principles
- **Minimalist UI**: Following the established style guide with elegant typography
- **Performance First**: Blazingly fast using Vercel DB/KV store
- **Simple Authentication**: Email/password with streamlined UX
- **Responsive Design**: Clean experience across all devices

## Technology Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS v4
- **Database**: Vercel Postgres (primary consideration) or Supabase
- **Authentication**: NextAuth.js or Supabase Auth
- **Deployment**: Vercel (seamless integration)
- **Package Manager**: pnpm

## Key Features
1. **Semester View**: Bold semester headers with TA listings
2. **Course Timeline**: Linear progression of course offerings
3. **Individual Profiles**: Multi-semester TA history
4. **Professor Dashboard**: Course and TA management
5. **Invitation Workflow**: Secure onboarding process

## Success Metrics
- Sub-second page load times
- Intuitive navigation requiring no training
- Clean, accessible interface meeting WCAG standards
- Scalable to 100+ TAs and 50+ courses