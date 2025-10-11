import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MainLayout } from '@/components';
import CreatePostModal from '@/components/CreatePost/CreatePostModal.jsx';
import SearchPanel from '@/components/Layout/SearchPanel.jsx';
import ToastProvider from '@/components/Toast/ToastProvider.jsx';
import NotificationsPanel from '@/components/Layout/NotificationsPanel.jsx';
import PostModal from '@/components/Post/PostModal.jsx'; 
import { LayoutProvider } from '@/context/LayoutContext.js';
import { connectSocket, disconnectSocket } from '@/services/socketClient.js';
import {
  resetNotificationsState,
  fetchNotifications,
  markAllNotificationsRead,
  selectNotificationsState,
} from '@/store/slices/notificationsSlice.js';
import { 
    fetchPostById, 
    togglePostLike, 
    followAuthor, 
    removeFeedPost 
} from '@/store/slices/postSlice.js';
import { 
    removeProfilePost, 
    upsertProfilePost 
} from '@/store/slices/profileSlice.js';

const AppLayout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const notificationsState = useSelector(selectNotificationsState);

    const [activePanel, setActivePanel] = useState(null);
    const [isCreateOpen, setCreateOpen] = useState(false);

    const [activePostId, setActivePostId] = useState(null);
    const [followPending, setFollowPending] = useState(() => new Set());
    
    const activePost = useSelector(state => {
        if (!activePostId) return null;
        const postInFeed = state.posts.feed.entities[activePostId];
        if (postInFeed) return postInFeed;
        const postInExplore = state.posts.explore.entities[activePostId];
        if (postInExplore) return postInExplore;
        const postInProfile = state.profile.posts.items.find(p => p.id === activePostId);
        if (postInProfile) return postInProfile;
        return null; 
    });

    const openPostModal = useCallback((postId) => {
        dispatch(fetchPostById({ postId })); 
        setActivePostId(postId);
    }, [dispatch]);

    const closePostModal = useCallback(() => {
        setActivePostId(null);
    }, []);

    const handleToggleLike = useCallback((postId) => {
        dispatch(togglePostLike({ postId }));
    }, [dispatch]);

    const handleFollow = useCallback((userId) => {
        setFollowPending(prev => new Set(prev).add(userId));
        dispatch(followAuthor({ userId }))
            .unwrap()
            .catch(() => {})
            .finally(() => {
                setFollowPending(prev => {
                    const next = new Set(prev);
                    next.delete(userId);
                    return next;
                });
            });
    }, [dispatch]);

    const handlePostDeleted = useCallback((postId) => {
        dispatch(removeFeedPost({ postId }));
        dispatch(removeProfilePost(postId));
        closePostModal();
    }, [dispatch, closePostModal]);

    const handlePostUpdated = useCallback((post) => {
        dispatch(upsertProfilePost(post)); 
        dispatch(fetchPostById({ postId: post.id })); 
    }, [dispatch]);

    const location = useLocation();
    const activeKey = useMemo(() => {
        if (location.pathname.startsWith('/explore')) return 'explore';
        if (location.pathname.startsWith('/messenger')) return 'messages';
        if (location.pathname.startsWith('/profile')) return 'profile';
        return 'home';
    }, [location.pathname]);

    const closePanel = useCallback(() => setActivePanel(null), []);
    const openPanel = useCallback((panelKey) => {
        setCreateOpen(false);
        setActivePanel((prev) => (prev === panelKey ? null : panelKey));
    }, []);
    const handleCreate = useCallback(() => {
        setActivePanel(null);
        setCreateOpen(true);
    }, []);
    const handleNavigate = useCallback((path) => navigate(path), [navigate]);

    const renderPanel = useCallback((panel) => {
        if (panel === 'search') return <SearchPanel />;
        if (panel === 'notifications') return <NotificationsPanel />;
        return null;
    }, []);

    const contextValue = useMemo(() => ({
        openPanel,
        closePanel,
        openCreateModal: handleCreate,
        closeCreateModal: () => setCreateOpen(false),
        openPostModal, 
    }), [openPanel, closePanel, handleCreate, openPostModal]);

    const overlayActive = Boolean(activePanel); 

    useEffect(() => {
        if (!user?.id) {
          dispatch(resetNotificationsState());
        }
    }, [dispatch, user?.id]);
    
    const previousPanelRef = useRef(null);
    useEffect(() => {
        if (activePanel === 'notifications' && user?.id) {
          dispatch(fetchNotifications({ page: 1 }));
        }
        const previousPanel = previousPanelRef.current;
        if (
          previousPanel === 'notifications'
          && activePanel !== 'notifications'
          && user?.id
        ) {
          dispatch(markAllNotificationsRead());
        }
        previousPanelRef.current = activePanel;
    }, [activePanel, dispatch, user?.id]);

    useEffect(() => {
        if (!user?.id) {
          disconnectSocket();
          return;
        }
    
        const socket = connectSocket();
        const userId = user.id;
    
        const handleConnect = () => {
          socket.emit('auth:join', userId);
        };
    
        socket.on('connect', handleConnect);
        if (socket.connected) {
          handleConnect();
        }
    
        const handleNotification = () => {
          dispatch(fetchNotifications({ page: 1 }));
        };
    
        socket.on('notification:new', handleNotification);
    
        return () => {
          socket.off('connect', handleConnect);
          socket.off('notification:new', handleNotification);
        };
    }, [user?.id]);

    return (
        <LayoutProvider value={contextValue}>
            <MainLayout
                activeKey={activeKey}
                onNavigate={handleNavigate}
                onOpenPanel={openPanel}
                onClosePanel={closePanel}
                onCreate={handleCreate}
                isOverlayActive={overlayActive}
                panel={activePanel}
                renderPanel={renderPanel}
                user={user}
                notificationsUnread={notificationsState.unreadCount}
            >
                <Outlet />
            </MainLayout>

            <CreatePostModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} user={user} />
            
            <PostModal
                isOpen={!!activePostId}
                onClose={closePostModal}
                post={activePost}
                onToggleLike={handleToggleLike}
                onFollow={handleFollow}
                isFollowPending={activePost?.author?.id ? followPending.has(activePost.author.id) : false}
                onPostDeleted={handlePostDeleted}
                onPostUpdated={handlePostUpdated}
            />
            
            <ToastProvider />
        </LayoutProvider>
    );
};

export default AppLayout;