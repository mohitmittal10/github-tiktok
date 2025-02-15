// src/utils/api.js
import axios from 'axios';

export const fetchTopRepos = async () => {
  try {
    const response = await axios.get(
      'https://api.github.com/search/repositories?q=stars:>1&sort=stars&order=desc'
    );
    return response.data.items;
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return [];
  }
};