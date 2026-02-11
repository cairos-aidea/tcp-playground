import { useState, useRef } from "react";
import { Search as SearchIcon } from "lucide-react";

const Search = ({ value, onChange, placeholder = "Search..." }) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  // Expand width on focus, shrink on blur
  const inputWidth = focused || value ? "w-48 md:w-64" : "w-0 px-0";

  return (
    <div className="flex items-center">
      <div className={`flex items-center bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 shadow-sm`}
        onClick={() => {
          setFocused(true);
          inputRef.current?.focus();
        }}
        style={{ cursor: "pointer", minHeight: 40 }}
      >
        <span className="flex items-center justify-center px-3 text-gray-500">
          <SearchIcon size={20} />
        </span>
        <input
          ref={inputRef}
          placeholder={placeholder}
          className={`bg-transparent border-none transition-all duration-300 ${inputWidth} text-sm`}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            minWidth: 0,
            width: focused || value ? undefined : 0,
          }}
        />
      </div>
    </div>
  );
};

export default Search;
