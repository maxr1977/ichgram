import { useState } from 'react';
import PropTypes from 'prop-types';
import { FiSmile } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import styles from './MessageInput.module.css';

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      setShowPicker(false);
    }
  };
  
  const onEmojiClick = (emojiObject) => {
    setMessage(prev => prev + emojiObject.emoji);
  };

  return (
    <div className={styles.wrapper}>
      {showPicker && 
        <div className={styles.emojiPicker}>
            <EmojiPicker onEmojiClick={onEmojiClick} pickerStyle={{ width: '100%' }} />
        </div>
      }
      <form className={styles.messageInput} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Write a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="button" className={styles.emojiButton} onClick={() => setShowPicker(!showPicker)}>
          <FiSmile />
        </button>
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

MessageInput.propTypes = {
    onSendMessage: PropTypes.func.isRequired,
};

export default MessageInput;