import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200">
            <X size={24} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
