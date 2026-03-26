import React, { useEffect, useState, useCallback } from "react";
import AdminLayout from "../AdminLayout/AdminLayout";
import "./AdminDashboard.scss";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

const fmt = (n) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtNum = (n) =>
  n == null ? "—" : new Intl.NumberFormat("en-IN").format(n);

const fetchJSON = async (url) => {
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

// ─── Chart Colors ──────────────────────────────────────────────────────────────

const BRAND = "#4e221c";
const BRAND_LIGHT = "#c98b30";
const ONLINE_CLR = "#4e221c";
const OFFLINE_CLR = "#c98b30";
const GREEN = "#2d7a4f";
const RED = "#c0392b";
const BLUE = "#1a5fa8";
const AMBER = "#92600a";

const PIE_COLORS = [BRAND, BRAND_LIGHT, GREEN, BLUE, AMBER, RED, "#6b5535"];

const STATUS_COLOR = {
  pending: AMBER,
  processing: BLUE,
  confirmed: "#0f766e",
  shipped: "#3730a3",
  delivered: GREEN,
  cancelled: RED,
  returned: "#6b7280",
};

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ad-tooltip">
      <div className="ad-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="ad-tooltip__row">
          <span className="ad-tooltip__dot" style={{ background: p.color }} />
          <span className="ad-tooltip__name">{p.name}:</span>
          <span className="ad-tooltip__val">
            {p.name?.toLowerCase().includes("revenue") || p.name?.toLowerCase().includes("value")
              ? fmt(p.value)
              : fmtNum(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── KPI Card ──────────────────────────────────────────────────────────────────

const KpiCard = ({ title, value, meta, accent, loading }) => (
  <div className={`ad-kpi ad-kpi--${accent}`}>
    <div className="ad-kpi__title">{title}</div>
    <div className="ad-kpi__value">{loading ? <span className="ad-kpi__skel" /> : value}</div>
    <div className="ad-kpi__meta">{meta}</div>
  </div>
);

// ─── Section Card ──────────────────────────────────────────────────────────────

const Card = ({ title, children, className = "" }) => (
  <div className={`ad-card ${className}`}>
    <div className="ad-card__title">{title}</div>
    <div className="ad-card__body">{children}</div>
  </div>
);

// ─── Empty State ───────────────────────────────────────────────────────────────

const Empty = ({ text = "No data" }) => (
  <div className="ad-empty">{text}</div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [tab, setTab] = useState("online");   // online | offline | both
  const [range, setRange] = useState("7d");       // today | 7d | 30d | 90d | all

  const [kpis, setKpis] = useState(null);
  const [statusData, setStatusData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [payMethods, setPayMethods] = useState([]);

  const [loading, setLoading] = useState(true);

  // ── Fetch all data ────────────────────────────────────────────────────────

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const qs = `?range=${range}&orderType=${tab}`;
      const qsBoth = `?range=${range}&orderType=all`;

      const isAll = tab === "both";
      const mainQs = isAll ? qsBoth : qs;

      const [k, s, r, t, l, rv, pm] = await Promise.all([
        fetchJSON(`${BASE}/admin/dashboard/kpis${mainQs}`),
        fetchJSON(`${BASE}/admin/dashboard/orders-by-status${mainQs}`),
        fetchJSON(`${BASE}/admin/dashboard/revenue-over-time${mainQs}`),
        fetchJSON(`${BASE}/admin/dashboard/top-products${mainQs}`),
        fetchJSON(`${BASE}/admin/dashboard/low-stock`),
        fetchJSON(`${BASE}/admin/dashboard/reviews`),
        fetchJSON(`${BASE}/admin/dashboard/payment-methods${mainQs}`),
      ]);

      // Only fetch comparison when on "both" tab
      let comp = null;
      if (isAll) {
        comp = await fetchJSON(`${BASE}/admin/dashboard/comparison?range=${range}`);
      }

      setKpis(k);
      setStatusData(Array.isArray(s) ? s : []);
      setRevenueData(Array.isArray(r) ? r : []);
      setTopProducts(Array.isArray(t) ? t : []);
      setLowStock(Array.isArray(l) ? l : []);
      setReviews(Array.isArray(rv) ? rv : []);
      setComparison(comp);
      setPayMethods(Array.isArray(pm) ? pm : []);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, [tab, range]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // ── KPI config per tab ────────────────────────────────────────────────────

  const kpiCards = kpis
    ? [
      { title: "Total Revenue", value: fmt(kpis.totalRevenue), meta: "In selected period", accent: "brand" },
      { title: "Total Orders", value: fmtNum(kpis.totalOrders), meta: "In selected period", accent: "blue" },
      { title: "New Users", value: fmtNum(kpis.newUsers), meta: "Signups in period", accent: "green" },
      { title: "Avg Order Value", value: fmt(kpis.aov), meta: "Per order average", accent: "amber" },
      { title: "Pending Payments", value: fmtNum(kpis.pendingPayments), meta: "Awaiting payment", accent: "red" },
      { title: "Low Stock SKUs", value: fmtNum(kpis.lowStock), meta: "Stock ≤ threshold", accent: "warn" },
    ]
    : [];

  // ── Status bar chart data ─────────────────────────────────────────────────

  const statusChartData = statusData.map((s) => ({
    name: s._id,
    count: s.count,
    fill: STATUS_COLOR[s._id] || BRAND,
  }));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="admin-dashboard">

        {/* ── TOP BAR ── */}
        <div className="ad-topbar">
          <div className="ad-topbar__left">
            <h1 className="ad-topbar__title">Dashboard</h1>
          </div>

          <div className="ad-topbar__right">
            {/* Range Selector */}
            <div className="ad-range-tabs">
              {["today", "7d", "30d", "90d", "all"].map((r) => (
                <button
                  key={r}
                  className={`ad-range-tab ${range === r ? "active" : ""}`}
                  onClick={() => setRange(r)}
                >
                  {r === "today" ? "Today"
                    : r === "7d" ? "7 Days"
                      : r === "30d" ? "30 Days"
                        : r === "90d" ? "90 Days"
                          : "All Time"}
                </button>
              ))}
            </div>

            <button
              className="ad-refresh-btn"
              onClick={loadDashboard}
              disabled={loading}
              title="Refresh"
            >
              <span className={loading ? "ad-spin" : ""}>↻</span>
            </button>
          </div>
        </div>

        {/* ── SOURCE TABS ── */}
        <div className="ad-source-tabs">
          {[
            { key: "online", label: "🌐 Online" },
            { key: "offline", label: "🏪 Offline" },
            { key: "both", label: "⚡ Both" },
          ].map((t) => (
            <button
              key={t.key}
              className={`ad-source-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
          <div
            className="ad-source-indicator"
            style={{
              left: tab === "online" ? "0%"
                : tab === "offline" ? "33.33%"
                  : "66.66%",
              width: "33.33%",
            }}
          />
        </div>

        {/* ── BOTH TAB: Comparison Cards ── */}
        {tab === "both" && comparison && (
          <div className="ad-comparison">
            {["online", "offline"].map((type) => {
              const d = comparison[type];
              if (!d) return null;
              return (
                <div key={type} className={`ad-compare-card ad-compare-card--${type}`}>
                  <div className="ad-compare-card__label">
                    {type === "online" ? "🌐 Online" : "🏪 Offline"}
                  </div>
                  <div className="ad-compare-card__grid">
                    <div className="ad-compare-item">
                      <span>Revenue</span>
                      <strong>{fmt(d.totalRevenue)}</strong>
                    </div>
                    <div className="ad-compare-item">
                      <span>Orders</span>
                      <strong>{fmtNum(d.totalOrders)}</strong>
                    </div>
                    <div className="ad-compare-item">
                      <span>AOV</span>
                      <strong>{fmt(d.avgOrderValue)}</strong>
                    </div>
                    <div className="ad-compare-item">
                      <span>Items Sold</span>
                      <strong>{fmtNum(d.totalItems)}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── KPI CARDS ── */}
        <div className="ad-kpi-row">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <KpiCard key={i} loading title="—" value="" meta="" accent="brand" />
            ))
            : kpiCards.map((k, i) => (
              <KpiCard key={i} {...k} />
            ))}
        </div>

        {/* ── CHARTS ROW 1: Revenue + Status ── */}
        <div className="ad-row ad-row--2col">

          {/* Revenue Over Time */}
          <Card title="Revenue Over Time" className="ad-card--revenue">
            {revenueData.length === 0 ? (
              <Empty text="No revenue data for this period" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                {tab === "both" ? (
                  <BarChart data={revenueData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ede8df" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#a08060" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#a08060" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} />
                    <Bar dataKey="online" name="Online Revenue" fill={ONLINE_CLR} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="offline" name="Offline Revenue" fill={OFFLINE_CLR} radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ede8df" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#a08060" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#a08060" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey={tab === "offline" ? "offline" : "online"}
                      name="Revenue"
                      stroke={BRAND}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: BRAND, strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </Card>

          {/* Orders by Status */}
          <Card title="Orders by Status">
            {statusChartData.length === 0 ? (
              <Empty text="No order data" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={statusChartData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ede8df" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#a08060" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "#6b5535", fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Orders" radius={[0, 4, 4, 0]}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* ── CHARTS ROW 2: Top Products + Payment Methods ── */}
        <div className="ad-row ad-row--2col">

          {/* Top Products */}
          <Card title="Top Selling Products">
            {topProducts.length === 0 ? (
              <Empty text="No sales in this period" />
            ) : (
              <div className="ad-top-products">
                {topProducts.map((p, i) => {
                  const maxQty = topProducts[0]?.totalQuantity || 1;
                  const pct = Math.round((p.totalQuantity / maxQty) * 100);
                  return (
                    <div key={p._id || i} className="ad-top-item">
                      <div className="ad-top-item__rank">#{i + 1}</div>
                      <div className="ad-top-item__info">
                        <div className="ad-top-item__name">{p.productName || p._id}</div>
                        <div className="ad-top-item__bar-wrap">
                          <div className="ad-top-item__bar" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="ad-top-item__stats">
                        <span className="ad-top-item__qty">{fmtNum(p.totalQuantity)} sold</span>
                        <span className="ad-top-item__rev">{fmt(p.totalRevenue)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Payment Methods Pie */}
          <Card title="Payment Methods">
            {payMethods.length === 0 ? (
              <Empty text="No payment data" />
            ) : (
              <div className="ad-pie-wrap">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={payMethods}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {payMethods.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [fmtNum(val), name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="ad-pie-legend">
                  {payMethods.map((m, i) => (
                    <div key={i} className="ad-pie-legend__item">
                      <span
                        className="ad-pie-legend__dot"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="ad-pie-legend__label">
                        {m._id || "Unknown"}
                      </span>
                      <span className="ad-pie-legend__val">{fmtNum(m.count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ── BOTTOM ROW: Low Stock + Reviews ── */}
        <div className="ad-row ad-row--2col">

          {/* Low Stock */}
          <Card title="Low Stock Items">
            {lowStock.length === 0 ? (
              <Empty text="✅ All stock levels are healthy" />
            ) : (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Color</th>
                      <th>Stock</th>
                      <th>Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((it) => (
                      <tr key={it.inventoryId || it._id}>
                        <td>
                          <div className="ad-table-name">{it.productName}</div>
                          <div className="ad-table-sub">{it.modelName || "Default"}</div>
                        </td>
                        <td>{it.colorName || "—"}</td>
                        <td>
                          <span className={`ad-stock-badge ${it.stock === 0 ? "ad-stock-badge--empty" : "ad-stock-badge--low"}`}>
                            {it.stock}
                          </span>
                        </td>
                        <td className="ad-table-muted">{it.threshold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Recent Reviews */}
          <Card title="Recent Reviews">
            {reviews.length === 0 ? (
              <Empty text="No reviews yet" />
            ) : (
              <div className="ad-reviews">
                {reviews.slice(0, 8).map((r) => (
                  <div key={r.reviewId || r._id} className="ad-review">
                    <div className="ad-review__top">
                      <div className="ad-review__user">{r.userName}</div>
                      <div className="ad-review__rating">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < r.rating ? "ad-star ad-star--on" : "ad-star"}>★</span>
                        ))}
                      </div>
                    </div>
                    <div className="ad-review__product">{r.productName}</div>
                    {r.reviewText && (
                      <div className="ad-review__text">"{r.reviewText}"</div>
                    )}
                    <div className="ad-review__date">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </AdminLayout>
  );
}