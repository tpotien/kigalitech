import { useEffect } from 'react';
import Router from 'next/router';

let timeout;

function setProgress(pct) {
  const bar = document.getElementById('page-progress-bar');
  if (!bar) return;
  bar.style.width = pct + '%';
  bar.style.opacity = pct < 100 ? '1' : '0';
  if (pct >= 100) {
    clearTimeout(timeout);
    timeout = setTimeout(() => { bar.style.width = '0%'; }, 300);
  }
}

export default function PageProgress() {
  useEffect(() => {
    let prog = 0;
    let ticker;

    function start() {
      prog = 0;
      setProgress(1);
      ticker = setInterval(() => {
        prog = Math.min(prog + Math.random() * 15, 90);
        setProgress(prog);
      }, 200);
    }

    function done() {
      clearInterval(ticker);
      setProgress(100);
    }

    Router.events.on('routeChangeStart', start);
    Router.events.on('routeChangeComplete', done);
    Router.events.on('routeChangeError', done);
    return () => {
      Router.events.off('routeChangeStart', start);
      Router.events.off('routeChangeComplete', done);
      Router.events.off('routeChangeError', done);
      clearInterval(ticker);
    };
  }, []);

  return (
    <div
      id="page-progress-bar"
      style={{
        position: 'fixed', top: 0, left: 0, height: '3px', width: '0%',
        background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
        zIndex: 9999, opacity: 0,
        transition: 'width 0.2s ease, opacity 0.3s ease',
        boxShadow: '0 0 8px #0ea5e9, 0 0 4px #7dd3fc',
        borderRadius: '0 2px 2px 0',
      }}
    />
  );
}
