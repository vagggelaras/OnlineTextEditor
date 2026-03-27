import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useDocumentStore } from "@/stores/documentStore";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, checkAuth } = useAuthStore();
  const { fetchAll } = useDocumentStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch documents/folders once user is authenticated
  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user, fetchAll]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
