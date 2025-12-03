// app/dashboard/components/FormError.js
import React from "react";
import { CloseOutlined } from "@ant-design/icons";

const FormError = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Text Content */}
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-red-800 m-0 leading-none">
          Submission Failed
        </h4>
        <p className="text-sm text-red-600 mt-1 m-0 leading-relaxed">{error}</p>
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-400 cursor-pointer hover:text-red-600 transition-colors focus:outline-none shrink-0"
          type="button"
        >
          <CloseOutlined className="text-xs" />
        </button>
      )}
    </div>
  );
};

export default FormError;
