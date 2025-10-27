'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

interface AddressSelectorProps {
  onSelectAddress: (address: Omit<Address, 'id' | 'isDefault'>) => void;
  selectedAddress?: Omit<Address, 'id' | 'isDefault'>;
}

export default function AddressSelector({ onSelectAddress, selectedAddress }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/addresses');

      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }

      const data = await response.json();
      const fetchedAddresses = data.addresses || [];
      setAddresses(fetchedAddresses);

      // Auto-select default address if available and no address is selected
      if (fetchedAddresses.length > 0 && !selectedAddress) {
        const defaultAddr = fetchedAddresses.find((addr: Address) => addr.isDefault) || fetchedAddresses[0];
        handleSelectAddress(defaultAddr);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      // Don't show error toast, just allow manual entry
      setShowManualEntry(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAddress = (address: Address) => {
    setSelectedId(address.id);
    setShowManualEntry(false);
    onSelectAddress({
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
    });
  };

  const handleManualEntry = () => {
    setSelectedId(null);
    setShowManualEntry(true);
    // Clear the selected address to allow manual entry
    onSelectAddress({
      fullName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Kenya',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Shipping Address
        </h2>
        {addresses.length > 0 && (
          <Link
            href="/addresses"
            className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage Addresses
          </Link>
        )}
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
          <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No saved addresses. Enter your shipping details below.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            💡 Tip: <Link href="/addresses" className="text-orange-600 hover:underline">Save addresses</Link> for faster checkout next time
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Saved Addresses */}
          {addresses.map((address) => (
            <button
              key={address.id}
              onClick={() => handleSelectAddress(address)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selectedId === address.id
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 ring-2 ring-orange-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {address.fullName}
                    </p>
                    {address.isDefault && (
                      <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs font-semibold rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {address.address}, {address.city}, {address.state} {address.zipCode}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {address.phone}
                  </p>
                </div>
                {selectedId === address.id && (
                  <svg className="w-6 h-6 text-orange-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}

          {/* Use Different Address Button */}
          <button
            onClick={handleManualEntry}
            className={`w-full p-4 rounded-xl border-2 border-dashed transition-all ${
              showManualEntry
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Use a Different Address</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}





