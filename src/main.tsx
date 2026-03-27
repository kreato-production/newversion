import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Application render error:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
          <div className="mx-auto max-w-4xl rounded-lg border border-red-500/40 bg-red-950/60 p-6">
            <h1 className="mb-3 text-2xl font-semibold text-red-200">
              Erro ao renderizar a aplicação
            </h1>
            <p className="mb-4 text-sm text-red-100/80">
              A interface encontrou uma exceção de runtime. O detalhe abaixo ajuda a localizar a
              causa.
            </p>
            <pre className="overflow-auto whitespace-pre-wrap rounded bg-black/30 p-4 text-sm text-red-50">
              {this.state.error.stack || this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function showFatalError(message: string) {
  const root = document.getElementById('root');

  if (!root) {
    return;
  }

  root.innerHTML = `
    <div style="min-height:100vh;background:#020617;padding:24px;color:#f8fafc;font-family:ui-monospace, SFMono-Regular, Menlo, monospace;">
      <div style="max-width:960px;margin:0 auto;border:1px solid rgba(239,68,68,.4);background:rgba(127,29,29,.45);border-radius:12px;padding:24px;">
        <h1 style="margin:0 0 12px;font-size:28px;color:#fecaca;">Erro fatal na aplicação</h1>
        <p style="margin:0 0 16px;color:rgba(254,226,226,.9);">A aplicação encontrou uma falha de runtime antes de concluir a renderização.</p>
        <pre style="white-space:pre-wrap;overflow:auto;background:rgba(0,0,0,.3);padding:16px;border-radius:8px;">${message}</pre>
      </div>
    </div>
  `;
}

window.addEventListener('error', (event) => {
  const error =
    event.error instanceof Error ? event.error.stack || event.error.message : event.message;
  console.error('Global application error:', event.error || event.message);
  showFatalError(String(error));
});

window.addEventListener('unhandledrejection', (event) => {
  const reason =
    event.reason instanceof Error
      ? event.reason.stack || event.reason.message
      : JSON.stringify(event.reason, null, 2);
  console.error('Unhandled promise rejection:', event.reason);
  showFatalError(String(reason));
});

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
