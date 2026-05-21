import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import AuthLayout from "@/components/layout/AuthLayout";
import MainLayout from "@/components/layout/MainLayout";
import LoginPage from "@/features/auth/pages/LoginPage";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import NotFoundPage from "@/features/not-found/pages/NotFoundPage";
import NewFeedPage from "@/features/new-feed/pages/NewFeedPage";
import GroupListPage from "@/features/group/pages/GroupListPage";
import GroupDetailLayout from "@/features/group/pages/GroupDetailLayout";
import GroupFeedPage from "@/features/group/pages/GroupFeedPage";
import { GroupMembersPage } from "@/features/group/pages/GroupMembersPage";
import { GroupMembersLayout } from "@/features/group/pages/GroupMembersLayout";
import { GroupJoinRequestsPage } from "@/features/group/pages/GroupJoinRequestsPage";

import PostDetailPage from "@/features/new-feed/pages/PostDetailPage";
import PostDetailInGroupPage from "@/features/group/pages/PostDetailInGroupPage";
import GroupSettingPage from "@/features/group/pages/GroupSettingPage";
import SearchPage from "@/features/search/pages/SearchPage";

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
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
            path: "/search",
            element: <SearchPage />,
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
                path: "setting",
                element: <GroupSettingPage />,
              },
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
