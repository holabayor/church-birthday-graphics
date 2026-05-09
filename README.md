# Church Birthday Graphics

A Next.js application to automate the generation and sending of personalized birthday graphics for church members.

## Features

- **Dashboard:** View upcoming birthdays and member statistics.
- **Member Management:**
  - Add, edit, and delete members.
  - Upload member photos.
  - Search and pagination for large lists.
- **Design Generation:**
  - Generate personalized graphics using Satori + Sharp.
  - Support for member photos (renders circular avatars with themed borders).
  - Multiple design template options.
- **Automated Sending:**
  - Daily cron job checks for birthdays.
  - Logs generated graphics.
  - Sends graphics via WhatsApp (if configured).
- **Security:**
  - Password-protected admin interface.
  - Secure API routes using Supabase Service Role Key.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack)
- **Database:** Supabase (PostgreSQL)
- **Image Generation:** Satori (JSX to SVG) + Sharp (SVG to PNG)
- **Styling:** Tailwind CSS + Lucide React + Sonner
- **Authentication:** Custom password-based middleware

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/church-birthday-graphics.git
    cd church-birthday-graphics
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory with the following:

    ```env
    # App URL
    NEXT_PUBLIC_APP_URL=http://localhost:3000

    # Supabase (Client-side)
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

    # Supabase (Server-side - critical for API routes)
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

    # Security
    ADMIN_PASSWORD=your_secure_password
    CRON_SECRET=your_cron_secret

    # WhatsApp Integration (Optional)
    WHATSAPP_TOKEN=your_whatsapp_token
    WHATSAPP_PHONE_ID=your_phone_id
    WHATSAPP_GROUP_ID=your_group_id
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

5.  **Access the Admin Panel:**
    Visit `http://localhost:3000/login` and enter your `ADMIN_PASSWORD`.

## Testing

To run the basic utility tests:

```bash
npx tsx src/lib/utils.test.ts
```

## Deployment

Deploy easily on Vercel. Set up a Cron Job to hit `POST /api/birthdays/send` daily with the `Authorization: Bearer <CRON_SECRET>` header.
