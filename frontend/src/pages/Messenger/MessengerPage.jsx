import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  fetchConversations,
  setActiveConversation,
  sendMessage,
  findOrCreateConversationByUsername,
  fetchMessages,
} from '@/store/slices/messengerSlice';
import useMessengerSocket from '@/hooks/useMessengerSocket';
import ConversationList from '@/components/Messenger/ConversationList';
import CreateGroupChatModal from '@/components/Messenger/CreateGroupChatModal';
import AddUserToGroupModal from '@/components/Messenger/AddUserToGroupModal';
import ChatWindow from '@/components/Messenger/ChatWindow';
import { UserListModal, Button } from '@/components';
import styles from './MessengerPage.module.css';

const MessengerPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isCreateGroupOpen, setCreateGroupOpen] = useState(false);
  const [isParticipantsOpen, setParticipantsOpen] = useState(false);
  const [isAddUserOpen, setAddUserOpen] = useState(false); 
  
  const { conversations, messagesByConversation, activeConversationId } = useSelector((state) => state.messenger);
  const { user: currentUser } = useSelector((state) => state.auth);

  useMessengerSocket(activeConversationId);

  const activeConversation = useMemo(() => {
    return conversations.items.find(c => c.id === activeConversationId);
  }, [conversations, activeConversationId]);

  useEffect(() => {
    dispatch(fetchConversations());
    const targetUser = searchParams.get('user');
    if (targetUser) {
      dispatch(findOrCreateConversationByUsername(targetUser));
      navigate('/messenger', { replace: true });
    }
  }, [dispatch, searchParams, navigate]);

  const handleSelectConversation = (conversationId) => {
    dispatch(setActiveConversation(conversationId));
    if (!messagesByConversation[conversationId] || messagesByConversation[conversationId].status !== 'succeeded') {
      dispatch(fetchMessages({ conversationId }));
    }
  };

  const handleSendMessage = (content) => {
    if (activeConversationId) {
      dispatch(sendMessage({ conversationId: activeConversationId, content }));
    }
  };
  
  const handleSelectUserFromModal = (user) => {
      setParticipantsOpen(false);
      navigate(`/profile/${user.username}`);
  };

  const activeMessages = (activeConversationId && messagesByConversation[activeConversationId]?.items) || [];
  const messagesStatus = (activeConversationId && messagesByConversation[activeConversationId]?.status) || 'idle';

  return (
    <>
      <div className={styles.messenger}>
        <ConversationList
            currentUser={currentUser}
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewGroup={() => setCreateGroupOpen(true)}
        />
        <ChatWindow 
            conversation={activeConversation}
            messages={activeMessages}
            status={messagesStatus}
            userId={currentUser.id}
            onSendMessage={handleSendMessage}
            onOpenParticipants={() => setParticipantsOpen(true)}
            onOpenAddUserModal={() => setAddUserOpen(true)} 
        />
      </div>
      <CreateGroupChatModal isOpen={isCreateGroupOpen} onClose={() => setCreateGroupOpen(false)} />
      {activeConversation && (
          <UserListModal
            title="Group Members"
            isOpen={isParticipantsOpen}
            onClose={() => setParticipantsOpen(false)}
            items={activeConversation.participants}
            status="succeeded"
            onSelectUser={handleSelectUserFromModal}
          />
      )}
      {activeConversationId && (
          <AddUserToGroupModal 
            isOpen={isAddUserOpen} 
            onClose={() => setAddUserOpen(false)}
            conversationId={activeConversationId}
          />
      )}
    </>
  );
};

export default MessengerPage;