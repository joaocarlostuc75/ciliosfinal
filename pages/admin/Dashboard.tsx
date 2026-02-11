
import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockDb';
import { AppointmentStatus, OrderStatus } from '../../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    serviceRevenue: 0,
    productRevenue: 0,
    monthlyAppointments: 0,
    monthlyOrders: 0,
    averageTicket: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topItemsData, setTopItemsData] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  // Theme Colors
  const COLORS = ['#C5A059', '#1A1612', '#8E6E3E', '#94A3B8', '#FCD34D'];

  useEffect(() => {
    // Listen for theme changes to update charts
    const observer = new MutationObserver(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const fetchData = async () => {
        setLoading(true);
        try {
            const appts = await db.getAppointments();
            const services = await db.getServices();
            const orders = await db.getOrders();
            const products = await db.getProducts();

            const today = new Date();
            
            // Manual start of month calculation
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            monthStart.setHours(0, 0, 0, 0);
            
            // Manual end of month calculation
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            monthEnd.setHours(23, 59, 59, 999);

            // --- 1. Filter Current Month Data ---
            const monthAppts = appts.filter(a => isSameMonth(new Date(a.start_time), today));
            const monthOrders = orders.filter(o => isSameMonth(new Date(o.created_at), today));

            // --- 2. Calculate Metrics ---
            let serviceRev = 0;
            let productRev = 0;
            let completedApptsCount = 0;
            let completedOrdersCount = 0;
            const itemCounts: Record<string, number> = {};

            // Process Appointments
            monthAppts.forEach(a => {
                const service = services.find(s => s.id === a.service_id);
                const price = service ? service.price : 0;
                const serviceName = service ? service.name : 'Serviço desconhecido';

                if (a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.CONFIRMED) {
                    serviceRev += price;
                    completedApptsCount++;
                    itemCounts[serviceName] = (itemCounts[serviceName] || 0) + 1;
                }
            });

            // Process Orders
            monthOrders.forEach(o => {
                const product = products.find(p => p.id === o.product_id);
                const price = product ? product.price : 0; 
                const productName = product ? `(Prod) ${product.name}` : 'Produto desconhecido';

                if (o.status === OrderStatus.COMPLETED) {
                    productRev += price;
                    completedOrdersCount++;
                    itemCounts[productName] = (itemCounts[productName] || 0) + 1;
                }
            });

            const totalRevenue = serviceRev + productRev;
            const totalTransactions = completedApptsCount + completedOrdersCount;
            const ticket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

            setMetrics({
                totalRevenue,
                serviceRevenue: serviceRev,
                productRevenue: productRev,
                monthlyAppointments: completedApptsCount,
                monthlyOrders: completedOrdersCount,
                averageTicket: ticket,
            });

            // --- 3. Prepare Chart Data ---
            const chartEndDate = (today > monthEnd) ? monthEnd : today;
            const daysInMonth = eachDayOfInterval({ start: monthStart, end: chartEndDate });
            
            const chartData = daysInMonth.map(day => {
                const dayAppts = monthAppts.filter(a => 
                    isSameDay(new Date(a.start_time), day) && 
                    (a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.CONFIRMED)
                );
                const dayServiceRevenue = dayAppts.reduce((acc, curr) => {
                    const s = services.find(serv => serv.id === curr.service_id);
                    return acc + (s ? s.price : 0);
                }, 0);

                const dayOrders = monthOrders.filter(o => 
                    isSameDay(new Date(o.created_at), day) &&
                    o.status === OrderStatus.COMPLETED
                );
                const dayProductRevenue = dayOrders.reduce((acc, curr) => {
                    const p = products.find(prod => prod.id === curr.product_id);
                    return acc + (p ? p.price : 0);
                }, 0);

                return {
                    date: format(day, 'dd/MM'),
                    faturamento: dayServiceRevenue + dayProductRevenue,
                    servicos: dayServiceRevenue,
                    produtos: dayProductRevenue
                };
            });
            setRevenueData(chartData);

            // --- 4. Prepare Pie Chart Data ---
            const pieData = Object.entries(itemCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
            
            setTopItemsData(pieData);
        } catch (error) {
            console.error("Dashboard data load failed", error);
        } finally {
            setLoading(false);
        }
    };
    
    fetchData();
    return () => observer.disconnect();
  }, []);

  const StatCard = ({ title, value, subtext, icon, colorClass }: any) => (
    <div className="bg-white dark:bg-luxury-card p-6 rounded-2xl shadow-lg border border-gold-100 dark:border-luxury-border flex items-start justify-between hover:shadow-xl transition-all">
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">{title}</p>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-gold-900 dark:text-gold-500">{value}</h3>
            {subtext && <p className="text-xs mt-1 font-medium text-gray-400 dark:text-gray-500">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${colorClass}`}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
    </div>
  );

  if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gold-600">
            <span className="material-symbols-outlined text-4xl animate-spin mb-2">progress_activity</span>
            <p>Carregando indicadores...</p>
        </div>
      );
  }

  const axisColor = isDarkMode ? '#94A3B8' : '#9CA3AF';
  const gridColor = isDarkMode ? '#2A2E35' : '#f0f0f0';
  const tooltipBg = isDarkMode ? '#1A1D23' : '#FFFFFF';
  const tooltipBorder = isDarkMode ? '#2A2E35' : '#E5E7EB';

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h2 className="text-gray-500 dark:text-gray-400 font-sans text-sm">Resumo Mensal</h2>
            <p className="text-gold-900 dark:text-gold-500 font-serif text-2xl font-bold capitalize">
                {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
        </div>
        <div className="text-right hidden md:block">
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-200 dark:border-green-800">
                Sistema Operacional
            </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Receita Total" 
            value={`R$ ${metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
            subtext="Serviços + Produtos"
            icon="payments" 
            colorClass="bg-gradient-to-br from-gold-500 to-gold-700" 
        />
        <StatCard 
            title="Serviços Realizados" 
            value={metrics.monthlyAppointments} 
            subtext={`R$ ${metrics.serviceRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} em serviços`}
            icon="spa" 
            colorClass="bg-gray-800 dark:bg-zinc-800" 
        />
        <StatCard 
            title="Vendas de Produtos" 
            value={metrics.monthlyOrders} 
            subtext={`R$ ${metrics.productRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} em vendas`}
            icon="shopping_bag" 
            colorClass="bg-emerald-600" 
        />
        <StatCard 
            title="Ticket Médio" 
            value={`R$ ${metrics.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} 
            subtext="Geral (Vendas + Serviços)"
            icon="trending_up" 
            colorClass="bg-blue-600" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart: Revenue Evolution */}
        <div className="lg:col-span-2 bg-white dark:bg-luxury-card p-8 rounded-3xl shadow-xl border border-gold-100 dark:border-luxury-border flex flex-col transition-colors">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl font-bold text-gold-900 dark:text-gold-500">Evolução de Faturamento</h3>
                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest">Diário</span>
            </div>
            
            <div className="w-full" style={{ height: '300px', minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: axisColor, fontSize: 12 }} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: axisColor, fontSize: 12 }}
                            tickFormatter={(value) => `R$${value}`}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: tooltipBg, 
                                borderRadius: '12px', 
                                border: `1px solid ${tooltipBorder}`, 
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                            }}
                            itemStyle={{ color: isDarkMode ? '#FDFBF7' : '#1A1612' }}
                            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="faturamento" 
                            stroke="#C5A059" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Secondary Chart: Top Items */}
        <div className="bg-white dark:bg-luxury-card p-8 rounded-3xl shadow-xl border border-gold-100 dark:border-luxury-border flex flex-col transition-colors">
            <h3 className="font-serif text-xl font-bold text-gold-900 dark:text-gold-500 mb-2">Top Itens</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">Serviços e Produtos mais vendidos</p>
            
            <div className="w-full relative" style={{ height: '300px', minHeight: '300px' }}>
                {topItemsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={topItemsData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {topItemsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: tooltipBg, 
                                    borderRadius: '8px', 
                                    border: `1px solid ${tooltipBorder}`, 
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
                                }}
                                itemStyle={{ color: isDarkMode ? '#FDFBF7' : '#1A1612' }}
                            />
                            <Legend 
                                layout="horizontal" 
                                verticalAlign="bottom" 
                                align="center"
                                wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-4xl mb-2">pie_chart</span>
                        <p className="text-sm">Sem dados suficientes</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
