import mongoose, { Schema } from 'mongoose';

const NotificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'follow',
        'like_post',
        'comment_post',
        'like_comment',
        'new_post',
        'message',
      ],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      refPath: 'entityType',
    },
    entityType: {
      type: String,
      enum: ['User', 'Post', 'Comment', 'Message'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

NotificationSchema.index({ user: 1, createdAt: -1 });

NotificationSchema.set('toJSON', {
  transform: (doc, ret) => {
    const result = { ...ret };
    delete result.__v;
    return result;
  },
});

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
