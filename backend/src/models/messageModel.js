import mongoose, { Schema } from 'mongoose';
import Conversation from './conversationModel.js';

const MessageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'MediaAsset',
      },
    ],
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deliveredTo: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  },
);

MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });

MessageSchema.pre('save', function markNew(next) {
  this.wasNew = this.isNew;
  next();
});

MessageSchema.post('save', async function updateConversation(doc, next) {
  try {
    if (this.wasNew) {
      await Conversation.updateOne(
        { _id: doc.conversation },
        { lastMessage: doc._id, updatedAt: new Date() },
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Message = mongoose.model('Message', MessageSchema);

export default Message;
