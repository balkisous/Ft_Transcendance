import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '@/components/Layout';
import Home from '.';


function App({ Component, pageProps }: AppProps) {
  return (
    <div>
      <Layout {...pageProps}>
      <Component {...pageProps} />
      </Layout>
    </div>
  );
}

export default App;
