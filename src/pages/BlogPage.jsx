import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import { Link } from 'react-router-dom'; // Import Link for internal navigation

function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAuthor, setSelectedAuthor] = useState('SamriddhiShop');
  const [filteredPosts, setFilteredPosts] = useState([]);

  useEffect(() => {
    document.title = 'Blog - SamriddhiShop';
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://samriddhi-blog-backend.onrender.com/api/posts');
        if (!response.ok) {
          throw new Error('Network response was not ok. Please try again later.');
        }
        const data = await response.json();
        // The API returns an object like { posts: [...] }. We need the array inside.
        if (data && Array.isArray(data.posts)) {
          // Show all posts from the backend
          setPosts(data.posts);
        } else {
          throw new Error("Received data is not in the expected format.");
        }
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch blog posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    // Cleanup function to reset the document title
    return () => { document.title = 'SamriddhiShop'; };
  }, []);

  useEffect(() => {
    if (selectedAuthor) {
      setFilteredPosts(posts.filter(post => post.author === selectedAuthor));
    } else {
      setFilteredPosts(posts);
    }
  }, [selectedAuthor, posts]);

  const authors = [...new Set(posts.map(post => post.author))];

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Failed to Load Blog Posts</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-0 py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900">From Our Blog</h1>
      </div>
      
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600 mb-4">No blog posts found.</h2>
          <p className="text-gray-500">Please check back later for updates!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredPosts.map(post => (
            <Link 
              key={post.slug} 
              to={`/blogs/${post.slug}`} // Use React Router Link for internal navigation
              state={{ postData: post }} // Pass post data to avoid a second fetch
              className="group block bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-2 transition-all duration-300 border"
            >
              <img src={post.thumbnailUrl} alt={post.title} className="w-full h-56 object-cover" />
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300 mb-2">{post.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.brief}</p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span className="font-medium">{post.author}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default BlogPage;
