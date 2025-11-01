import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SalesChart = ({ salesData }) => {
  const labels = salesData.map(d => {
    const dateParts = d._id.split('-');
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Daily Sales (₹)',
        data: salesData.map(d => d.totalSales),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Last 7 Days Sales' },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return <Bar options={options} data={data} />;
};

export default SalesChart;