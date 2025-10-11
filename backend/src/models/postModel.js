import mongoose, { Schema } from 'mongoose';
import User from './userModel.js';

const PostSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    caption: {
      type: String,
      default: '',
      maxlength: 2200,
    },
    media: [
      {
        type: Schema.Types.ObjectId,
        ref: 'MediaAsset',
        required: true,
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

PostSchema.index({ createdAt: -1 });

PostSchema.pre('save', function markNew(next) {
  this.wasNew = this.isNew;
  next();
});

PostSchema.post('save', async function incrementAuthorCount(doc, next) {
  try {
    if (this.wasNew) {
      await User.updateOne({ _id: doc.author }, { $inc: { postsCount: 1 } });
    }
    next();
  } catch (error) {
    next(error);
  }
});

PostSchema.post(
  'deleteOne',
  { document: true, query: false },
  async function decrementAuthorCount(doc, next) {
    try {
      const authorId = doc?.author ?? this.author;
      if (authorId) {
        await User.updateOne({ _id: authorId }, { $inc: { postsCount: -1 } });
      }
      next();
    } catch (error) {
      next(error);
    }
  },
);

const Post = mongoose.model('Post', PostSchema);

export default Post;
