'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';
import { Post } from '@/types/database';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const postsResponse = await fetch('/api/posts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setPosts(postsData.filter((post: Post) => post.ownerid === user.userID));
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [userResponse, postsResponse] = await Promise.all([
          fetch('/api/auth', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch('/api/posts', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        if (userResponse.ok && postsResponse.ok) {
          const [userData, postsData] = await Promise.all([
            userResponse.json(),
            postsResponse.json()
          ]);

          setUser(userData);
          setPosts(postsData.filter((post: Post) => post.ownerid === userData.userID));
        } else {
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-orange-900 via-red-800 to-red-900">
        <Sidebar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-pulse text-orange-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-900 via-red-800 to-red-900">
      <Sidebar />
      <div className="flex-1 flex justify-center lg:pl-72">
        <div className="w-full max-w-4xl px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 md:space-x-6">
              <Image
                src={user.imageURL || '/default-avatar.png'}
                alt={user.name || 'User'}
                width={120}
                height={120}
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full flex-shrink-0"
              />
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">{user.name}</h1>
                <p className="text-sm sm:text-base text-gray-300">
                  {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {posts.map((post) => (
              <PostCard 
                key={post.postid} 
                post={post} 
                onPostUpdated={fetchUserPosts}
              />
            ))}
            {posts.length === 0 && (
              <div className="text-center text-sm sm:text-base text-gray-400 py-6 sm:py-8">
                No posts yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 