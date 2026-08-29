import React from 'react';

interface TimelineEvent {
  time: string;
  title: string;
  subtitle?: string;
  status: 'info' | 'warn' | 'error' | 'fatal' | 'success';
}

export const Timeline: React.FC = () => {
  const events: TimelineEvent[] = [
    {
      time: '16:30:00',
      title: 'Deployment #183',
      subtitle: 'payment-api version v1.8.2 deployed by sarah.jenkins',
      status: 'success'
    },
    {
      time: '17:00:00',
      title: 'Deployment #184',
      subtitle: 'payment-api version v1.8.3 deployed by alex.chen (Connection pool size & timeout optimization)',
      status: 'info'
    },
    {
      time: '17:02:30',
      title: 'Connection pool warning',
      subtitle: 'Active connection count reached threshold: 48/50 connections occupied',
      status: 'warn'
    },
    {
      time: '17:03:10',
      title: 'Database connection timeout',
      subtitle: 'Payment processing failed: Connection timeout after 5000ms',
      status: 'error'
    },
    {
      time: '17:03:45',
      title: 'Pool exhausted',
      subtitle: 'DB Connection Pool Exhausted: 50/50 active connections, 142 queued requests',
      status: 'fatal'
    },
    {
      time: '17:04:12',
      title: 'Connection reset',
      subtitle: 'Connection reset by peer: Database connection terminated unexpectedly',
      status: 'error'
    },
    {
      time: '17:04:30',
      title: 'Pod health checks begin failing',
      subtitle: 'Liveness probe failed for container payment-service (HTTP 500)',
      status: 'fatal'
    }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5">
        Incident Timeline &amp; Event Sequence
      </h3>

      <div className="relative pl-6 border-l-2 border-gray-200 space-y-6">
        {events.map((evt, idx) => {
          let dot = <div className="w-3 h-3 rounded-full bg-blue-500"></div>;
          let textColor = 'text-gray-900';

          if (evt.status === 'success') {
            dot = <div className="w-3 h-3 rounded-full bg-emerald-500"></div>;
          } else if (evt.status === 'warn') {
            dot = <div className="w-3 h-3 rounded-full bg-amber-500"></div>;
            textColor = 'text-amber-900';
          } else if (evt.status === 'error') {
            dot = <div className="w-3 h-3 rounded-full bg-red-500"></div>;
            textColor = 'text-red-900';
          } else if (evt.status === 'fatal') {
            dot = <div className="w-3 h-3 rounded-full bg-red-600 ring-4 ring-red-100"></div>;
            textColor = 'text-red-950 font-bold';
          }

          return (
            <div key={idx} className="relative group">
              <div className="absolute -left-[31px] top-1 bg-white p-0.5 rounded-full">
                {dot}
              </div>

              <div className="flex items-baseline justify-between">
                <h4 className={`text-sm font-semibold ${textColor}`}>{evt.title}</h4>
                <span className="text-xs font-mono text-gray-400">{evt.time}</span>
              </div>

              {evt.subtitle && (
                <p className="text-xs text-gray-600 mt-0.5">{evt.subtitle}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
