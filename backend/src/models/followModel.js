import mongoose, { Schema } from 'mongoose';
import User from './userModel.js';
import { createNotification } from '../services/notificationService.js';

const FollowSchema = new Schema(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

FollowSchema.pre('save', function preventSelfFollow(next) {
  if (this.follower.equals(this.following)) {
    next(new Error('Cannot follow yourself'));
  } else {
    next();
  }
});

FollowSchema.post('save', async function incrementCounters(doc, next) {
  try {
    await User.updateOne(
      { _id: doc.follower },
      { $inc: { followingCount: 1 } },
    );
    await User.updateOne(
      { _id: doc.following },
      { $inc: { followersCount: 1 } },
    );

    await createNotification({
      userId: doc.following,
      actorId: doc.follower,
      type: 'follow',
      entityId: doc.follower,
      entityType: 'User',
    });
    next();
  } catch (error) {
    next(error);
  }
});

FollowSchema.post('deleteOne', { document: true }, async function decrementCounters() {
  try {
    await User.updateOne(
      { _id: this.follower },
      { $inc: { followingCount: -1 } },
    );
    await User.updateOne(
      { _id: this.following },
      { $inc: { followersCount: -1 } },
    );
  } catch (error) {
    console.error('Failed to decrement follow counters', error);
  }
});

FollowSchema.statics.follow = async function followUser(followerId, followingId) {
  if (followerId.equals(followingId)) {
    throw new Error('Cannot follow yourself');
  }

  const followDoc = await this.findOne({ follower: followerId, following: followingId });
  if (followDoc) {
    return followDoc;
  }

  return this.create({ follower: followerId, following: followingId });
};

FollowSchema.statics.unfollow = async function unfollowUser(followerId, followingId) {
  const followDoc = await this.findOne({ follower: followerId, following: followingId });
  if (!followDoc) {
    return null;
  }
  await followDoc.deleteOne();
  return followDoc;
};

const Follow = mongoose.model('Follow', FollowSchema);

export default Follow;
