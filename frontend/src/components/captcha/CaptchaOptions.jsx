import CaptchaOption from "./CaptchaOption";

export default function CaptchaOptions({
  options = [],
  selectedOption,
  isDisabled,
  status,
  onSelect,
}) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      {options.map((option, index) => (
        <CaptchaOption
          key={option}
          option={option}
          index={index}
          isSelected={selectedOption === option}
          isDisabled={isDisabled}
          status={status}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
