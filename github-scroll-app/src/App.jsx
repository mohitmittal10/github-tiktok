// src/App.jsx
import React, { useState, useEffect } from 'react';
import { fetchTopRepos } from './utils/api';
import RepoCard from './components/RepoCard';
import AuthModal from './components/AuthModal';
import { auth, signOut } from './firebase';
import './App.css';

function App() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [savedRepos, setSavedRepos] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const getRepos = async () => {
      const data = await fetchTopRepos();
      setRepos(data);
      setLoading(false);
    };
    getRepos();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        const saved = JSON.parse(localStorage.getItem(`savedRepos_${user.uid}`)) || [];
        setSavedRepos(saved);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSavedRepos([]);
      setShowDropdown(false); // Close dropdown on logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleSaveRepo = (repoId) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const isSaved = savedRepos.includes(repoId);
    let updatedSavedRepos;

    if (isSaved) {
      updatedSavedRepos = savedRepos.filter((id) => id !== repoId);
    } else {
      updatedSavedRepos = [...savedRepos, repoId];
    }

    setSavedRepos(updatedSavedRepos);
    localStorage.setItem(`savedRepos_${user.uid}`, JSON.stringify(updatedSavedRepos));
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleViewSavedRepos = () => {
    // Filter and display only saved repositories
    const savedReposList = repos.filter((repo) => savedRepos.includes(repo.id));
    setRepos(savedReposList);
    setShowDropdown(false); // Close dropdown after selection
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app">
      {!user && (
        <button className="auth-button" onClick={() => setIsAuthModalOpen(true)}>
          Login / Signup
        </button>
      )}

      {user && (
        <div className="user-info">
          <div className="profile-dropdown">
            <img
              src={user.photoURL}
              alt="User Avatar"
              className="user-avatar"
              onClick={toggleDropdown}
            />
            {showDropdown && (
              <div className="dropdown-menu">
                <button onClick={handleViewSavedRepos}>Saved Repos</button>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
          <span>{user.displayName || user.email}</span>
        </div>
      )}

      <div className="repo-feed">
        {repos.map((repo) => (
          <RepoCard
            key={repo.id}
            repo={repo}
            isSaved={savedRepos.includes(repo.id)}
            onSave={() => toggleSaveRepo(repo.id)}
          />
        ))}
      </div>

      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
    </div>
  );
}

export default App;