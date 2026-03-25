import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { RoleBadges } from "@/components/dashboard/RoleBadges";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { DashboardPanels } from "@/components/dashboard/DashboardPanels";
import { fetchDashboardStats } from "@/store/slices/dashboardSlice";

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { roles, isAdmin, isManager } = useUserRole(user?.id);
  const { stats } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats(user?.id));
  }, [dispatch, user?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your projects.
        </p>
        <RoleBadges roles={roles} />
      </div>

      <StatsGrid stats={stats} isAdmin={isAdmin} isManager={isManager} />
      <DashboardPanels />
    </div>
  );
}
