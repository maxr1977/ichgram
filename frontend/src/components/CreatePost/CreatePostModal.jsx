import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FiUploadCloud, FiTrash2, FiSmile, FiX } from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";
import { useDispatch, useSelector } from "react-redux";
import { createPost } from "@/store/slices/postSlice.js";
import { Button, Avatar } from "@/components";
import styles from "./CreatePostModal.module.css";

const MAX_CAPTION = 200;

const generateId = () => (
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
);
const mapInitialMedia = (mediaList) => (
  Array.isArray(mediaList)
    ? mediaList.map((media) => ({
        id: media.id ?? media._id ?? generateId(),
        preview: media.url,
        existing: true,
        file: null,
      }))
    : []
);

const CreatePostModal = ({
  isOpen,
  onClose,
  user,
  mode = "create",
  initialCaption = "",
  initialMedia,
  onSubmit,
  title,
  submitLabel,
  isSubmitting = false,
}) => {
  const dispatch = useDispatch();
  const { createStatus, createError } = useSelector((state) => state.posts);

  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [localError, setLocalError] = useState("");

  const isEditMode = mode === "edit";

  useEffect(() => {
    if (!isOpen) {
      setEmojiOpen(false);
      setLocalError("");
      return;
    }
    setCaption(initialCaption ?? "");
    setFiles(mapInitialMedia(initialMedia));
  }, [initialCaption, initialMedia, isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(
    () => () => {
      files.forEach((item) => {
        if (!item.existing && item.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });
    },
    [files],
  );

  const handleFiles = (fileList) => {
    if (!fileList?.length) return;
    const incoming = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (!incoming.length) {
      setLocalError("Please select image files.");
      return;
    }

    const mapped = incoming.map((file) => ({
      id: `${file.name}-${file.lastModified}-${generateId()}`,
      file,
      preview: URL.createObjectURL(file),
      existing: false,
    }));

    setFiles((prev) => [...prev, ...mapped]);
    setLocalError("");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer?.files?.length) {
      handleFiles(event.dataTransfer.files);
    }
  };

  const handleFileInput = (event) => {
    if (event.target.files?.length) {
      handleFiles(event.target.files);
      event.target.value = "";
    }
  };

  const handleRemove = (id) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const mainPreview = useMemo(() => files[0]?.preview ?? null, [files]);

  const handleCaptionChange = (event) => {
    const value = event.target.value.slice(0, MAX_CAPTION);
    setCaption(value);
  };

  const handleEmojiClick = ({ emoji }) => {
    setCaption((prev) => (prev + emoji).slice(0, MAX_CAPTION));
  };

  const isBusy = isEditMode ? isSubmitting : createStatus === "loading";
  const submitText = submitLabel ?? (isEditMode ? (isSubmitting ? "Saving..." : "Save") : createStatus === "loading" ? "Sharing..." : "Share");
  const heading = title ?? (isEditMode ? "Edit post" : "Create new post");
  const errorMessage = localError || (isEditMode ? "" : createError);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const keepMediaIds = files.filter((item) => item.existing).map((item) => item.id);
    const newImages = files.filter((item) => !item.existing).map((item) => item.file);

    if (!keepMediaIds.length && !newImages.length) {
      setLocalError("Please add at least one image.");
      return;
    }

    if (isEditMode && onSubmit) {
      try {
        await onSubmit({ caption, keepMediaIds, images: newImages });
        setEmojiOpen(false);
        setLocalError("");
        onClose();
      } catch (error) {
        setLocalError(error?.message ?? "Failed to save post");
      }
      return;
    }

    const result = await dispatch(createPost({
      caption,
      images: newImages,
    }));

    if (createPost.fulfilled.match(result)) {
      setFiles([]);
      setCaption("");
      setEmojiOpen(false);
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const initials = (user?.fullName || user?.username || "IG").slice(0, 2).toUpperCase();
  const hasMedia = files.length > 0;

  return createPortal(
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <FiX />
          </button>
          <h2>{heading}</h2>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={!hasMedia || isBusy}
          >
            {submitText}
          </Button>
        </header>
        <div className={styles.body}>
          <section
            className={classNames(styles.leftPane, { [styles.empty]: !hasMedia })}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            {mainPreview ? (
              <img src={mainPreview} alt="Post preview" className={styles.mainImage} />
            ) : (
              <label className={styles.dropZone} htmlFor="create-post-upload">
                <FiUploadCloud className={styles.uploadIcon} />
                <span>Drag photos here or click to upload</span>
                <input
                  id="create-post-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInput}
                  disabled={isBusy}
                />
              </label>
            )}
            {files.length > 1 && (
              <div className={styles.thumbnailStrip}>
                {files.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={classNames(styles.thumbnail, {
                      [styles.thumbnailActive]: files[0]?.id === item.id,
                    })}
                    onClick={() => {
                      setFiles((prev) => {
                        const next = [...prev];
                        const index = next.findIndex((thumb) => thumb.id === item.id);
                        if (index > 0) {
                          const [selected] = next.splice(index, 1);
                          next.unshift(selected);
                        }
                        return next;
                      });
                    }}
                  >
                    <img src={item.preview} alt="thumbnail" />
                    <span
                      className={styles.removeThumb}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemove(item.id);
                      }}
                    >
                      <FiTrash2 />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
          <aside className={styles.rightPane}>
            <div className={styles.userRow}>
              <Avatar
                src={user?.avatarUrl || null}
                alt={user?.fullName ?? user?.username ?? "Profile"}
                size="sm"
                fallback={initials}
              />
              <span className={styles.username}>{user?.username ?? "you"}</span>
            </div>
            <textarea
              className={styles.captionInput}
              placeholder="Write a caption..."
              value={caption}
              onChange={handleCaptionChange}
              maxLength={MAX_CAPTION}
              disabled={isBusy}
            />
            <div className={styles.captionFooter}>
              <button
                type="button"
                className={styles.emojiButton}
                onClick={() => setEmojiOpen((prev) => !prev)}
                disabled={isBusy}
              >
                <FiSmile />
              </button>
              <span className={styles.counter}>{`${caption.length}/${MAX_CAPTION}`}</span>
            </div>
            {emojiOpen && (
              <div className={styles.emojiPicker}>
                <EmojiPicker onEmojiClick={handleEmojiClick} width="100%" height={320} />
              </div>
            )}
            {errorMessage && <p className={styles.error}>{errorMessage}</p>}
            <label className={styles.addMore} htmlFor="create-post-upload-more">
              Add more photos
              <input
                id="create-post-upload-more"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                disabled={isBusy}
              />
            </label>
          </aside>
        </div>
      </div>
    </div>,
    document.body,
  );
};

CreatePostModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    username: PropTypes.string,
    fullName: PropTypes.string,
    avatarUrl: PropTypes.string,
  }),
  mode: PropTypes.oneOf(['create', 'edit']),
  initialCaption: PropTypes.string,
  initialMedia: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      url: PropTypes.string,
    }),
  ),
  onSubmit: PropTypes.func,
  title: PropTypes.string,
  submitLabel: PropTypes.string,
  isSubmitting: PropTypes.bool,
};

CreatePostModal.defaultProps = {
  isOpen: false,
  user: null,
  mode: 'create',
  initialCaption: '',
  initialMedia: [],
  onSubmit: null,
  title: null,
  submitLabel: null,
  isSubmitting: false,
};

export default CreatePostModal;
