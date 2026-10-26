function VibeInput({
  value,
  onChange,
  onGenerate,
  placeholder = 'What are you feeling?',
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onGenerate?.(value);
  };

  return (
    <form className="vibe-input" onSubmit={handleSubmit}>
      <label className="vibe-input__label" htmlFor="vibe-prompt">
        Describe your moment
      </label>
      <textarea
        id="vibe-prompt"
        className="field-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
      />
      <button type="submit" className="btn btn-primary vibe-input__submit">
        Generate
      </button>
    </form>
  );
}

export default VibeInput;
