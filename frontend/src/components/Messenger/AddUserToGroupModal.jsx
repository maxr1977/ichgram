import { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { addParticipantsToConversation } from '@/store/slices/messengerSlice';
import UserSearch from './UserSearch';
import { Modal, Button } from '@/components';
import styles from './AddUserToGroupModal.module.css';

const AddUserToGroupModal = ({ isOpen, onClose, conversationId }) => {
  const dispatch = useDispatch();
  const [selectedUsers, setSelectedUsers] = useState([]);

  const handleAddUsers = () => {
    if (selectedUsers.length > 0) {
      const participantIds = selectedUsers.map(u => u.id);
      dispatch(addParticipantsToConversation({ conversationId, participants: participantIds }));
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className={styles.container}>
        <h2>Add Users to Group</h2>
        <UserSearch onUsersSelected={setSelectedUsers} />
        <Button onClick={handleAddUsers} disabled={selectedUsers.length === 0}>
          Add Users
        </Button>
      </div>
    </Modal>
  );
};

AddUserToGroupModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    conversationId: PropTypes.string,
};

export default AddUserToGroupModal;