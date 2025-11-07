import { useState, useEffect, ChangeEvent, FormEvent, useMemo } from 'react';
import './App.scss';

interface Post { id: string; title: string; body: string; deleted: boolean; }
interface EditFormData { title: string; body: string; }

const CIPHER_KEY = '//TODO:_ChangeTh!s_B4_Deploy';

const scramble = (text: string, key: string): string => {
  let prevCharCode = 0;
  return Array.from(text)
    .map((char, i) => {
      const keyCharCode = key.charCodeAt(i % key.length);
      const mixedCode = char.charCodeAt(0) ^ keyCharCode ^ prevCharCode;
      prevCharCode = mixedCode;
      return String.fromCharCode(mixedCode);
    })
    .join('');
};

const unscramble = (scrambledText: string, key: string): string => {
  let prevCharCode = 0;
  return Array.from(scrambledText)
    .map((char, i) => {
      const keyCharCode = key.charCodeAt(i % key.length);
      const scrambledCode = char.charCodeAt(0);
      const origCode = scrambledCode ^ keyCharCode ^ prevCharCode;
      prevCharCode = scrambledCode;
      return String.fromCharCode(origCode);
    })
    .join('');
};

const encodeIdForHash = (id: string): string => btoa(scramble(`${id}:my-note-app-post`, CIPHER_KEY));

const decodeIdFromHash = (hash: string): string | null => {
  try {
    const encryptedText = atob(hash);
    const decoded = unscramble(encryptedText, CIPHER_KEY);
    if (decoded.endsWith(':my-note-app-post')) return decoded.split(':')[0];
    return null;
  } catch (error) {
    return null;
  }
};

const getHash = () => window.location.hash.replace('#', '');
const getSnippet = (body: string) => body.split('\n')[0];

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [postsError, setPostsError] = useState<string>('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(decodeIdFromHash(getHash()));
  const [includeDeleted, setIncludeDeleted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState<string>('');
  const [editFormData, setEditFormData] = useState<EditFormData>({ title: '', body: '' });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>('');

  const selectedPost = useMemo(() => posts.find((post) => post.id === selectedPostId), [posts, selectedPostId]);
  
  const filteredPosts = useMemo(() => {
    const query = appliedSearchQuery.toLowerCase();
    if (!query) return posts;
    return posts.filter(p => p.title.toLowerCase().includes(query));
  }, [posts, appliedSearchQuery]);

  useEffect(() => {
    let isMounted = true;
    const fetchPosts = async () => {
      try {
        if (isMounted) setIsLoading(true);
        if (isMounted) setPostsError('');
        
        const response = await fetch(`/api/posts?include_deleted=${includeDeleted}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        if (isMounted) setPosts(data.posts);
      } catch (error) {
        if (isMounted) {
          if (error instanceof Error) setPostsError(error.message);
          else setPostsError('An unknown error occurred');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchPosts();
    
    return () => { isMounted = false; };
  }, [includeDeleted]);

  useEffect(() => {
    const handleHashChange = () => setSelectedPostId(decodeIdFromHash(getHash()));
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (selectedPost) { setEditFormData({ title: selectedPost.title, body: selectedPost.body }); setEditError(''); }
  }, [selectedPost]);

  const handlePostSelect = (post: Post) => { if (!isSaving) window.location.hash = encodeIdForHash(post.id); };
  const handleCloseEditor = () => { setEditError(''); setIsSaving(false); window.location.hash = ''; };
  const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setEditFormData((prev) => ({ ...prev, [event.target.name]: event.target.value })); };
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => { setSearchQuery(event.target.value); };
  
  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedSearchQuery(searchQuery);
  };

  const handleSaveSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPostId) return;

    if (!editFormData.title.trim() || !editFormData.body.trim()) {
      setEditError('Title and body are required.');
      return;
    }

    setIsSaving(true);
    setEditError('');
    try {
      const response = await fetch(`/api/posts/${selectedPostId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (response.status === 422) {
        const errorData = await response.json();
        setEditError(errorData.errors.join(', '));
        return;
      }
      if (!response.ok) throw new Error(`Failed to update post. Status: ${response.status}`);
      const updateResponse = await response.json();
      setPosts((prevPosts) => prevPosts.map((post) => (post.id === updateResponse.post.id ? updateResponse.post : post)));
      
      handleCloseEditor();

    } catch (error) {
      if (error instanceof Error) setEditError(error.message);
      else setEditError('An unknown error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!selectedPostId || !window.confirm('Are you sure you want to delete this post?')) return;
    setIsSaving(true);
    setEditError('');
    try {
      const response = await fetch(`/api/posts/${selectedPostId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleted: true }),
      });
      if (!response.ok) throw new Error(`Failed to delete post. Status: ${response.status}`);
      
      const updateResponse = await response.json();

      if (includeDeleted) {
        setPosts(prevPosts => prevPosts.map(post => (post.id === updateResponse.post.id ? updateResponse.post : post)));
      } else {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== selectedPostId));
      }

      handleCloseEditor();
    } catch (error) {
      if (error instanceof Error) setEditError(error.message);
      else setEditError('An unknown error occurred while deleting.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasFormChanged = selectedPost ? editFormData.title !== selectedPost.title || editFormData.body !== selectedPost.body : false;

  if (isLoading && posts.length === 0) return (<div className="app-container"><p style={{ padding: '1rem' }}>Loading posts...</p></div>);
  if (postsError) return (<div className="app-container"><p style={{ padding: '1rem', color: 'red' }}>Error: {postsError}</p></div>);

  return (
    <div className="app">
      <div className="app-container">
        <div className="main-content">
          <aside className="posts-column">
            <div className="posts-header">
              <h2>Posts</h2>
              <div className="controls">
                <label><input type="checkbox" checked={includeDeleted} onChange={(e) => setIncludeDeleted(e.target.checked)} /> Include deleted</label>
                <form onSubmit={handleSearchSubmit} className="search-form">
                  <input type="text" placeholder="Search title..." className="search-bar" value={searchQuery} onChange={handleSearchChange} />
                </form>
              </div>
            </div>
            <div className="post-list">
              {filteredPosts.length === 0 ? (
                <p>{appliedSearchQuery ? 'No posts match your search.' : 'No posts found.'}</p>
              ) : (
                filteredPosts.map((post) => (
                  <article key={post.id} className={`post-snippet ${post.id === selectedPostId ? 'selected' : ''} ${post.deleted ? 'deleted' : ''}`.replace(/\s+/g, ' ').trim()} onClick={() => handlePostSelect(post)}>
                    <h3>{post.title || 'Untitled Post'}</h3>
                    <p>{getSnippet(post.body) || 'No content'}</p>
                  </article>
                ))
              )}
            </div>
          </aside>
          <main className="edit-column">
            <div className="edit-column-header"><h2>Edit Post</h2></div>
            {selectedPost ? (
              <form onSubmit={handleSaveSubmit} className="edit-form">
                <div><label htmlFor="title">Title</label><input type="text" id="title" name="title" value={editFormData.title} onChange={handleFormChange} disabled={isSaving} /></div>
                <div><label htmlFor="body">Body</label><textarea id="body" name="body" value={editFormData.body} onChange={handleFormChange} rows={15} disabled={isSaving} /></div>
                <div className="form-actions">
                  <button type="submit" disabled={isSaving || !hasFormChanged}>{isSaving ? 'Saving...' : 'Save'}</button>
                  <button type="button" onClick={handleCloseEditor} disabled={isSaving}>Close</button>
                  <button type="button" className="delete-button" onClick={handleDeleteClick} disabled={isSaving || selectedPost.deleted}>{selectedPost.deleted ? 'Deleted' : 'Delete'}</button>
                </div>
                {editError && <p className="error-message" style={{ color: 'red' }}>Error: {editError}</p>}
              </form>
            ) : (
              <div className="edit-placeholder"><p>Select a post to edit</p></div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}