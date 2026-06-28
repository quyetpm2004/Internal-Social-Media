import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import AuthLayout from "@/components/layout/user/AuthLayout";
import MainLayout from "@/components/layout/user/MainLayout";
import LoginPage from "@/features/auth/pages/LoginPage";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import NotFoundPage from "@/features/not-found/pages/NotFoundPage";
import NewFeedPage from "@/features/new-feed/pages/NewFeedPage";
import SavedPostsPage from "@/features/new-feed/pages/SavedPostsPage";
import GroupListPage from "@/features/group/pages/GroupListPage";
import GroupDetailLayout from "@/features/group/pages/GroupDetailLayout";
import GroupFeedPage from "@/features/group/pages/GroupFeedPage";
import { GroupMembersPage } from "@/features/group/pages/GroupMembersPage";
import { GroupMembersLayout } from "@/features/group/pages/GroupMembersLayout";
import { GroupJoinRequestsPage } from "@/features/group/pages/GroupJoinRequestsPage";

import PostDetailPage from "@/features/new-feed/pages/PostDetailPage";
import PostDetailInGroupPage from "@/features/group/pages/PostDetailInGroupPage";
import GroupSettingPage from "@/features/group/pages/GroupSettingPage";
import { GroupPostReviewPage } from "@/features/group/pages/GroupPostReviewPage";
import GroupMediaPage from "@/features/group/pages/GroupMediaPage";
import GroupFilesPage from "@/features/group/pages/GroupFilesPage";
import SearchPage from "@/features/search/pages/SearchPage";
import ChatLayout from "@/features/chat/pages/ChatLayout";
import ChatEmptyPage from "@/features/chat/pages/ChatEmptyPage";
import ChatConversationPage from "@/features/chat/pages/ChatConversationPage";
import AdminRoute from "@/components/common/AdminRoute";
import AdminLayout from "@/components/layout/admin/AdminLayout";
import AdminDashboardPage from "@/features/admin/pages/AdminDashboardPage";
import AdminUsersPage from "@/features/admin/pages/AdminUsersPage";
import AdminPostsPage from "@/features/admin/pages/AdminPostsPage";
import AdminPendingPostsPage from "@/features/admin/pages/AdminPendingPostsPage";
import AdminCommentsPage from "@/features/admin/pages/AdminCommentsPage";
import AdminPostDetailPage from "@/features/admin/pages/AdminPostDetailPage";
import AdminGroupsPage from "@/features/admin/pages/AdminGroupsPage";
import AdminGroupDetailPage from "@/features/admin/pages/AdminGroupDetailPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/reset-password/:token",
        element: <ResetPasswordPage />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: "/",
            element: <Navigate to="/news-feed" replace />,
          },
          {
            path: "/profile/:userId",
            element: <ProfilePage />,
          },
          {
            path: "/news-feed",
            element: <NewFeedPage />,
          },
          {
            path: "/news-feed/:postId",
            element: <PostDetailPage />,
          },
          {
            path: "/stats",
            element: <SavedPostsPage />,
          },
          {
            path: "/search",
            element: <SearchPage />,
          },
          {
            path: "/messages",
            element: <ChatLayout />,
            children: [
              {
                index: true,
                element: <ChatEmptyPage />,
              },
              {
                path: ":conversationId",
                element: <ChatConversationPage />,
              },
            ],
          },
          {
            path: "/groups",
            element: <GroupListPage />,
          },
          {
            path: "/groups/:groupId",
            element: <GroupDetailLayout />,
            children: [
              {
                index: true,
                element: <GroupFeedPage />,
              },

              {
                path: "members",
                element: <GroupMembersLayout />,
                children: [
                  {
                    index: true,
                    element: <GroupMembersPage />,
                  },
                  {
                    path: "requests",
                    element: <GroupJoinRequestsPage />,
                  },
                ],
              },

              {
                path: "posts/:postId",
                element: <PostDetailInGroupPage />,
              },

              {
                path: "media",
                element: <GroupMediaPage />,
              },

              {
                path: "files",
                element: <GroupFilesPage />,
              },

              {
                path: "setting",
                element: <GroupSettingPage />,
              },

              {
                path: "review",
                element: <GroupPostReviewPage />,
              },
            ],
          },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            path: "/admin",
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: "users", element: <AdminUsersPage /> },
              { path: "posts", element: <AdminPostsPage /> },
              { path: "pending-posts", element: <AdminPendingPostsPage /> },
              { path: "comments", element: <AdminCommentsPage /> },
              { path: "posts/:postId", element: <AdminPostDetailPage /> },
              { path: "groups", element: <AdminGroupsPage /> },
              { path: "groups/:groupId", element: <AdminGroupDetailPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
