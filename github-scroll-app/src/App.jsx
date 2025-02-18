// src/App.jsx
import React, { useState, useEffect } from 'react';
import { fetchTopRepos } from './utils/api';
import RepoCard from './components/RepoCard';
import AuthModal from './components/AuthModal';
import { auth, signOut } from './firebase';
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

import './App.css';
const db = getFirestore();

function App() {
  const [allRepos, setAllRepos] = useState([]);
  const [displayedRepos, setDisplayedRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [savedRepos, setSavedRepos] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('random');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterKey, setFilterKey] = useState(0); // Add this state


  // Function to fetch repos for a specific page
  const fetchReposPage = async (pageNum) => {
    try {
      const data = await fetchTopRepos(pageNum);
      return data;
    } catch (error) {
      console.error('Error fetching repos:', error);
      return [];
    }
  };

  // Initial load
  useEffect(() => {
    const loadInitialRepos = async () => {
      setLoading(true);
      try {
        const results = await Promise.all([
          fetchReposPage(1),
          fetchReposPage(2),
          fetchReposPage(3)
        ]);

        // Create a Map to ensure uniqueness by repo ID
        const uniqueRepos = new Map();
        results.flat()
          .filter(Boolean)
          .forEach(repo => uniqueRepos.set(repo.id, repo));

        const combinedRepos = Array.from(uniqueRepos.values());
        setAllRepos(combinedRepos);
        setDisplayedRepos(combinedRepos);
        const randomizedRepos = [...combinedRepos].sort(() => Math.random() - 0.5);
        setDisplayedRepos(randomizedRepos);
      } catch (error) {
        console.error('Error loading initial repos:', error);
      }
      setLoading(false);
    };

    loadInitialRepos();
  }, []);

  // Load more repos when scrolling
  useEffect(() => {
    const handleScroll = async () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        === document.documentElement.offsetHeight
      ) {
        if (!loadingMore && hasMore) {
          setLoadingMore(true);
          const nextPage = Math.floor(allRepos.length / 100) + 1;
          const newRepos = await fetchReposPage(nextPage);

          if (newRepos.length > 0) {
            setAllRepos(prev => {
              const uniqueRepos = new Map();
              [...prev, ...newRepos].forEach(repo => uniqueRepos.set(repo.id, repo));
              return Array.from(uniqueRepos.values());
            });

            if (currentFilter === 'all') {
              setDisplayedRepos(prev => {
                const uniqueRepos = new Map();
                [...prev, ...newRepos].forEach(repo => uniqueRepos.set(repo.id, repo));
                return Array.from(uniqueRepos.values());
              });
            } else {
              // Reapply current filter with new repos
              applyFilter(currentFilter, Array.from(uniqueRepos.values()));
            }
          } else {
            setHasMore(false);
          }
          setLoadingMore(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, allRepos.length, currentFilter]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        try {
          // Create a reference to the user's document in the users collection
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            // If document exists, get saved repos
            setSavedRepos(userSnap.data().savedRepos || []);
          } else {
            // If document doesn't exist, create it
            await setDoc(userRef, {
              savedRepos: [],
              email: user.email,
              createdAt: new Date()
            });
            setSavedRepos([]);
          }
        } catch (error) {
          console.error('Error fetching saved repos:', error);
          setSavedRepos([]);
        }
      } else {
        setSavedRepos([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const applyFilter = (filter, repos = allRepos) => {
    let filteredRepos;
    
    switch (filter) {
      case 'saved':
        filteredRepos = repos.filter((repo) => savedRepos.includes(repo.id));
        break;
      case 'trending':
        const now = new Date();
        // First filter to only include repos updated in the last 30 days
        const recentRepos = repos.filter(repo => {
          const pushDate = new Date(repo.pushed_at);
          const daysSinceLastPush = (now - pushDate) / (1000 * 60 * 60 * 24);
          return daysSinceLastPush <= 30;
        });
  
        // Calculate trending score for recent repos
        filteredRepos = recentRepos.map(repo => {
          const pushDate = new Date(repo.pushed_at);
          const daysSinceLastPush = (now - pushDate) / (1000 * 60 * 60 * 24);
          const createdDate = new Date(repo.created_at);
          const repoAgeInDays = (now - createdDate) / (1000 * 60 * 60 * 24);
          
          // Calculate growth rates
          const starsPerDay = repo.stargazers_count / repoAgeInDays;
          const forksPerDay = repo.forks_count / repoAgeInDays;
          
          // Weighted scoring system
          const trendingScore = (
            // Recent activity weight (exponential decay)
            (100 * Math.exp(-daysSinceLastPush / 7)) + // Higher weight for very recent updates
            // Growth rate weights
            (starsPerDay * 500) +  // Stars per day has high impact
            (forksPerDay * 300) +  // Forks per day has medium impact
            // Bonus for very recent repos
            (repoAgeInDays < 14 ? 200 : 0) + // Bonus for repos less than 2 weeks old
            // Activity momentum
            (repo.open_issues_count * 2) +  // Active development indicator
            (repo.watchers_count * 3)       // Community interest indicator
          );
          
          return { ...repo, trendingScore };
        })
        .sort((a, b) => b.trendingScore - a.trendingScore)
        // Limit to top 100 trending repos for better performance
        .slice(0, 100);
        break;
      case 'recent':
        filteredRepos = [...repos].sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
        break;
      case 'random':
        filteredRepos = [...repos].sort(() => Math.random() - 0.5);
        break;
      default:
        filteredRepos = repos;
        break;
    }
    
    setDisplayedRepos(filteredRepos);
  };

  const handleFilter = (filter) => {
    setCurrentFilter(filter);
    setFilterKey(prev => prev + 1); // Increment the key to force refresh
    applyFilter(filter);
    setShowDropdown(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSavedRepos([]);
      setShowDropdown(false);
      setCurrentFilter('all');
      setDisplayedRepos(allRepos);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Update the toggleSaveRepo function in App.jsx
  const toggleSaveRepo = async (repoId) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
  
    try {
      // Create a reference to the user's document
      const userRef = doc(db, 'users', user.uid);
      const isSaved = savedRepos.includes(repoId);
  
      if (isSaved) {
        // Remove repo from Firestore
        await updateDoc(userRef, {
          savedRepos: arrayRemove(repoId)
        });
        setSavedRepos(prev => prev.filter(id => id !== repoId));
      } else {
        // Add repo to Firestore
        await updateDoc(userRef, {
          savedRepos: arrayUnion(repoId)
        });
        setSavedRepos(prev => [...prev, repoId]);
      }
  
      // Update displayed repos if we're in saved filter
      if (currentFilter === 'saved') {
        applyFilter('saved');
      }
    } catch (error) {
      console.error('Error updating saved repos:', error);
      // Optionally show error to user
      alert('Failed to update saved repositories. Please try again.');
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  if (loading) {
    return <div className="loading-container">Loading repositories...</div>;
  }

  return (
    <div className="app">
      <div className="header-container">
        {!user ? (
          <button className="auth-button" onClick={() => setIsAuthModalOpen(true)}>
            Login / Signup
          </button>
        ) : (
          <div className="user-info" onClick={toggleDropdown}>
            <div className='user-info-1'>
            <div className="profile-dropdown">
              
              <img
                src={user.photoURL}
                alt="User Avatar"
                className="user-avatar"
                
              />
              <span>{user.displayName || user.email}</span>
              
            </div>
            {showDropdown && (
                <div className="dropdown-menu">
                  <button onClick={() => handleFilter('saved')}>Saved Repos</button>

                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            
          </div>
          </div>
        )}

        <div className="filter-buttons">
          <button
            className={`filter-button ${currentFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-button ${currentFilter === 'trending' ? 'active' : ''}`}
            onClick={() => handleFilter('trending')}
          >
            Trending 
          </button>
          <button
            className={`filter-button ${currentFilter === 'recent' ? 'active' : ''}`}
            onClick={() => handleFilter('recent')}
          >
            Recent
          </button>
          <button
            className={`filter-button ${currentFilter === 'random' ? 'active' : ''}`}
            onClick={() => handleFilter('random')}
          >
            Random
          </button>
        </div>
      </div>

      {/* //Update the JSX return section where the repo feed is rendered */}
      <div className="repo-feed" key={`${filterKey}-${currentFilter}`}>
        {displayedRepos.map((repo) => (
          <RepoCard
            key={`${repo.id}-${repo.pushed_at}`}
            repo={repo}
            isSaved={savedRepos.includes(repo.id)}
            onSave={() => toggleSaveRepo(repo.id)}
          />
        ))}
      </div>

      {loadingMore && (
        <div className="loading-more">Loading more repositories...</div>
      )}

      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
    </div>
  );
}

export default App;