"use client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const SearchParamsProvider = ({ onParamsChange }) => {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Convert searchParams to a plain object
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    onParamsChange(params);
  }, [searchParams, onParamsChange]);

  return null; // This component doesn't render anything
};

export default SearchParamsProvider;
