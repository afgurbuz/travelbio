# TravelBio

A minimalist social network for travelers to share the countries they've lived in and visited.

## Features

- 🌍 Share countries you've lived in and visited
- 👤 Minimalist profile pages
- 🔍 Discover other travelers
- 📱 Responsive design
- 🔐 Secure authentication

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd TravelBio
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

4. Set up Supabase database:
Run the SQL commands in `supabase/schema.sql` in your Supabase SQL editor.

5. Start the development server:
```bash
npm run dev
```

### Deployment to Vercel

1. Connect your GitHub repository to Vercel
2. Add the environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET`

3. Deploy!

## Database Schema

### Tables

- `profiles`: User profile information
- `countries`: Available countries with flags
- `user_countries`: Junction table linking users to countries (lived/visited)

### Key Features

- Row Level Security (RLS) enabled
- Automatic profile creation on user signup
- Support for both lived and visited countries
- Country search and selection interface

## Project Structure

```
src/
├── app/                 # Next.js 13+ App Router
├── components/          # Reusable UI components
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
└── globals.css         # Global styles

supabase/
└── schema.sql          # Database schema and initial data
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.