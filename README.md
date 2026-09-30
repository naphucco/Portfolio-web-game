First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

npm run build => check lỗi trước khi deploy vercel

portfolio/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── about/page.tsx
│   ├── games/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   └── blog/
│       ├── page.tsx
│       └── [slug]/page.tsx
├── components/
│   ├── Nav.tsx
│   ├── GameCard.tsx
│   └── GameStage.tsx
├── games/
│   ├── dodge.ts
│   ├── flappy.ts
│   └── cube3d.ts
├── content/
│   └── blog/
│       ├── game-optimization.tsx
│       └── placeholder.tsx
├── data/
│   ├── games.ts
│   └── posts.ts
├── public/
│   ├── models/
│   └── blog/
│       ├── game-optimization.jpg
│       └── placeholder.jpg
└── next.config.ts
