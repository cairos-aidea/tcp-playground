import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { COLUMN_INFOS } from "./constants";

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
    { label: "Aidea Fee", value: net_aidea_fee, bg: "bg-gray-200" },
    // { label: "Direct Cost", value: direct_cost, bg: "bg-gray-200" },
    { label: "Total Manpower Budget", value: manpower_budget, bg: "bg-gray-200" },
    {
      label: "Consumed Budget",
      value: consumed,
      bg: "bg-gray-200",
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
      bg: remainingBudget >= 0 ? "bg-gray-200" : "bg-red-100",
      type: "remaining",
    },
    {
      label: "Plan Cost",
      value: plan,
      bg: "bg-gray-200",
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
      bg: isTrendingUp ? "bg-green-100" : "bg-red-200",
      isProfit: isTrendingUp,
      showTrend: true,
    },
    {
      label: isTrendingUp ? "Current Profitability" : "Current Loss Rate",
      value: profitability,
      bg: isTrendingUp ? "bg-gray-200" : "bg-red-100",
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
          <div
            key={item.label}
            className="flex flex-col justify-between h-full w-full min-w-0 bg-white border border-gray-200 rounded-lg px-4 py-2 relative"
            style={{ flex: 1, maxHeight: "70px", height: "70px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between text-[12px] font-medium text-gray-600">
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
                  <AlertCircle
                    size={13}
                    className="text-gray-400 cursor-pointer"
                  />
                  <div
                    className="absolute z-10 left-5 top-0 hidden group-hover:block bg-white border border-gray-200 rounded shadow-lg p-2 w-64 text-xs text-gray-700"
                    style={{
                      right: "auto",
                      left: "1.25rem",
                      transform: "none",
                      maxWidth: "16rem",
                    }}
                    onMouseEnter={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const overflowRight = rect.right > window.innerWidth;
                      const overflowLeft = rect.left < 0;
                      if (overflowRight) {
                        e.currentTarget.style.left = "auto";
                        e.currentTarget.style.right = "1.25rem";
                      } else if (overflowLeft) {
                        e.currentTarget.style.left = "0";
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.left = "1.25rem";
                      e.currentTarget.style.right = "auto";
                    }}
                  >
                    <div className="font-semibold mb-1">Computation</div>
                    <div className="mb-2">{info.formula}</div>
                    <div className="font-semibold mb-1">Description</div>
                    <div>{info.description}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Value & Subtext */}
            <div className="flex flex-col items-start justify-center flex-1">
              <div
                className={`text-xl font-bold truncate ${item.type === "remaining"
                  ? isPositive
                    ? "text-green-700"
                    : "text-red-700"
                  : "text-gray-900"
                  }`}
              >
                {item.isPercentage
                  ? `${typeof item.value === "number" ? item.value.toFixed(2) : item.value}%`
                  : `₱${typeof item.value === "number"
                    ? item.value.toLocaleString()
                    : item.value}`}
              </div>
              {item.subtext && (
                <div className="text-[10px] text-gray-500 leading-tight">
                  {item.subtext}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};