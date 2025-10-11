import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Avatar } from '@/components';
import styles from './MessageList.module.css';

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const MessageList = ({ messages, userId, participants }) => {
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const messagesByDate = messages.reduce((acc, msg) => {
    const date = formatDate(msg.createdAt);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(msg);
    return acc;
  }, {});

  const getSender = (senderId) => participants.find(p => p.id === senderId);

  return (
    <div className={styles.messageList}>
      {Object.entries(messagesByDate).map(([date, msgsForDate]) => (
        <div key={date}>
          <div className={styles.dateSeparator}>{date}</div>
          {msgsForDate.map((msg) => {
            const isSentByMe = msg.sender.id === userId;
            const sender = isSentByMe ? null : getSender(msg.sender.id);
            return (
              <div
                key={msg.id}
                className={`${styles.messageWrapper} ${isSentByMe ? styles.sent : styles.received}`}
              >
                {!isSentByMe && (
                   <Avatar src={sender?.avatarUrl} fallback={sender?.username.charAt(0).toUpperCase()} size="sm" className={styles.avatar} />
                )}
                <div className={styles.message}>
                  <div className={styles.bubble}>{msg.content}</div>
                  <div className={styles.timestamp}>{formatTime(msg.createdAt)}</div>
                </div>
                 {isSentByMe && (
                   <Avatar src={null} fallback="You" size="sm" className={styles.avatar} />
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

MessageList.propTypes = {
    messages: PropTypes.array.isRequired,
    userId: PropTypes.string.isRequired,
    participants: PropTypes.array,
};

MessageList.defaultProps = {
    participants: [],
}

export default MessageList;