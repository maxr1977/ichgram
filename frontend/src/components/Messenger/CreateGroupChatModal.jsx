import { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { createConversation } from '@/store/slices/messengerSlice';
import UserSearch from './UserSearch';
import { Modal, Input, Button } from '@/components';
import styles from './CreateGroupChatModal.module.css';

const CreateGroupChatModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedUsers.length > 0) {
      const participantIds = selectedUsers.map(u => u.id);
      dispatch(createConversation({ name: groupName, participants: participantIds, isGroup: true }));
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className={styles.container}>
        <h2>Create Group Chat</h2>
        <Input
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <UserSearch onUsersSelected={setSelectedUsers} />
        <Button onClick={handleCreateGroup} disabled={!groupName.trim() || selectedUsers.length === 0}>
          Create
        </Button>
      </div>
    </Modal>
  );
};

CreateGroupChatModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default CreateGroupChatModal;