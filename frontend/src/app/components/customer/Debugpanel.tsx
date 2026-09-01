import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface DebugPanelProps {
  productId?: string;
  product?: any;
  store?: any;
  products?: any[];
  stores?: any[];
  isLoading?: boolean;
}

export function DebugPanel({ productId, product, store, products = [], stores = [], isLoading }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (isLoading) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-bold text-sm">🐛 DEBUG PANEL</h3>
        <ChevronDown
          size={18}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="border-t border-gray-700 p-4 max-h-96 overflow-y-auto text-xs font-mono">
          {/* Product Info */}
          <div className="mb-4 pb-4 border-b border-gray-700">
            <div className="text-yellow-400 font-bold mb-2">📦 PRODUCT</div>
            <div className="text-gray-300 space-y-1">
              <div>ProductId Param: <span className="text-cyan-400">{productId}</span></div>
              <div>Product Found: <span className={product ? 'text-green-400' : 'text-red-400'}>{product ? '✅ YES' : '❌ NO'}</span></div>
              {product && (
                <>
                  <div>Product ID: <span className="text-cyan-400">{product.id}</span></div>
                  <div>Product Name: <span className="text-cyan-400">{product.name}</span></div>
                  <div>Product StoreId: <span className="text-cyan-400">{product.storeId}</span></div>
                  <div>Product StoreName: <span className="text-cyan-400">{product.storeName}</span></div>
                </>
              )}
            </div>
          </div>

          {/* Store Info */}
          <div className="mb-4 pb-4 border-b border-gray-700">
            <div className="text-yellow-400 font-bold mb-2">🏪 STORE</div>
            <div className="text-gray-300 space-y-1">
              <div>Store Found: <span className={store ? 'text-green-400' : 'text-red-400'}>{store ? '✅ YES' : '❌ NO'}</span></div>
              {store ? (
                <>
                  <div>Store ID: <span className="text-cyan-400">{store.id}</span></div>
                  <div>Store Name: <span className="text-cyan-400">{store.name}</span></div>
                  <div>Store City: <span className="text-cyan-400">{store.city}</span></div>
                </>
              ) : (
                <div className="text-red-400">⚠️ Store lookup failed!</div>
              )}
            </div>
          </div>

          {/* Arrays Info */}
          <div className="mb-4 pb-4 border-b border-gray-700">
            <div className="text-yellow-400 font-bold mb-2">📊 ARRAYS</div>
            <div className="text-gray-300 space-y-1">
              <div>Products Count: <span className="text-cyan-400">{products.length}</span></div>
              <div>Stores Count: <span className="text-cyan-400">{stores.length}</span></div>
              
              {stores.length === 0 && (
                <div className="text-red-400 mt-2">⚠️ STORES ARRAY IS EMPTY!</div>
              )}

              {stores.length > 0 && product && (
                <>
                  <div className="mt-2 text-magenta-400">Looking for product storeId:</div>
                  <div className="ml-2 text-cyan-400">{product.storeId}</div>
                  <div className="mt-2 text-magenta-400">Available store objects:</div>
                  <div className="ml-2 space-y-2 bg-gray-800 p-2 rounded">
                    {stores.map((s: any, idx: number) => (
                      <div
                        key={s.id}
                        className={s.id === product.storeId ? 'text-green-400 bg-green-900 bg-opacity-30 p-1 rounded' : 'text-gray-400'}
                      >
                        <div>{idx + 1}. Store Object:</div>
                        <div className="ml-2 space-y-0.5 text-xs">
                          <div>store.id: <span className="text-yellow-400">{s.id}</span></div>
                          <div>store.name: <span className="text-yellow-400">{s.name}</span></div>
                          <div>Matches product.storeId? {s.id === product.storeId ? '✅ YES' : '❌ NO'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Match Analysis */}
          <div className="text-yellow-400 font-bold mb-2">🔍 MATCH ANALYSIS</div>
          <div className="text-gray-300 space-y-1">
            {product && stores.length > 0 ? (
              <>
                <div>Looking for: <span className="text-cyan-400">"{product.storeId}"</span></div>
                <div>
                  Result:{' '}
                  {stores.find((s: any) => String(s.id) === String(product.storeId))
                    ? '✅ MATCH FOUND'
                    : '❌ NO MATCH'}
                </div>
              </>
            ) : (
              <div className="text-red-400">Cannot perform match (missing product or stores)</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}