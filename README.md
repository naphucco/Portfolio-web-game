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

portfolio/
├── app/
│   ├── layout.jsx              # Layout chung
│   ├── page.jsx                # Trang chủ
│   ├── about/page.jsx
│   ├── games/
│   │   ├── page.jsx            # Grid game
│   │   └── [slug]/page.jsx     # Chơi game
│   └── blog/
│       ├── page.jsx            # Danh sách
│       └── [slug]/page.jsx     # Bài viết (MDX)
├── components/
│   ├── Nav.jsx
│   ├── GameCard.jsx
│   └── GameStage.jsx           # 'use client' + lazy-load engine
├── games/
│   ├── dodge.js
│   ├── flappy.js
│   └── cube3d.js
├── content/
│   └── blog/*.mdx
├── public/models/
└── next.config.js
