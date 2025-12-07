'use client';

import Image from 'next/image';
import { NewsApiArticle } from '@/types/database';

interface NewsCardProps {
  article: NewsApiArticle;
}

export default function NewsCard({ article }: NewsCardProps) {
  if (!article) {
    return null;
  }

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl p-3 sm:p-4 md:p-6 shadow-lg text-black">
      <div className="flex flex-col md:flex-row gap-3 sm:gap-4 md:gap-6">
        {article?.image_url ? (
          <div className="relative w-full md:w-48 h-40 sm:h-48 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={article.image_url}
              alt={article.title || 'News image'}
              fill
              className="object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 text-orange-600 break-words">
            {article.title}
          </h3>
          <p className="text-sm sm:text-base text-gray-800 mb-3 sm:mb-4 line-clamp-3">{article.description}</p>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <p className="text-xs sm:text-sm text-gray-600">
              {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'No date'}
            </p>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-orange-600 hover:bg-orange-700 rounded-lg text-white transition w-full sm:w-auto text-center"
            >
              Read More
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 