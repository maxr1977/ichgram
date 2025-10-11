import mongoose, { Schema } from 'mongoose';

const MediaAssetSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
    },
    url: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    width: Number,
    height: Number,
  },
  {
    timestamps: true,
  },
);

MediaAssetSchema.set('toJSON', {
  transform: (doc, ret) => {
    const result = { ...ret };
    delete result.__v;
    return result;
  },
});

const MediaAsset = mongoose.model('MediaAsset', MediaAssetSchema);

export default MediaAsset;
