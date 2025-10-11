import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout.jsx';
import HomePage from '@/pages/Home/HomePage.jsx';
import LoginPage from '@/pages/Auth/LoginPage.jsx';
import RegisterPage from '@/pages/Auth/RegisterPage.jsx';
import ForgotPasswordPage from '@/pages/Auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from '@/pages/Auth/ResetPasswordPage.jsx';
import ExplorePage from '@/pages/Explore/ExplorePage.jsx';
import ProfilePage from '@/pages/Profile/ProfilePage.jsx';
import ProfileEditPage from '@/pages/Profile/ProfileEditPage.jsx';
import MessengerPage from '@/pages/Messenger/MessengerPage.jsx';
import NotFoundPage from '@/pages/NotFound/NotFoundPage.jsx';
import LearnMorePage from '@/pages/Info/LearnMorePage.jsx';
import TermsPage from '@/pages/Info/TermsPage.jsx';
import PrivacyPolicyPage from '@/pages/Info/PrivacyPolicyPage.jsx';
import CookiesPolicyPage from '@/pages/Info/CookiesPolicyPage.jsx';
import PrivateRoute from './PrivateRoute.jsx';

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    <Route path="/learn-more" element={<LearnMorePage />} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="/privacy" element={<PrivacyPolicyPage />} />
    <Route path="/cookies" element={<CookiesPolicyPage />} />

    <Route
      element={(
        <PrivateRoute>
          <AppLayout />
        </PrivateRoute>
      )}
    >
      <Route index element={<HomePage />} />
      <Route path="explore" element={<ExplorePage />} />
      <Route path="profile/edit" element={<ProfileEditPage />} />
      <Route path="profile/:username" element={<ProfilePage />} />
      <Route path="messenger" element={<MessengerPage />} />
      <Route path="home" element={<Navigate to="/" replace />} />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default AppRoutes;

