"use client";

interface Props {
  name: string;
  history: string;
  freeLanguage: string;
  onNameChange: (name: string) => void;
  onHistoryChange: (history: string) => void;
  onLanguageChange: (lang: string) => void;
}

const languages = [
  "Common",
  "Elvish",
  "Dwarvish",
  "Orcish",
  "Halfling",
  "Ogre",
  "Draconic",
  "Sylvan",
  "Abyssal",
  "Celestial",
  "Infernal",
];

export default function BasicsStep({
  name,
  history,
  freeLanguage,
  onNameChange,
  onHistoryChange,
  onLanguageChange,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-amber-400">Character Basics</h2>
      <p className="text-gray-400 text-sm">
        Decide who your character is, what they have done in their life, what they love, and what they hate.
        You are creating a first level character.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Character Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          placeholder="Enter your character's name..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Free Starting Language
        </label>
        <p className="text-gray-500 text-xs mb-2">
          Each character starts with one free language. Common is recommended for new characters.
        </p>
        <select
          value={freeLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Character History</label>
        <textarea
          value={history}
          onChange={(e) => onHistoryChange(e.target.value)}
          rows={5}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-y"
          placeholder="Write your character's backstory..."
        />
      </div>
    </div>
  );
}
