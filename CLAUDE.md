# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 project with TypeScript and Tailwind CSS, using the App Router architecture. The project uses pnpm as the package manager and includes React 19.

## Development Commands

- `pnpm dev` - Start development server with Turbopack (runs on http://localhost:3000)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Architecture

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS v4 with PostCSS
- **Package Manager**: pnpm (uses pnpm-lock.yaml)

## Code Structure

- `app/` - Next.js App Router directory
  - `layout.tsx` - Root layout with font setup and global CSS
  - `page.tsx` - Homepage component
  - `globals.css` - Global styles
- `public/` - Static assets (SVG icons)
- TypeScript path aliases: `@/*` maps to project root

## Key Configuration

- ESLint extends Next.js core web vitals and TypeScript rules
- TypeScript configured with ES2017 target and strict mode
- Next.js config is minimal with default settings