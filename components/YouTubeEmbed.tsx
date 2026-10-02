// components/YouTubeEmbed.tsx
'use client';

import { useState } from 'react';

type Props = {
  videoId: string;
  title: string;
};

export default function YouTubeEmbed({ videoId, title }: Props) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="yt-embed">
      {!playing ? (
        <button
          className="yt-facade"
          onClick={() => setPlaying(true)}
          aria-label={`Play ${title}`}
        >
          <img
            src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
            alt={title}
            loading="lazy"
            onError={(e) => {
              // Fallback nếu maxresdefault không có
              (e.target as HTMLImageElement).src =
                `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            }}
          />
          <span className="yt-play">
            <svg viewBox="0 0 68 48" width="68" height="48">
              <path
                d="M66.52 7.74a8.44 8.44 0 0 0-5.93-6C55.23 0 34 0 34 0S12.77 0 7.41 1.74a8.44 8.44 0 0 0-5.93 6C0 13.13 0 24 0 24s0 10.87 1.48 16.26a8.44 8.44 0 0 0 5.93 6C12.77 48 34 48 34 48s21.23 0 26.59-1.74a8.44 8.44 0 0 0 5.93-6C68 34.87 68 24 68 24s0-10.87-1.48-16.26z"
                fill="#ff0000"
              />
              <path d="M45 24 27 14v20" fill="#fff" />
            </svg>
          </span>
        </button>
      ) : (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      )}
    </div>
  );
}