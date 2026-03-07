"use client";

const steps = ["Basics", "Race", "Class", "Skills", "Equipment", "Summary"];

export default function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
              ${i < currentStep ? "bg-green-600 text-white" : ""}
              ${i === currentStep ? "bg-amber-600 text-white ring-2 ring-amber-400" : ""}
              ${i > currentStep ? "bg-gray-700 text-gray-400" : ""}
            `}
          >
            {i < currentStep ? "✓" : i + 1}
          </div>
          <span
            className={`ml-1 text-xs hidden sm:inline ${
              i === currentStep ? "text-amber-400 font-bold" : "text-gray-500"
            }`}
          >
            {step}
          </span>
          {i < steps.length - 1 && (
            <div className={`w-6 h-0.5 mx-1 ${i < currentStep ? "bg-green-600" : "bg-gray-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
