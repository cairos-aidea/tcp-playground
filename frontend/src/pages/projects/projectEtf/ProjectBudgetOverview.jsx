import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { COLUMN_INFOS } from "./constants";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ProjectBudgetOverview = ({
  budgetRes,
  consumedBudget,
  planCost,
  isProjectLoading,
}) => {
  if (isProjectLoading) {
    return null;
  }
  if (!budgetRes) {
    return (
      <div className="text-sm text-gray-500 italic flex gap-2">
        {/* <AlertCircle size={18} className="text-gray-400" />
        No budget data available. */}
      </div>
    );
  }

  // Destructure safely
  const {
    manpower_budget = 0,
    direct_cost = 0,
    net_aidea_fee = 0,
    budget_allocation = {},
  } = budgetRes;

  const targetProfitability =
    budget_allocation && budget_allocation.target_profitability != null
      ? Number(budget_allocation.target_profitability)
      : 0;

  const consumed =
    typeof consumedBudget === "number" ? consumedBudget : 4776968.13;
  const plan = typeof planCost === "number" ? planCost : 500000;
  const remainingBudget = manpower_budget - consumed;
  // G: Current Profits / Loss = E - (B + D + F)
  const currentProfit = net_aidea_fee - (consumed + plan);
  // H: Current Profitability = G / E
  const profitability = net_aidea_fee
    ? (currentProfit / net_aidea_fee) * 100
    : 0;

  // Trending logic based on targetProfitability
  const isTrendingUp = profitability >= targetProfitability;

  // Define columns for the new layout
  const budgetColumns = [
    { label: "Aidea Fee", value: net_aidea_fee, bg: "bg-gray-50 from-gray-50 to-white" },
    // { label: "Direct Cost", value: direct_cost, bg: "bg-gray-200" },
    { label: "Total Manpower Budget", value: manpower_budget, bg: "bg-gray-50" },
    {
      label: "Consumed Budget",
      value: consumed,
      bg: "bg-gray-50",
      subtext: `Up to ${(() => {
        const now = new Date();
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return prevMonth.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
      })()}`,
    },
    {
      label: "Remaining Budget",
      value: remainingBudget,
      bg: remainingBudget >= 0 ? "bg-gray-50" : "bg-red-50 border-red-200",
      type: "remaining",
    },
    {
      label: "Plan Cost",
      value: plan,
      bg: "bg-gray-50",
      subtext: `From ${(() => {
        const now = new Date();
        return now.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
      })()}`,
    },
    {
      label: isTrendingUp ? "Current Profit" : "Current Loss",
      value: currentProfit,
      bg: isTrendingUp ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200",
      isProfit: isTrendingUp,
      showTrend: true,
    },
    {
      label: isTrendingUp ? "Current Profitability" : "Current Loss Rate",
      value: profitability,
      bg: isTrendingUp ? "bg-gray-50" : "bg-red-50 border-red-200",
      isProfit: isTrendingUp,
      showTrend: false,
      // subtext: `${profitability.toFixed(2)}%`,
      isPercentage: true, // Add a flag to indicate percentage
    },
  ];

  // Info for each column
  const budgetInfos = COLUMN_INFOS;

  return (
    <div className="w-full flex flex-row h-full gap-2">
      {budgetColumns.map((item) => {
        const info = budgetInfos[item.label] || {};
        const isPositive = item.value >= 0;

        return (
          <Card
            key={item.label}
            className={`flex flex-col justify-between h-full min-w-0 shadow-sm rounded-md border ${item.bg}`}
            style={{ flex: 1, maxHeight: "70px", height: "70px" }}
          >
            <CardContent className="p-3 flex flex-col justify-between h-full relative">
              {/* Header */}
              <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  {item.label}

                  {/* Trend icon */}
                  {item.showTrend &&
                    (isPositive ? (
                      <TrendingUp size={14} className="text-green-600" />
                    ) : (
                      <TrendingDown size={14} className="text-red-600" />
                    ))}

                  {/* Info hover */}
                  <div className="relative group ml-1">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertCircle
                            size={12}
                            className="text-gray-400 cursor-pointer hover:text-primary transition-colors"
                          />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs text-xs p-3">
                          <div className="font-semibold mb-1">Computation</div>
                          <div className="mb-2 font-mono text-[10px] bg-muted/50 p-1 rounded">{info.formula}</div>
                          <div className="font-semibold mb-1">Description</div>
                          <div>{info.description}</div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              {/* Value & Subtext */}
              <div className="flex flex-col items-start justify-center flex-1 mt-0">
                <div
                  className={`text-lg font-bold truncate tracking-tight ${item.type === "remaining"
                    ? isPositive
                      ? "text-green-700"
                      : "text-red-700"
                    : "text-foreground"
                    }`}
                >
                  {item.isPercentage
                    ? `${typeof item.value === "number" ? item.value.toFixed(2) : item.value}%`
                    : `₱${typeof item.value === "number"
                      ? item.value.toLocaleString()
                      : item.value}`}
                </div>
                {item.subtext && (
                  <div className="text-[10px] text-muted-foreground leading-tight">
                    {item.subtext}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};