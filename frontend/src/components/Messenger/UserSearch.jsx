import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import apiClient from '@/services/apiClient';
import { Input } from '@/components';
import styles from './UserSearch.module.css';

const UserSearch = ({ onUsersSelected }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    onUsersSelected(selected);
  }, [selected, onUsersSelected]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const search = async () => {
      const response = await apiClient.get('/search/users', { params: { q: query } });
      setResults(response.data.data.items);
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (user) => {
    if (!selected.find(u => u.id === user.id)) {
      setSelected([...selected, user]);
    }
    setQuery('');
    setResults([]);
  };

  const handleRemove = (userId) => {
    setSelected(selected.filter(u => u.id !== userId));
  };

  return (
    <div>
      <Input
        placeholder="Search for users to add"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className={styles.results}>
        {results.map(user => (
          <div key={user.id} className={styles.resultItem} onClick={() => handleSelect(user)}>
            {user.username}
          </div>
        ))}
      </div>
      <div className={styles.selected}>
        {selected.map(user => (
          <div key={user.id} className={styles.selectedItem}>
            {user.username} <button onClick={() => handleRemove(user.id)}>x</button>
          </div>
        ))}
      </div>
    </div>
  );
};

UserSearch.propTypes = {
    onUsersSelected: PropTypes.func.isRequired,
};

export default UserSearch;