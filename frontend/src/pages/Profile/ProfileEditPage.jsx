import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import { Avatar, Loader } from '@/components';
import apiClient from '@/services/apiClient.js';
import { updateProfileDetails } from '@/store/slices/profileSlice.js';
import styles from './ProfileEditPage.module.css';

const MAX_BIO = 150;

const ProfileEditPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const authUser = useSelector((state) => state.auth.user);
  const updateStatus = useSelector((state) => state.profile.updateStatus);
  const updateError = useSelector((state) => state.profile.updateError);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [website, setWebsite] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/users/me');
        if (!isMounted) return;
        const user = response.data?.data?.user ?? authUser;
        setUsername(user?.username ?? '');
        setFullName(user?.fullName ?? '');
        setWebsite(user?.website ?? '');
        setBio(user?.bio ?? '');
        setAvatarUrl(user?.avatarUrl ?? null);
        setLoadError(null);
      } catch (error) {
        if (!isMounted) return;
        const message = error.response?.data?.message ?? 'Failed to load profile';
        setLoadError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => () => {
    if (avatarUrl && avatarUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarUrl);
    }
  }, [avatarUrl]);

  const currentAvatar = useMemo(() => avatarUrl, [avatarUrl]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (avatarUrl && avatarUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarUrl);
    }
    setAvatarFile(file);
    const preview = URL.createObjectURL(file);
    setAvatarUrl(preview);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedFullName = fullName.trim();
    const trimmedWebsite = website.trim();
    const normalizedWebsite = trimmedWebsite
      ? (/^https?:\/\//i.test(trimmedWebsite) ? trimmedWebsite : `https://${trimmedWebsite}`)
      : undefined;

    try {
      const updatedUser = await dispatch(
        updateProfileDetails({
          username: trimmedUsername,
          fullName: trimmedFullName || undefined,
          website: normalizedWebsite,
          bio,
          avatarFile,
        }),
      ).unwrap();
      navigate(`/profile/${updatedUser.username}`);
    } catch (error) {
    }
  };

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.centered}>
          <Loader />
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className={styles.page}>
        <div className={styles.centered}>
          <p className={styles.error}>{loadError}</p>
        </div>
      </main>
    );
  }

  const initials = (fullName || username || 'IG').slice(0, 2).toUpperCase();
  const isSubmitting = updateStatus === 'loading';

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1>Edit profile</h1>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <section className={styles.summary}>
            <Avatar
              src={currentAvatar}
              fallback={initials}
              alt={`${username} avatar`}
              size="xl"
              style={{ width: 96, height: 96, fontSize: 28 }}
            />
            <div className={styles.summaryInfo}>
              <span className={styles.summaryUsername}>{username}</span>
              {fullName && <span className={styles.summaryFullName}>{fullName}</span>}
              {bio && <p className={styles.summaryBio}>{bio}</p>}
            </div>
            <button
              type="button"
              className={styles.photoButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              New photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
          </section>

          <label className={styles.field}>
            <span className={styles.label}>Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Website</span>
            <input
              type="text"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              disabled={isSubmitting}
              placeholder="https://example.com"
            />
          </label>

          <label className={classNames(styles.field, styles.aboutField)}>
            <span className={styles.labelRow}>
              <span>About</span>
              <span className={styles.counter}>{`${bio.length}/${MAX_BIO}`}</span>
            </span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value.slice(0, MAX_BIO))}
              maxLength={MAX_BIO}
              disabled={isSubmitting}
              rows={4}
              placeholder="Tell people about yourself"
            />
          </label>

          {updateError && <p className={styles.submitError}>{updateError}</p>}

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default ProfileEditPage;
