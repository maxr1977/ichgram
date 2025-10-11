import mongoose, { Schema } from 'mongoose';
import Post from './postModel.js';

const CommentSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

CommentSchema.index({ post: 1, createdAt: -1 });

CommentSchema.pre('save', function markNew(next) {
  this.wasNew = this.isNew;
  next();
});

CommentSchema.post('save', async function incrementPostCount(doc, next) {
  try {
    if (this.wasNew) {
      await Post.updateOne({ _id: doc.post }, { $inc: { commentsCount: 1 } });
    }
    next();
  } catch (error) {
    next(error);
  }
});

CommentSchema.post('deleteOne', { document: true }, async function decrementPostCount(next) {
  try {
    await Post.updateOne({ _id: this.post }, { $inc: { commentsCount: -1 } });
    next();
  } catch (error) {
    next(error);
  }
});

const Comment = mongoose.model('Comment', CommentSchema);

export default Comment;

