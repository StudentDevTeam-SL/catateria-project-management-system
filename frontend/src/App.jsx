import { AuthProvider } from './store/AuthContext.jsx';
import { CartProvider } from './store/CartContext.jsx';
import { useToast }    from './hooks/useToast.js';
import Toast           from './components/Toast.jsx';
import AppRouter       from './routes/AppRouter.jsx';
import './styles/index.css';

function AppWithProviders() {
  const { toasts, toast, dismiss } = useToast();

  return (
    <>
      <AppRouter toast={toast} />
      <Toast toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppWithProviders />
      </CartProvider>
    </AuthProvider>
  );
}
