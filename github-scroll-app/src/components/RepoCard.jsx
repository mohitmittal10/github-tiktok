import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaShareAlt, FaBookmark } from "react-icons/fa";
import ReactMarkdown from 'react-markdown';

const formatCount = (num) => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  } else {
    return num;
  }
};

const RepoCard = ({ repo, isSaved, onSave }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [readme, setReadme] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isFlipped && !readme) {
      fetchReadme();
    }
  }, [isFlipped]);

  const fetchReadme = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo.owner.login}/${repo.name}/readme`
      );
      const data = await response.json();
      if (data.content) {
        const decodedContent = atob(data.content);
        setReadme(decodedContent);
      }
    } catch (error) {
      console.error("Error fetching README:", error);
      setReadme("Unable to load README");
    }
    setIsLoading(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: repo.name,
      text: repo.description || "Check out this repository on GitHub!",
      url: repo.html_url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(repo.html_url);
        alert("Link copied to clipboard!");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="repo-card-container">
      <AnimatePresence initial={false} mode="wait">
        {!isFlipped ? (
          <motion.div
            key="front"
            className="repo-card"
            initial={{ rotateY: 180 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: -180 }}
            transition={{ duration: 0.6 }}
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="repo-header">
            <button 
                className="info-button" 
                onClick={() => setIsFlipped(true)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="#ffffff"
                >
                  <path
                    d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="repo-header-1">
                <img
                  src={repo.owner.avatar_url}
                  alt={`${repo.owner.login}'s profile`}
                  className="profile-photo"
                />
                <h2>{repo.name}</h2>
              </div>
              <div className="repo-header-2">
                <div className="repo-lang">
                  <svg
                    width="30"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#48b332"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <circle cx="12" cy="12" r="3" fill="#48b332"></circle>
                    </g>
                  </svg>
                  <div className="lang">{repo.language}</div>
                </div>
                <div className="repo-license">
                  <svg
                    width="30"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#48b332"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <circle cx="12" cy="12" r="3" fill="#48b332"></circle>
                    </g>
                  </svg>
                  <span>{repo.license?.name || "No License"}</span>
                </div>
              </div>
              <div>
                <p className="desc">{repo.description || "No description provided."}</p>
              </div>
              <div className="repo-dates">
                <span className="date">
                  <svg
                    width="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <path
                        d="M7 10H17M7 14H12M7 3V5M17 3V5M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z"
                        stroke="#ffffff"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>
                    </g>
                  </svg>
                  Created: {formatDate(repo.created_at)}
                </span>
                <span className="date">
                  <svg
                    width="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <path
                        d="M12 7V12L14.5 10.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        stroke="#ffffff"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>
                    </g>
                  </svg>
                  Last Updated: {formatDate(repo.pushed_at)}
                </span>
              </div>
            </div>

            <div className="repo-stats">
              <span className="repo-stars">
                <p>
                  <svg
                    width="18px"
                    height="18px"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#ffffff"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <path
                        d="M11.2691 4.41115C11.5006 3.89177 11.6164 3.63208 11.7776 3.55211C11.9176 3.48263 12.082 3.48263 12.222 3.55211C12.3832 3.63208 12.499 3.89177 12.7305 4.41115L14.5745 8.54808C14.643 8.70162 14.6772 8.77839 14.7302 8.83718C14.777 8.8892 14.8343 8.93081 14.8982 8.95929C14.9705 8.99149 15.0541 9.00031 15.2213 9.01795L19.7256 9.49336C20.2911 9.55304 20.5738 9.58288 20.6997 9.71147C20.809 9.82316 20.8598 9.97956 20.837 10.1342C20.8108 10.3122 20.5996 10.5025 20.1772 10.8832L16.8125 13.9154C16.6877 14.0279 16.6252 14.0842 16.5857 14.1527C16.5507 14.2134 16.5288 14.2807 16.5215 14.3503C16.5132 14.429 16.5306 14.5112 16.5655 14.6757L17.5053 19.1064C17.6233 19.6627 17.6823 19.9408 17.5989 20.1002C17.5264 20.2388 17.3934 20.3354 17.2393 20.3615C17.0619 20.3915 16.8156 20.2495 16.323 19.9654L12.3995 17.7024C12.2539 17.6184 12.1811 17.5765 12.1037 17.56C12.0352 17.5455 11.9644 17.5455 11.8959 17.56C11.8185 17.5765 11.7457 17.6184 11.6001 17.7024L7.67662 19.9654C7.18404 20.2495 6.93775 20.3915 6.76034 20.3615C6.60623 20.3354 6.47319 20.2388 6.40075 20.1002C6.31736 19.9408 6.37635 19.6627 6.49434 19.1064L7.4341 14.6757C7.46898 14.5112 7.48642 14.429 7.47814 14.3503C7.47081 14.2807 7.44894 14.2134 7.41394 14.1527C7.37439 14.0842 7.31195 14.0279 7.18708 13.9154L3.82246 10.8832C3.40005 10.5025 3.18884 10.3122 3.16258 10.1342C3.13978 9.97956 3.19059 9.82316 3.29993 9.71147C3.42581 9.58288 3.70856 9.55304 4.27406 9.49336L8.77835 9.01795C8.94553 9.00031 9.02911 8.99149 9.10139 8.95929C9.16534 8.93081 9.2226 8.8892 9.26946 8.83718C9.32241 8.77839 9.35663 8.70162 9.42508 8.54808L11.2691 4.41115Z"
                        stroke="#ffffff"
                        stroke-width="0.528"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>
                    </g>
                  </svg>
                </p>
                <p>{formatCount(repo.stargazers_count)}</p>
              </span>

              <span className="repo-forks">
                <p>
                  <svg
                    fill="#8f8f8f"
                    width="18px"
                    height="18px"
                    viewBox="-4 -2 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMinYMin"
                    className="jam jam-fork"
                    stroke="#8f8f8f"
                    strokeWidth="0.00024000000000000003"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <path d="M8 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm1.033-3.817A3.001 3.001 0 1 1 7 14.17v-1.047c0-.074.003-.148.008-.221a1 1 0 0 0-.462-.637L3.46 10.42A3 3 0 0 1 2 7.845V5.829a3.001 3.001 0 1 1 2 0v2.016a1 1 0 0 0 .487.858l3.086 1.846a3 3 0 0 1 .443.324 3 3 0 0 1 .444-.324l3.086-1.846a1 1 0 0 0 .487-.858V5.841A3.001 3.001 0 0 1 13 0a3 3 0 0 1 1.033 5.817v2.028a3 3 0 0 1-1.46 2.575l-3.086 1.846a1 1 0 0 0-.462.637c.005.073.008.147.008.22v1.06zM3 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path>
                    </g>
                  </svg>
                </p>
                <p>{formatCount(repo.forks_count)}</p>
              </span>

              <span className="repo-watchers">
                <p>
                  <svg
                    width="18px"
                    height="18px"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <path
                        d="M18 15C16.3431 15 15 16.3431 15 18C15 19.6569 16.3431 21 18 21C19.6569 21 21 19.6569 21 18C21 16.3431 19.6569 15 18 15ZM18 15V8C18 7.46957 17.7893 6.96086 17.4142 6.58579C17.0391 6.21071 16.5304 6 16 6H13M6 9C7.65685 9 9 7.65685 9 6C9 4.34315 7.65685 3 6 3C4.34315 3 3 4.34315 3 6C3 7.65685 4.34315 9 6 9ZM6 9V21"
                        stroke="#ffffff"
                        strokeWidth="0.528"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </g>
                  </svg>
                </p>
                <p>{formatCount(repo.watchers_count)}</p>
              </span>
            </div>

            <div className="repo-bottom">
              <button className="share-button" onClick={handleShare}>
                <FaShareAlt />
              </button>

              <button className="save-button" onClick={onSave}>
                <FaBookmark style={{ paddingRight: "10px" }} />
                {isSaved ? "Saved" : "Save"}
              </button>

              

              <a
                className="github-url"
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  className="github-url"
                  fill="#ffffff"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="#ffffff"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <g data-name="Layer 2">
                      <g data-name="diagonal-arrow-right-up">
                        <rect
                          width="4"
                          height="4"
                          transform="rotate(180 12 12)"
                          opacity="0"
                        ></rect>
                        <path d="M18 7.05a1 1 0 0 0-1-1L9 6a1 1 0 0 0 0 2h5.56l-8.27 8.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0L16 9.42V15a1 1 0 0 0 1 1 1 1 0 0 0 1-1z"></path>
                      </g>
                    </g>
                  </g>
                </svg>
              </a>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="back"
            className="repo-card readme-side"
            initial={{ rotateY: -180 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: 180 }}
            transition={{ duration: 0.6 }}
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="readme-header">
              <h3>README</h3>
              <button 
                className="close-button" 
                onClick={() => setIsFlipped(false)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="#ffffff"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div className="readme-content">
              {isLoading ? (
                <div className="loading">Loading README...</div>
              ) : (
                <ReactMarkdown>{readme}</ReactMarkdown>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RepoCard;
