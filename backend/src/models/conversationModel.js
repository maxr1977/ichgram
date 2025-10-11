import mongoose, { Schema } from 'mongoose';

const ConversationSchema = new Schema(
  {
    name: {
      type: String,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    avatarUrl: {
      type: String,
    },
    avatarKey: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

ConversationSchema.set('toJSON', {
  transform: (doc, ret) => {
    const result = { ...ret };
    delete result.__v;
    return result;
  },
});

const Conversation = mongoose.model('Conversation', ConversationSchema);

export default Conversation;