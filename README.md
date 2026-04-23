# Transport Management System (TMS)

A comprehensive Transport Management System built with Next.js, Drizzle ORM, and PostgreSQL for managing multi-modal shipments, tracking, and logistics operations.

## 🚀 Features

### Core Modules
- **Master Data Management**: Customers, Vendors, Locations, Schools, Vehicles, Drivers, Goods, Shipping Rates
- **Order Management**: Create and manage shipments with multi-leg journey support
- **Tracking & Monitoring**: Real-time status tracking with history
- **Driver Mobile App**: PWA for drivers with offline capability
- **Dashboard & Reports**: Analytics and performance metrics
- **BAST Generation**: Digital delivery proof with PDF generation
- **WhatsApp Integration**: Automated notifications

### Technical Stack
- **Framework**: Next.js 16 + React 19 + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Data Fetching**: TanStack Query (React Query)
- **Auth**: Better-Auth
- **PWA**: Progressive Web App for drivers

## 📁 Project Structure

```
src/
├── app/
│   ├── (admin)/              # Admin dashboard routes
│   │   ├── dashboard/         # Dashboard overview
│   │   ├── master/            # Master data CRUD
│   │   ├── shipments/         # Shipment management
│   │   └── reports/           # Analytics & reports
│   ├── (driver)/              # Driver PWA routes
│   └── api/                   # API routes
├── components/
│   └── ui/                    # shadcn/ui components
├── hooks/                     # TanStack Query hooks
├── lib/
│   ├── db/                    # Drizzle schema & client
│   ├── auth/                  # Better-Auth config
│   └── api/                   # API utilities
└── types/                     # TypeScript types
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL database

### Setup

1. **Clone and install dependencies**
```bash
git clone <repo-url>
cd tms
bun install
```

2. **Environment Variables**
Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/tms_db
BETTER_AUTH_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Database Setup**
```bash
# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate

# (Optional) Open Drizzle Studio
bun run db:studio
```

4. **Start Development Server**
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Schema

### Core Entities
- **customers**: Customer information
- **vendors**: Transport vendors/partners
- **locations**: Warehouses, hubs, ports, schools
- **schools**: Educational institutions as delivery destinations
- **vehicles**: Trucks, wing boxes, ships, containers
- **drivers**: Driver information and assignments
- **goods**: Product catalog with material codes
- **shipping_rates**: Rate cards by route and vehicle type

### Transactional Entities
- **shipments**: Main shipment records
- **shipment_items**: Items in each shipment
- **shipment_legs**: Multi-leg journey segments
- **shipment_status_history**: Status change history
- **delivery_proofs**: Photos, BAST, signatures
- **notifications**: WhatsApp/email notifications

## 🔌 API Endpoints

### Master Data APIs
- `GET/POST /api/customers` - Customer CRUD
- `GET/POST /api/vendors` - Vendor CRUD
- `GET/POST /api/locations` - Location CRUD
- `GET/POST /api/schools` - School CRUD
- `GET/POST /api/vehicles` - Vehicle CRUD
- `GET/POST /api/drivers` - Driver CRUD
- `GET/POST /api/goods` - Goods CRUD
- `GET/POST /api/shipping-rates` - Shipping rate CRUD

### Shipment APIs
- `GET/POST /api/shipments` - Shipment list & create
- `GET/PUT/DELETE /api/shipments/:id` - Single shipment
- `POST /api/shipments/:id/status` - Update status
- `POST /api/shipments/:id/assign` - Assign vehicle/driver

### Driver APIs
- `GET /api/driver/shipments` - Driver's assigned shipments
- `GET /api/driver/shipments/:id` - Shipment detail
- `POST /api/driver/shipments/:id/status` - Update status
- `POST /api/driver/shipments/:id/photo` - Upload delivery proof

### Dashboard APIs
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/shipments` - Recent shipments
- `GET /api/reports/shipments` - Shipment reports
- `GET /api/reports/drivers` - Driver performance

## 👥 User Roles

1. **Admin**: Full access to all features
2. **Driver**: Mobile access for status updates and photo uploads
3. **Viewer**: Read-only access to tracking and reports

## 🚚 Multi-Leg Journey

The system supports complex multi-modal journeys:

Example:
1. Wing box pickup from warehouse
2. Transfer to truck for long-distance
3. Ship via container (Tanjung Priok/Tanjung Perak)
4. Feeder truck to final destination

Each leg can have different vehicle and driver assignments.

## 📱 Driver PWA

Drivers access the system via PWA on their mobile devices:

Features:
- View assigned shipments
- Update status (pending → in_progress → completed)
- Upload delivery photos
- Offline capability with auto-sync
- Digital BAST signature capture

## 🧪 Testing

```bash
# Run linting
bun run lint

# Type checking
bun run tsc --noEmit

# Build
bun run build
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Docker
```bash
docker build -t tms .
docker run -p 3000:3000 tms
```

### Environment Variables for Production
```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-production-secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
WHATSAPP_API_KEY=your-whatsapp-api-key
```

## 📈 Performance

- Database queries optimized with proper indexing
- TanStack Query caching reduces API calls
- Pagination on all list endpoints
- Optimized images with Next.js Image component

## 🔒 Security

- Role-based access control (RBAC)
- Input validation with Zod
- SQL injection protection via Drizzle ORM
- CSRF protection via Better-Auth
- Secure session management

## 📝 License

MIT License - feel free to use for your logistics operations!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for Indonesian Logistics Companies**

Specialized for multi-modal transport (Wing Box → Truck → Ship) with delivery to schools and comprehensive tracking.
