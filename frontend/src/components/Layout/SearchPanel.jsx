import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import Avatar from '@/components/Avatar/Avatar.jsx';
import Loader from '@/components/Loader/Loader.jsx';
import { useLayout } from '@/context/LayoutContext.js';
import {
  searchUsers,
  clearResults,
  removeHistoryEntry,
  selectSearchState,
  resetSearchState,
  addHistoryEntry,
} from '@/store/slices/searchSlice.js';
import styles from './Panel.module.css';

const SearchPanel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { closePanel } = useLayout();
  const inputRef = useRef(null);
  const { results, status, error, history } = useSelector(selectSearchState);

  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const focusTimeoutRef = useRef(null);

  useEffect(() => {
    dispatch(resetSearchState());
    setInputValue('');
    inputRef.current?.focus();
    return () => {
      dispatch(clearResults());
    };
  }, [dispatch]);

  useEffect(() => {
    const trimmed = inputValue.trim();
    if (trimmed.length < 2) {
      dispatch(clearResults());
      return undefined;
    }
    const timeout = setTimeout(() => {
      dispatch(searchUsers({ query: trimmed }));
    }, 350);
    return () => clearTimeout(timeout);
  }, [dispatch, inputValue]);

  const showHistory = useMemo(
    () => isFocused && inputValue.trim().length < 2 && history.length > 0,
    [isFocused, inputValue, history],
  );

  const handleFocus = () => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    setIsFocused(true);
  };

  const handleBlur = () => {
    focusTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
    }, 150);
  };

  const handleHistorySelect = (entry) => {
    if (!entry?.username) return;
    setInputValue(entry.username);
    dispatch(searchUsers({ query: entry.username }));
    dispatch(addHistoryEntry(entry));
    setIsFocused(false);
  };

  const handleRemoveHistory = (event, username) => {
    event.preventDefault();
    event.stopPropagation();
    dispatch(removeHistoryEntry(username));
  };

  const handleClearInput = () => {
    setInputValue('');
    dispatch(clearResults());
  };

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed.length >= 2) {
      dispatch(searchUsers({ query: trimmed }));
    }
  }, [dispatch, inputValue]);

  const handleResultClick = (user) => {
    dispatch(clearResults());
    dispatch(addHistoryEntry({
      username: user.username,
      fullName: user.fullName ?? null,
      avatarUrl: user.avatarUrl ?? null,
    }));
    setInputValue('');
    closePanel();
    navigate(`/profile/${user.username}`);
  };

  return (
    <div className={styles.panelContent}>
      <h2 className={styles.panelTitle}>Search</h2>
      <form className={styles.searchField} onSubmit={handleSubmit}>
        <FiSearch className={styles.searchIcon} />
        <input
          ref={inputRef}
          type="search"
          className={styles.searchInput}
          placeholder="Search by username or full name"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {inputValue && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClearInput}
            aria-label="Clear search"
          >
            <FiX />
          </button>
        )}
      </form>

      {showHistory && (
        <div className={styles.panelSection}>
          <span className={styles.sectionTitle}>Recent</span>
          <ul className={styles.historyList}>
            {history.map((entry) => (
              <li key={entry.username}>
                <button
                  type="button"
                  className={styles.historyItem}
                  onClick={() => handleHistorySelect(entry)}
                >
                  <Avatar
                    src={entry.avatarUrl || null}
                    fallback={(entry.fullName || entry.username).slice(0, 2).toUpperCase()}
                    alt={`${entry.username} avatar`}
                    size="sm"
                  />
                  <div className={styles.resultMeta}>
                    <span className={styles.resultUsername}>{entry.username}</span>
                    {entry.fullName && (
                      <span className={styles.resultFullName}>{entry.fullName}</span>
                    )}
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    className={styles.historyRemove}
                    aria-label="Remove from history"
                    onClick={(event) => handleRemoveHistory(event, entry.username)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        handleRemoveHistory(event, entry.username);
                      }
                    }}
                  >
                    <FiX />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!showHistory && status === 'loading' && (
        <div className={styles.panelSection}>
          <Loader />
        </div>
      )}

      {!showHistory && status === 'failed' && (
        <div className={styles.panelSection}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      )}

      {!showHistory && status === 'succeeded' && (
        <div className={styles.panelSection}>
          {results.length === 0 ? (
            <p className={styles.placeholder}>No users found.</p>
          ) : (
            <ul className={styles.resultsList}>
              {results.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className={styles.resultItem}
                    onClick={() => handleResultClick(user)}
                  >
                    <Avatar
                      src={user.avatarUrl || null}
                      fallback={(user.fullName || user.username).slice(0, 2).toUpperCase()}
                      alt={`${user.username} avatar`}
                      size="sm"
                    />
                    <div className={styles.resultMeta}>
                      <span className={styles.resultUsername}>{user.username}</span>
                      {user.fullName && (
                        <span className={styles.resultFullName}>{user.fullName}</span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
