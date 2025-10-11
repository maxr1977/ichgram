import { useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateGroupAvatar } from '@/store/slices/messengerSlice';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Avatar, Button, Loader } from '@/components';
import styles from './ChatWindow.module.css';

const ChatWindow = ({ conversation, messages, userId, onSendMessage, status, onOpenParticipants, onOpenAddUserModal }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const avatarFileRef = useRef(null);

  if (status === 'loading') {
    return <div className={styles.centered}><Loader /></div>;
  }

  if (!conversation) {
    return <div className={styles.noChatSelected}>Select a conversation to start messaging</div>;
  }
  
  const isCurrentUserAdmin = conversation.isGroup && conversation.admins.includes(userId);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file && conversation.id) {
        dispatch(updateGroupAvatar({ conversationId: conversation.id, avatarFile: file }));
    }
  };

  const otherUser = conversation.isGroup ? null : conversation.participants.find(p => p.id !== userId);
  const chatName = conversation.isGroup ? conversation.name : otherUser?.username;
  const avatarUrl = conversation.isGroup ? conversation.avatarUrl : otherUser?.avatarUrl;
  
  const profileInfo = conversation.isGroup 
    ? { name: `${conversation.participants.length} members` } 
    : { name: otherUser?.fullName, username: otherUser?.username };

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatHeader}>
        <div className={styles.headerInfo}>
          <Avatar src={avatarUrl} size="sm" fallback={chatName?.charAt(0).toUpperCase()} />
          <span>{chatName}</span>
        </div>
        
        {isCurrentUserAdmin && (
            <Button variant="secondary" onClick={onOpenAddUserModal}>Add User</Button>
        )}
      </div>

      <div className={styles.messageArea}>
        <div className={styles.profileSection}>
            <label className={isCurrentUserAdmin ? styles.clickableAvatar : ''}>
                <Avatar 
                    src={avatarUrl} 
                    size="xl" 
                    fallback={chatName?.charAt(0).toUpperCase()} 
                />
                {isCurrentUserAdmin && (
                    <input 
                        type="file"
                        ref={avatarFileRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleAvatarChange}
                    />
                )}
            </label>
            <div className={styles.profileName}>{profileInfo.username || chatName}</div>
            
            {conversation.isGroup ? (
                <button className={styles.profileMetaButton} onClick={onOpenParticipants}>
                    {profileInfo.name}
                </button>
            ) : (
                <div className={styles.profileFullName}>{profileInfo.name}</div>
            )}
            
            {!conversation.isGroup && (
                <Button variant="secondary" onClick={() => navigate(`/profile/${otherUser.username}`)}>
                    View Profile
                </Button>
            )}
        </div>
        <MessageList messages={messages} userId={userId} participants={conversation.participants} />
      </div>

      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
};

ChatWindow.propTypes = {
  conversation: PropTypes.object,
  messages: PropTypes.array,
  userId: PropTypes.string.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  status: PropTypes.string,
  onOpenParticipants: PropTypes.func.isRequired,
  onOpenAddUserModal: PropTypes.func.isRequired, 
};

export default ChatWindow;