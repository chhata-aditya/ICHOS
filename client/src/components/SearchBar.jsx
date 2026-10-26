function SearchBar({ value, onChange, placeholder = 'Search songs or artists…' }) {
  return (
    <div className="search-bar">
      <label className="search-bar__label" htmlFor="ichos-search">
        Search
      </label>
      <input
        id="ichos-search"
        className="field-input"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}

export default SearchBar;
