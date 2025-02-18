// src/utils/api.js
import axios from 'axios';

export const fetchTopRepos = async (page = 1) => {
  try {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=stars:>1&sort=stars&order=desc&page=${page}&per_page=100`
    );
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching repos:', error);
    return [];
  }
};