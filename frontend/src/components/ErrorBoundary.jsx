import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.error("Unhandled application error", error); }
  render() {
    if (this.state.hasError) return <main className="min-h-screen grid place-items-center bg-slate-50 p-6"><section className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><p className="text-2xl">Something went wrong</p><p className="mt-2 text-slate-500">Please reload the page. If this keeps happening, contact support.</p><button className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-white" onClick={() => window.location.reload()}>Reload page</button></section></main>;
    return this.props.children;
  }
}
