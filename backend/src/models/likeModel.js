import mongoose, { Schema } from 'mongoose';
import Post from './postModel.js';
import Comment from './commentModel.js';

const LikeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      index: true,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

LikeSchema.index({ user: 1, post: 1 }, { unique: true, partialFilterExpression: { post: { $type: 'objectId' } } });
LikeSchema.index({ user: 1, comment: 1 }, { unique: true, partialFilterExpression: { comment: { $type: 'objectId' } } });

LikeSchema.pre('save', function ensureTarget(next) {
  if (!this.post && !this.comment) {
    next(new Error('Like must reference post or comment'));
  } else if (this.post && this.comment) {
    next(new Error('Like cannot reference both post and comment'));
  } else {
    this.wasNew = this.isNew;
    next();
  }
});

LikeSchema.post('save', async function incrementCounters(doc, next) {
  try {
    if (!this.wasNew) {
      return next();
    }

    if (doc.post) {
      await Post.updateOne({ _id: doc.post }, { $inc: { likesCount: 1 } });
    } else if (doc.comment) {
      await Comment.updateOne({ _id: doc.comment }, { $inc: { likesCount: 1 } });
    }
    next();
  } catch (error) {
    next(error);
  }
});

LikeSchema.post('deleteOne', { document: true }, async function decrementCounters() {
  try {
    if (this.post) {
      await Post.updateOne({ _id: this.post }, { $inc: { likesCount: -1 } });
    } else if (this.comment) {
      await Comment.updateOne({ _id: this.comment }, { $inc: { likesCount: -1 } });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to decrement like counters', error);
  }
});

const Like = mongoose.model('Like', LikeSchema);

export default Like;

