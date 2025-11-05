import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner';

function BlogPostDetailPage() {
  const { slug } = useParams();
  const location = useLocation();
  const [post, setPost] = useState(location.state?.postData || null);
  const [loading, setLoading] = useState(!post);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`https://samriddhi-blog-backend.onrender.com/api/post/${slug}`);
        if (!response.ok) {
          throw new Error('Blog post not found. It might have been moved or deleted.');
        }
        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch blog post:", err);
      } finally {
        setLoading(false);
      }
    };

    // If post data wasn't passed via Link state, fetch it from the API
    if (!post) {
      fetchPost();
    }
  }, [slug, post]);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} - SamriddhiShop Blog`;
    }
    // Cleanup function to reset the document title
    return () => { document.title = 'SamriddhiShop'; };
  }, [post]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Failed to Load Post</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link to="/blogs" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
          Back to Blog
        </Link>
      </div>
    );
  }

  if (!post) {
    return <div className="text-center py-12">Post not found.</div>;
  }

  return (
    <div className="max-w-full mx-0 py-8 px-4">
      <nav className="mb-8">
        <Link to="/blogs" className="text-blue-600 hover:underline">
          &larr; Back to All Posts
        </Link>
      </nav>

      <article>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">{post.title}</h1>
        <div className="flex items-center space-x-4 text-gray-500 mb-6">
          <span>By <span className="font-medium text-gray-800">{post.author}</span></span>
          <span>&bull;</span>
          <span>{new Date(post.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>

        <img 
          src={post.thumbnailUrl} 
          alt={post.title} 
          className="w-full h-auto max-h-[675px] object-cover rounded-lg shadow-lg mb-8" 
        />

        <div 
          className="prose lg:prose-xl max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />
      </article>
    </div>
  );
}

export default BlogPostDetailPage;