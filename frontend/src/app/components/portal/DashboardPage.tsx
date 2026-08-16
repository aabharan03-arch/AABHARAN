import { motion } from 'motion/react';
import { Package, Star, MessageSquare, Eye, TrendingUp, TrendingDown, Bell, ChevronRight } from 'lucide-react';
import { Badge, Button } from '@figma/astraui';
import { PRODUCTS, ENQUIRIES, STORES } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router';

// ---------------------------------------------------------------------------
// Design tokens — jewellery-brand palette (ivory / deep navy / warm gold)
// ---------------------------------------------------------------------------
const T = {
  ivory: '#f9f7ee',
  ivoryShade: '#eeead9',
  navy: '#04091e',
  navySoft: '#1c2338',
  gold: '#c9a44c',
  goldSoft: '#e4d6ab',
  muted: '#6b6b5f',
};

const MONTHLY_ENQUIRIES = [
  { month: 'Jan', count: 8 }, { month: 'Feb', count: 12 }, { month: 'Mar', count: 15 },
  { month: 'Apr', count: 22 }, { month: 'May', count: 18 }, { month: 'Jun', count: 30 },
  { month: 'Jul', count: 25 },
];

const POPULAR_PRODUCTS = PRODUCTS.slice(0, 4).map(p => ({ name: p.name.split(' ').slice(0, 2).join(' '), views: p.views }));

export function DashboardPage() {
  const navigate = useNavigate();
  const store = STORES[0];
  const totalProducts = PRODUCTS.filter(p => p.storeId === '1').length;
  const featuredProducts = PRODUCTS.filter(p => p.storeId === '1' && p.featured).length;
  const totalEnquiries = ENQUIRIES.length;
  const newEnquiries = ENQUIRIES.filter(e => e.status === 'New').length;
  const totalViews = PRODUCTS.filter(p => p.storeId === '1').reduce((s, p) => s + p.views, 0);

  const KPI_CARDS = [
    { label: 'Total Products', value: totalProducts, icon: Package, delta: '+2 this month', positive: true },
    { label: 'Featured Products', value: featuredProducts, icon: Star, delta: 'Updated', positive: true },
    { label: 'Total Enquiries', value: totalEnquiries, icon: MessageSquare, delta: '+3 this week', positive: true },
    { label: 'New Enquiries', value: newEnquiries, icon: Bell, delta: 'Unread', positive: newEnquiries > 0, urgent: newEnquiries > 0 },
    { label: 'Product Views', value: totalViews, icon: Eye, delta: '+12% vs last week', positive: true },
    { label: 'Store Views', value: 847, icon: TrendingUp, delta: '+8% vs last week', positive: true },
  ];

  return (
    <div
      className="flex flex-col gap-2xl"
      style={{
        fontFamily: 'Inter, var(--font-family-sans)',
        backgroundColor: T.ivory,
        borderRadius: '20px',
        maxHeight: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
      }}
    >
      {/* Google Fonts import + global scrollbar hiding */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

        /* Hide scrollbars everywhere inside this dashboard (Chrome/Safari/Edge) */
        *::-webkit-scrollbar {
          display: none;
        }
        * {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }
      `}</style>

      {/* Sticky Header */}
      <div
        className="flex items-end justify-between"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backgroundColor: T.ivory,
          padding: '32px 32px 20px 32px',
          borderBottom: `1px solid ${T.ivoryShade}`,
        }}
      >
        <div>
          <p style={{ color: T.gold, fontSize: '11px', letterSpacing: '0.18em', fontWeight: 600, textTransform: 'uppercase' }}>
            {store?.name ?? 'Tanishq'} · Portal
          </p>
          <h1
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: '34px',
              fontWeight: 500,
              color: T.navy,
              marginTop: '0px',
              letterSpacing: '-0.01em',
            }}
          >
            Dashboard
          </h1>
          <div style={{ width: '46px', height: '2px', backgroundColor: T.gold, marginTop: '14px', marginBottom: '10px' }} />
          <p style={{ color: T.muted, fontSize: '13px' }}>Welcome back, Tanishq team · July 9, 2026</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/portal/products')}
          iconStart={<Package size={16} />}
          style={{ backgroundColor: T.navy, borderColor: T.navy }}
        >
          Add Product
        </Button>
      </div>

      {/* Scrollable content below header */}
      <div className="flex flex-col gap-2xl" style={{ padding: '0 32px 32px 32px' }}>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-xl">
          {KPI_CARDS.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px',
                  border: `1px solid ${kpi.urgent ? T.gold : T.ivoryShade}`,
                  boxShadow: kpi.urgent ? `0 0 0 1px ${T.goldSoft}` : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {kpi.urgent && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: T.gold }} />
                )}
                <div className="flex items-start justify-between mb-lg">
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: kpi.urgent ? T.navy : T.ivory,
                    }}
                  >
                    <Icon size={17} color={kpi.urgent ? T.gold : T.navy} strokeWidth={1.75} />
                  </div>
                  {kpi.urgent && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: T.navy,
                        backgroundColor: T.goldSoft,
                        padding: '3px 8px',
                        borderRadius: '999px',
                      }}
                    >
                      Action needed
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: 'Fraunces, serif', fontSize: '30px', fontWeight: 500, color: T.navy, lineHeight: 1 }}>
                  {kpi.value}
                </p>
                <p style={{ color: T.muted, fontSize: '12.5px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: T.gold }}>—</span> {kpi.label}
                </p>
                <div className="flex items-center gap-xs" style={{ marginTop: '10px' }}>
                  {kpi.positive ? (
                    <TrendingUp size={12} color="#3f7a5c" />
                  ) : (
                    <TrendingDown size={12} color="#b0473f" />
                  )}
                  <span style={{ fontSize: '11.5px', fontWeight: 500, color: kpi.positive ? '#3f7a5c' : '#b0473f' }}>
                    {kpi.delta}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
          {/* Monthly Enquiries */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '22px', border: `1px solid ${T.ivoryShade}` }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '17px', fontWeight: 500, color: T.navy, marginBottom: '20px' }}>
              Monthly Enquiries
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MONTHLY_ENQUIRIES} barSize={26}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.ivoryShade} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: T.muted, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: T.muted, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 10, border: `1px solid ${T.ivoryShade}`, color: T.navy }}
                  cursor={{ fill: T.ivory }}
                />
                <Bar dataKey="count" fill={T.navy} radius={[4, 4, 0, 0]} name="Enquiries" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Popular Products */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '22px', border: `1px solid ${T.ivoryShade}` }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '17px', fontWeight: 500, color: T.navy, marginBottom: '20px' }}>
              Most Viewed Products
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={POPULAR_PRODUCTS} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.ivoryShade} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: T.muted, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.muted, fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 10, border: `1px solid ${T.ivoryShade}`, color: T.navy }}
                  cursor={{ fill: T.ivory }}
                />
                <Bar dataKey="views" fill={T.gold} radius={[0, 4, 4, 0]} name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Enquiries */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '22px', border: `1px solid ${T.ivoryShade}` }}>
          <div className="flex items-center justify-between mb-xl">
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '17px', fontWeight: 500, color: T.navy }}>
              Recent Enquiries
            </h2>
            <Button
              variant="neutral"
              size="small"
              onClick={() => navigate('/portal/enquiries')}
              iconEnd={<ChevronRight size={14} />}
              style={{ color: T.navy }}
            >
              View All
            </Button>
          </div>
          <div className="flex flex-col gap-md">
            {ENQUIRIES.slice(0, 4).map(enq => (
              <div
                key={enq.id}
                className="flex items-center justify-between gap-md"
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.ivory)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div className="flex items-center gap-lg min-w-0">
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: T.navy,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontFamily: 'Fraunces, serif', fontSize: '14px', fontWeight: 500, color: T.gold }}>
                      {enq.customerName[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontSize: '13.5px', fontWeight: 500, color: T.navy }} className="truncate">
                      {enq.customerName}
                    </p>
                    <p style={{ fontSize: '12px', color: T.muted }} className="truncate">
                      {enq.productName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-lg flex-shrink-0">
                  <span style={{ fontSize: '12px', color: T.muted }} className="hidden md:block">
                    {enq.date}
                  </span>
                  <Badge
                    label={enq.status}
                    variant={enq.status === 'New' ? 'brand' : enq.status === 'In Progress' ? 'warning' : enq.status === 'Contacted' ? 'success' : 'default'}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}