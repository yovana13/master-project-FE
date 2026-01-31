import { Fragment } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Fragment>
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </Fragment>
  );
}
