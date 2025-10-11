// src/components/ProductAttributes.js
"use client";
import { useState, useEffect } from "react";
import ColorSelector from "./ColorSelector"; // Import the reusable component

const ProductAttributes = ({ attributes, variants, setSelectedVariant }) => {
  const [selectedOptions, setSelectedOptions] = useState({});

  const handleOptionSelect = (attributeName, value) => {
    setSelectedOptions((prev) => {
      if (prev[attributeName] === value) {
        const { [attributeName]: _, ...rest } = prev;
        return rest;
      }
      console.log("Selected Options:", { ...prev, [attributeName]: value });
      return { ...prev, [attributeName]: value };
    });
  };

  const isOptionAvailable = (attributeName, value) => {
    if (selectedOptions[attributeName] === value) return true;
    const potentialSelection = { ...selectedOptions, [attributeName]: value };

    return variants.some((variant) => {
      if (typeof variant !== "object" || !Array.isArray(variant.attributes)) {
        return false;
      }
      return Object.entries(potentialSelection).every(([name, val]) =>
        variant.attributes.some(
          (attr) => attr.name === name && attr.value === val
        )
      );
    });
  };

  useEffect(() => {
    // Find a variant that exactly matches the current selectedOptions.
    const matchedVariant = variants.find((variant) => {
      // Ensure the variant has attributes.
      if (!variant.attributes || variant.attributes.length === 0) {
        return false;
      }
      // The number of selected options must match the number of attributes in the variant.
      if (Object.keys(selectedOptions).length !== variant.attributes.length) {
        return false;
      }

      // Every selected option must be present in the variant's attributes.
      return Object.entries(selectedOptions).every(([name, value]) =>
        variant.attributes.some(
          (attr) => attr.name === name && attr.value === value
        )
      );
    });

    // Call the setVariant prop with the result.
    // If no match is found, `find` returns undefined, which is what we want.
    setSelectedVariant(matchedVariant);
    console.log("Matched Variant:", matchedVariant);
  }, [selectedOptions, variants, setSelectedVariant]); // Dependencies for the effect
  return (
    <div>
      {Object.entries(attributes).map(([name, values]) => {
        // Special rendering for the "Color" attribute
        if (name === "Color") {
          return (
            <div key={name} className="py-4 border-t border-gray-200">
              <ColorSelector
                colors={values}
                selectedColor={selectedOptions[name]}
                onColorSelect={(colorValue) =>
                  handleOptionSelect(name, colorValue)
                }
                isAvailable={(colorValue) =>
                  isOptionAvailable(name, colorValue)
                }
              />
            </div>
          );
        }

        // Default rendering for all other attributes
        return (
          <div key={name} className="py-4 border-t border-gray-200">
            <h3 className="font-semibold">{name}</h3>
            <div className="flex gap-2 mt-2">
              {values.map((value) => {
                const isSelected = selectedOptions[name] === value;
                const available = isOptionAvailable(name, value);

                return (
                  <button
                    key={value}
                    onClick={() => handleOptionSelect(name, value)}
                    disabled={!available}
                    className={`px-4 py-2 border rounded transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-100 text-blue-800"
                        : "border-gray-300"
                    } ${
                      available
                        ? "cursor-pointer hover:border-blue-400"
                        : "cursor-not-allowed bg-gray-100 text-gray-400"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductAttributes;
