import { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { findOrCreateConversationByUsername } from '@/store/slices/messengerSlice';
import { searchUsers, clearSearch } from '@/store/slices/searchSlice';
import { Avatar, Input, Button, Loader } from '@/components';
import formatShortTimeAgo from '@/utils/time';
import styles from './ConversationList.module.css';

const ConversationList = ({ currentUser, conversations, activeConversationId, onSelectConversation, onNewGroup }) => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const searchState = useSelector((state) => state.search);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 1) {
      dispatch(searchUsers({ query }));
    } else {
      dispatch(clearSearch());
    }
  };

  const handleSelectSearchResult = (username) => {
    dispatch(findOrCreateConversationByUsername(username));
    setSearchQuery('');
    dispatch(clearSearch());
  };

  const renderContent = () => {
    if (searchQuery.trim().length > 1) {
      return (
        <div className={styles.searchResults}>
          {searchState.status === 'loading' && <Loader />}
          {searchState.status === 'succeeded' && searchState.results.map(user => (
            <div key={user.id} className={styles.conversation} onClick={() => handleSelectSearchResult(user.username)}>
              <Avatar src={user.avatarUrl} fallback={user.username.charAt(0).toUpperCase()} size="md" />
              <div className={styles.details}>
                <div className={styles.name}>{user.username}</div>
                <div className={styles.lastMessage}>{user.fullName}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return conversations.items.map((conv) => {
      const otherUser = conv.isGroup ? null : conv.participants.find(p => p.id !== currentUser.id);
      const name = conv.isGroup ? conv.name : otherUser?.username;
           
      const avatarUrl = conv.isGroup ? conv.avatarUrl : otherUser?.avatarUrl;

      const lastMessageText = conv.lastMessage ? `${conv.lastMessage.sender.username === currentUser.username ? "You: " : ""}${conv.lastMessage.content}` : 'No messages yet';
      const timestamp = conv.lastMessage ? `· ${formatShortTimeAgo(conv.lastMessage.createdAt)}` : '';

      return (
        <div
          key={conv.id}
          className={`${styles.conversation} ${conv.id === activeConversationId ? styles.active : ''}`}
          onClick={() => onSelectConversation(conv.id)}
        >
          <Avatar src={avatarUrl} fallback={name?.charAt(0).toUpperCase()} size="md" />
          <div className={styles.details}>
            <div className={styles.name}>{name}</div>
            <div className={styles.lastMessage}>
              <span>{lastMessageText}</span>
              <span className={styles.timestamp}>{timestamp}</span>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>{currentUser.username}</h3>
      </div>
      <div className={styles.controls}>
          <Input 
            placeholder="Search for a user..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <Button onClick={onNewGroup}>New Group</Button>
      </div>
      <div className={styles.conversationList}>
        {conversations.status === 'loading' && <Loader />}
        {renderContent()}
      </div>
    </div>
  );
};

ConversationList.propTypes = {
  currentUser: PropTypes.object.isRequired,
  conversations: PropTypes.object.isRequired,
  activeConversationId: PropTypes.string,
  onSelectConversation: PropTypes.func.isRequired,
  onNewGroup: PropTypes.func.isRequired,
};

export default ConversationList;