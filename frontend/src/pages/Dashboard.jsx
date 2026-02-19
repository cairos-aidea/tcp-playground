import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { useAppData } from "../context/AppDataContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertCircle,
  TrendingUp,
  CalendarDays,
  Plus
} from "lucide-react";

const Dashboard = () => {
  const { auth_user, fetchTimeCharges } = useAppData();

  const [loading, setLoading] = useState(true);
  const [timeCharges, setTimeCharges] = useState([]);

  // Current Month/Year for display and fetching
  const currentConfig = useMemo(() => {
    const now = moment();
    return {
      year: now.year(),
      month: now.month() + 1,
      monthName: now.format("MMMM"),
      fullDate: now.format("dddd, MMMM D, YYYY")
    };
  }, []);

  useEffect(() => {
    document.title = "Dashboard | Aidea Time Charging";

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch for current month
        const data = await fetchTimeCharges(currentConfig.year, currentConfig.month);
        if (Array.isArray(data)) {
          setTimeCharges(data);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    if (auth_user) {
      loadData();
    }
  }, [auth_user, currentConfig.year, currentConfig.month, fetchTimeCharges]);

  // Messages based on time
  const greeting = useMemo(() => {
    const hour = moment().hour();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Stats Calculation
  const stats = useMemo(() => {
    if (!timeCharges || timeCharges.length === 0) {
      return {
        totalHours: 0,
        approvedHours: 0,
        pendingHours: 0,
        billableHours: 0,
        utilization: 0
      };
    }

    let total = 0;
    let approved = 0;
    let pending = 0;
    let billable = 0;

    timeCharges.forEach(tc => {
      const duration = Number(tc.duration_hrs || 0) + (Number(tc.duration_min || 0) / 60);
      total += duration;

      const status = (tc.status || "").toLowerCase();
      if (status === "approved") approved += duration;
      if (status === "pending") pending += duration;

      // Assuming billable logic or just counting external projects as a proxy if 'billable' field missing
      // In Calendar.jsx I saw 'billable' usage, but maybe not guaranteed.
      // Let's check typical fields. 'time_charge_type' 1 is external.
      if (tc.time_charge_type === 1) billable += duration;
    });

    const utilization = total > 0 ? Math.round((billable / total) * 100) : 0;

    return {
      totalHours: total.toFixed(1),
      approvedHours: approved.toFixed(1),
      pendingHours: pending.toFixed(1),
      billableHours: billable.toFixed(1),
      utilization
    };
  }, [timeCharges]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {greeting}, {auth_user?.first_name || "User"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full border border-border/50">
            <CalendarDays size={16} />
            <span>{currentConfig.fullDate}</span>
          </div>
          <Link to="/calendar">
            <Button className="gap-2">
              <Plus size={16} />
              Log Time
            </Button>
          </Link>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* Total Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              logged in {currentConfig.monthName}
            </p>
          </CardContent>
        </Card>

        {/* Pending Approval */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{stats.pendingHours}h</div>
            <p className="text-xs text-muted-foreground">
              awaiting approval
            </p>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{stats.approvedHours}h</div>
            <p className="text-xs text-muted-foreground">
              confirmed hours
            </p>
          </CardContent>
        </Card>

        {/* Utilization */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.utilization}%</div>
            <p className="text-xs text-muted-foreground">
              billable ratio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* RECENT ACTIVITY PLACEHOLDER OR CHART */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <p className="text-sm text-muted-foreground">Monthly charging distribution.</p>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground/40 text-sm border-dashed border-2 border-muted/50 rounded-md tracking-widest uppercase bg-muted/10">
              <TrendingUp className="mr-2 h-4 w-4" />
              Chart Visualization
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Latest time entries.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeCharges.slice(0, 5).map((tc, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{tc.project_label || tc.activity || "No Project"}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{Number(tc.duration_hrs)}h {Number(tc.duration_min) > 0 ? `${tc.duration_min}m` : ""}</span>
                        <span>•</span>
                        <span>{moment(tc.start_time).format('MMM D')}</span>
                      </div>
                    </div>
                    <div className="font-medium">
                      {/* Minimalist Status Dot */}
                      <div className={`w-2.5 h-2.5 rounded-full ${tc.status === 'approved' ? 'bg-emerald-500/80' :
                        tc.status === 'pending' ? 'bg-yellow-500/80' : 'bg-zinc-300'
                        }`} title={tc.status} />
                    </div>
                  </div>
                  {i < timeCharges.slice(0, 5).length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
              {timeCharges.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8 italic">No recent activity found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default Dashboard;