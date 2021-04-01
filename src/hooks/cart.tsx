/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable consistent-return */
import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const data = await AsyncStorage.getItem('@GoMarketplaceCart');
      const list = JSON.parse(data ?? '[]');

      setProducts(list);
    }

    loadProducts();
  }, []);

  const saveChanges = useCallback(async (productList: Product[]) => {
    await AsyncStorage.setItem(
      '@GoMarketplaceCart',
      JSON.stringify(productList),
    );

    setProducts(productList);
  }, []);

  const increment = useCallback(
    async (id: string) => {
      const productList = products.map(product => {
        if (product.id === id) product.quantity++;

        return product;
      });

      await saveChanges(productList);
    },
    [products, saveChanges],
  );

  const decrement = useCallback(
    async (id: string) => {
      const productList = products
        .map(product => {
          if (product.id === id) product.quantity--;

          return product;
        })
        .filter(product => product.quantity > 0);

      await saveChanges(productList);
    },
    [products, saveChanges],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const alreadyInCart =
        products.filter(item => {
          return item.id === product.id;
        }).length > 0;

      if (alreadyInCart) return increment(product.id);

      const newProduct: Product = {
        ...product,
        quantity: 1,
      };

      const productList = [...products, newProduct];

      await saveChanges(productList);
    },
    [products, increment, saveChanges],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
