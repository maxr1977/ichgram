import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getSocket } from '@/services/socketClient';
import { addMessage, setTyping, updateConversation } from '@/store/slices/messengerSlice';

const useMessengerSocket = (activeConversationId) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (message) => {
      dispatch(addMessage(message));
    };

    const handleTyping = ({ conversationId, isTyping }) => {
      dispatch(setTyping({ conversationId, isTyping }));
    };

    const handleConversationUpdate = (conversation) => {
        dispatch(updateConversation(conversation));
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing:start', (data) => handleTyping({ ...data, isTyping: true }));
    socket.on('typing:stop', (data) => handleTyping({ ...data, isTyping: false }));
    socket.on('conversation:update', handleConversationUpdate);

    if (activeConversationId) {
      socket.emit('conversation:join', { conversationId: activeConversationId });
    }

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('conversation:update', handleConversationUpdate);
      if (activeConversationId) {
        socket.emit('conversation:leave', { conversationId: activeConversationId });
      }
    };
  }, [activeConversationId, dispatch]);
};

export default useMessengerSocket;