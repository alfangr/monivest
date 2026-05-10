# MoniVest

Aplikasi manajemen investasi pribadi dengan enkripsi end-to-end dan PWA support.

## Fitur

- **Dashboard**: Ringkasan portofolio investasi dengan chart dan statistik
- **Investasi**: Kelola semua investasi (tambah, edit, hapus)
- **Kategori**: Manage kategori investasi secara dinamis per user (default: Saham, Reksa Dana, Crypto)
- **Pengaturan**: Pengaturan akun dan aplikasi
- **Enkripsi End-to-End**: Semua data investasi dienkripsi di sisi client
- **Auth**: Login dengan Google dan Email
- **PWA**: Dapat diinstall sebagai aplikasi standalone di mobile dan desktop

## Teknologi

- **Next.js 16**: Framework React
- **Supabase**: Backend (Auth & Database)
- **Zustand**: State management
- **Tailwind CSS**: Styling
- **Framer Motion**: Animasi
- **Lucide React**: Ikon
- **PWA**: Manifest dan icons untuk installable app

## Memulai

### Prasyarat

- Node.js 18+
- Akun Supabase

### Instalasi

1. Clone repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Buat file `.env.local` dan isi dengan konfigurasi Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### Setup Supabase

1. Jalankan migration file di folder `supabase/migrations` secara berurutan di Supabase SQL Editor:
   - `000_encryption_migration.sql`
   - `001_create_categories_table.sql`
2. Aktifkan Auth provider (Google & Email) di Supabase Dashboard

### Menjalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Struktur Folder

```
src/
├── app/              # Next.js App Router
├── components/       # React components
│   ├── providers/    # Context providers
│   └── ui/           # UI components
├── hooks/            # Custom hooks
├── lib/              # Utilities & constants
├── stores/           # Zustand stores
└── types/            # TypeScript types
public/
├── icons/            # PWA icons
└── screenshots/      # PWA screenshots
```
