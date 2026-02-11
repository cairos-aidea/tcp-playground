// components/ui/UniformSelect.jsx
import Select from "react-select";

export default function GlobalSelect(props) {
  return (
    <Select
      classNamePrefix="custom-select"
      className="w-full text-sm"
      styles={{
        control: (base, state) => ({
          ...base,
          borderColor: state.isFocused ? '#9ca3af' : '#d1d5db',
          borderWidth: '1px',
          boxShadow: state.isFocused ? '0 0 0 1px rgba(156, 163, 175, 0.4)' : 'none',
          '&:hover': { borderColor: '#9ca3af' },
          backgroundColor: state.isDisabled ? '#f9fafb' : 'white',
        }),
        placeholder: base => ({ ...base, color: '#9ca3af', fontSize: '0.875rem' }),
        singleValue: base => ({ ...base, color: '#374151', fontSize: '0.875rem' }),
        menu: base => ({ ...base, zIndex: 50 }),
      }}
      {...props}
    />
  );
}
