# Property CRM Platform

A comprehensive property management system with a robust backend and multi-role frontend interfaces.

## Project Structure (Monorepo)

This project is managed using [Turborepo](https://turbo.build/).

### Apps
- **`apps/api`**: NestJS Modular Monolith API (Core Logic).
- **`apps/web-admin`**: Next.js Admin Dashboard (for Managers/Admins).
- **`apps/web-client`**: Next.js Mobile Web PWA (for Tenants/Owners).

### Packages
- **`packages/ui`**: Shared React components (Shadcn/UI).
- **`packages/database`**: Supabase/Prisma configuration.

## Getting Started

### Prerequisites
- Node.js (via `npm`)
- Turbo CLI (`npm install -g turbo`)

### Installation

```bash
npm install
```

### Running Development Server

Start all apps simultaneously:

```bash
npm run dev
# or
turbo run dev
```

- API: http://localhost:3000 (default NestJS)
- Web Admin: http://localhost:3000
- Web Client: http://localhost:3002
- API: http://localhost:4000
- Web Client: http://localhost:3002
