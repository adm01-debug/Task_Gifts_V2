import type { Meta, StoryObj } from '@storybook/react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const meta: Meta = {
  title: 'Data Display/Charts',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Gráficos e visualizações de dados para dashboards e relatórios.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

// Sample data
const lineData = [
  { name: 'Jan', xp: 400, coins: 240 },
  { name: 'Fev', xp: 300, coins: 139 },
  { name: 'Mar', xp: 520, coins: 380 },
  { name: 'Abr', xp: 780, coins: 490 },
  { name: 'Mai', xp: 690, coins: 410 },
  { name: 'Jun', xp: 890, coins: 560 },
];

const barData = [
  { department: 'Vendas', score: 85 },
  { department: 'Marketing', score: 72 },
  { department: 'TI', score: 91 },
  { department: 'RH', score: 78 },
  { department: 'Financeiro', score: 88 },
];

const pieData = [
  { name: 'Concluídas', value: 45, color: 'hsl(var(--success))' },
  { name: 'Em Progresso', value: 30, color: 'hsl(var(--warning))' },
  { name: 'Pendentes', value: 25, color: 'hsl(var(--muted))' },
];

const radarData = [
  { subject: 'Liderança', A: 80, B: 65 },
  { subject: 'Comunicação', A: 90, B: 70 },
  { subject: 'Técnico', A: 75, B: 85 },
  { subject: 'Inovação', A: 85, B: 60 },
  { subject: 'Colaboração', A: 70, B: 80 },
];

export const LineChartXP: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Evolução de XP e Coins</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }} 
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="xp" 
              stroke="hsl(var(--xp))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--xp))' }}
              name="XP"
            />
            <Line 
              type="monotone" 
              dataKey="coins" 
              stroke="hsl(var(--coins))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--coins))' }}
              name="Coins"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  ),
};

export const BarChartDepartments: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Score por Departamento</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="department" type="category" width={80} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }} 
            />
            <Bar 
              dataKey="score" 
              fill="hsl(var(--primary))" 
              radius={[0, 4, 4, 0]}
              name="Score"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  ),
};

export const PieChartTasks: StoryObj = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Status das Tarefas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  ),
};

export const AreaChartEngagement: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Engajamento ao Longo do Tempo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="xp" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary) / 0.2)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  ),
};

export const RadarChartCompetencies: StoryObj = {
  render: () => (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Comparação de Competências</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <Radar 
              name="Auto-avaliação" 
              dataKey="A" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary) / 0.3)" 
            />
            <Radar 
              name="Gestor" 
              dataKey="B" 
              stroke="hsl(var(--secondary))" 
              fill="hsl(var(--secondary) / 0.3)" 
            />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  ),
};
