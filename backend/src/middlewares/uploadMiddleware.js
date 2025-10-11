import multer from 'multer';

const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed'));
  } else {
    cb(null, true);
  }
};

const createUploader = (limits) =>
  multer({
    storage,
    limits,
    fileFilter: imageFileFilter,
  });

export const uploadSingleImage = createUploader({
  fileSize: 5 * 1024 * 1024,
}).single('avatar');

export const uploadPostImages = createUploader({
  fileSize: 10 * 1024 * 1024,
  files: 10,
}).array('images', 10);

export const uploadMessageImages = createUploader({
  fileSize: 10 * 1024 * 1024,
  files: 10,
}).array('files', 10);
